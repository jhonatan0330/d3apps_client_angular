import { Component, OnInit, inject, signal } from '@angular/core';
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
export default class AuthSignIn implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly loginService = inject(LoginService);

  protected isLoading = signal(false);
  protected errorMessage = signal('');

  protected signInFormModel = signal({
    email: '',
    password: '',
  });

  protected signInForm = form(this.signInFormModel, (form) => {
    required(form.email, { message: 'Debe ingresar un usuario' });
    required(form.password, { message: 'Debe ingresar una contrasena' });
  });

  ngOnInit(): void {
    this.loginService.getUrlServices();
  }

  signIn(event: Event): void {
    event.preventDefault();

    submit(this.signInForm, async () => {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const { email: username, password } = this.signInFormModel();

      this.loginService.signin(username, password, null).subscribe({
        next: (result) => {
          if (result) {
            this.loginService.authenticationOK(result);
            const redirectURL =
              this.route.snapshot.queryParamMap.get('redirectURL') || '/admin/main';
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
