import { inject } from '@angular/core';
import { LoginService } from '@/app/domains/auth/services/login.service';
import { LocalConstants, LocalStoreService } from '@/app/shared/services/local-store.service';

export function initializeApp() {
  const loginService = inject(LoginService);
  const ls = inject(LocalStoreService);

  return () => {
    const token = ls.getItem(LocalConstants.JWT_TOKEN);
    if (token) {
      return loginService.checkTokenIsValid().toPromise();
    }
    loginService.getUrlServices();
    return Promise.resolve(true);
  };
}
