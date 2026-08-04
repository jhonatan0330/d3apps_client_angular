import { Component, inject, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  required,
  submit,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoginService } from '@/app/domains/auth/services/login.service';

@Component({
  selector: 'auth-sign-in',
  templateUrl: './sign-in.html',
  imports: [
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressBarModule,
    FormField,
  ],
})
export default class AuthSignIn {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly loginService = inject(LoginService);

  protected isLoading = signal(false);
  protected errorMessage = signal('');

  protected signInFormModel = signal({
    email: '',
    password: '',
  });
  protected signInForm = form(this.signInFormModel, (f) => {
    required(f.email, { message: 'Debe ingresar un correo electronico' });
    email(f.email, { message: 'Debe ingresar un correo electronico valido' });
    required(f.password, { message: 'Debe ingresar una contrasena' });
  });

  ngOnInit(): void {
    this.loginService.getUrlServices();
  }

  signIn(event: Event) {
    event.preventDefault();

    submit(this.signInForm, async () => {
      const { email, password } = this.signInFormModel();
      this.isLoading.set(true);
      this.errorMessage.set('');

      this.loginService.signin(email, password, null).subscribe({
        next: (result) => {
          if (result) {
            this.loginService.authenticationOK(result);
            const redirectURL =
              this.route.snapshot.queryParamMap.get('redirectURL') ||
              '/admin/main';
            this.router.navigateByUrl(redirectURL);
          }
          this.isLoading.set(false);
        },
        error: (response: string) => {
          this.isLoading.set(false);
          if (response?.startsWith('Por seguridad')) {
            this.router.navigateByUrl('/auth/forgot-password');
          } else {
            this.errorMessage.set(response || 'Error de autenticacion');
          }
        },
      });
    });
  }
}
