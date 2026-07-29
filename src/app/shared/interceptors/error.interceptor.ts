import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { LoginService } from '@/app/domains/auth/services/login.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const jwtAuth = inject(LoginService);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error) => {
      let errorMessage = '';

      if (error.error?.message) {
        errorMessage = error.error.message;

        if (
          errorMessage.includes('CODE:caud_usuario') ||
          errorMessage.includes("Required request header 'Authorization'")
        ) {
          jwtAuth.signout();
        } else if (
          errorMessage.includes('CODE:private_user') ||
          errorMessage.includes("Required request header 'Authorization'")
        ) {
          jwtAuth.signout();
        } else {
          if (errorMessage.includes('ERROR: NOT_OK')) {
            errorMessage = errorMessage.substring(
              errorMessage.indexOf('ERROR: NOT_OK') + 'ERROR: NOT_OK'.length,
            );
            const audio = new Audio();
            audio.src = 'assets/audio/incorrect.mp3';
            audio.load();
            audio.play();
          }
          snackBar.open(errorMessage, 'Cerrar', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
        }
      } else {
        errorMessage = `Connection error: ${error.status} ${error.message}`;
        if (
          !(error.status === 404 && error.message?.includes('conf.xml'))
        ) {
          snackBar.open('Error de conexion', errorMessage, {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
        }
      }

      return throwError(() => errorMessage);
    }),
  );
};
