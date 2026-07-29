import { Component, inject, signal } from '@angular/core';
import {
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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoginService } from '@/app/domains/auth/services/login.service';

@Component({
  selector: 'auth-reset-password',
  templateUrl: './reset-password.html',
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
export default class AuthResetPassword {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly loginService = inject(LoginService);

  protected isLoading = signal(false);
  protected errorMessage = signal('');

  protected resetFormModel = signal({
    newPassword: '',
    confirmPassword: '',
  });

  protected resetForm = form(this.resetFormModel, (form) => {
    required(form.newPassword, { message: 'Debe ingresar una contrasena' });
    required(form.confirmPassword, { message: 'Debe confirmar la contrasena' });
  });

  resetPassword(event: Event): void {
    event.preventDefault();

    submit(this.resetForm, async () => {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const { newPassword, confirmPassword } = this.resetFormModel();

      if (newPassword !== confirmPassword) {
        this.isLoading.set(false);
        this.errorMessage.set('Las contrasenas no coinciden');
        return;
      }

      const authorizationId = this.route.snapshot.queryParamMap.get('id') || '';

      this.loginService
        .changePwd('', newPassword, authorizationId)
        .subscribe({
          next: () => {
            this.isLoading.set(false);
            this.router.navigateByUrl('/auth/sign-in');
          },
          error: (response: string) => {
            this.isLoading.set(false);
            this.errorMessage.set(response || 'Error al cambiar la contrasena');
          },
        });
    });
  }
}
