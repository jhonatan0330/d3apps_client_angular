import { Component, inject, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  required,
  submit,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from '@/app/domains/auth/services/login.service';

@Component({
  selector: 'auth-forgot-password',
  templateUrl: './forgot-password.html',
  imports: [
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    FormField,
  ],
})
export default class AuthForgotPassword {
  private readonly router = inject(Router);
  private readonly loginService = inject(LoginService);

  protected isLoading = signal(false);
  protected successMessage = signal('');
  protected errorMessage = signal('');

  protected forgotFormModel = signal({
    identification: '',
    email: '',
  });

  protected forgotForm = form(this.forgotFormModel, (form) => {
    required(form.identification, { message: 'Debe ingresar su identificacion' });
    required(form.email, { message: 'Debe ingresar su correo' });
    email(form.email, { message: 'Debe ingresar un correo valido' });
  });

  recoverPassword(event: Event): void {
    event.preventDefault();

    submit(this.forgotForm, async () => {
      this.isLoading.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');

      const { identification, email: correo } = this.forgotFormModel();

      this.loginService.recoverPassword(identification, correo).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.successMessage.set(
            'Se ha enviado un correo con las instrucciones para recuperar su contrasena.',
          );
        },
        error: (response: string) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            response || 'Error al solicitar recuperacion de contrasena',
          );
        },
      });
    });
  }
}
