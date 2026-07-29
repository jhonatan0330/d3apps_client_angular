import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { LoginService } from '@/app/domains/auth/services/login.service';

export const authGuard: CanActivateFn = (_route, state): Observable<boolean> => {
  const authService = inject(LoginService);
  const router = inject(Router);

  const redirectUrl = state.url === '/sign-out' ? '/' : state.url;

  return authService.checkTokenIsValid().pipe(
    switchMap((authenticated) => {
      if (!authenticated) {
        router.navigate(['/auth/sign-in'], {
          queryParams: { redirectURL: redirectUrl },
        });
        return of(false);
      }
      return of(true);
    }),
  );
};
