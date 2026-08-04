import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '@/app/domains/auth/services/login.service';

export const redirectIfAuthenticated: CanActivateFn = () => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  if (loginService.isLoggedIn()) {
    router.navigateByUrl('/admin/main');
    return false;
  }
  return true;
};
