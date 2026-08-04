import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { LoginService } from '@/app/domains/auth/services/login.service';
import { LocalConstants, LocalStoreService } from '@/app/shared/services/local-store.service';

export function initializeApp() {
  const platformId = inject(PLATFORM_ID);
  const loginService = inject(LoginService);
  const ls = inject(LocalStoreService);

  return () => {
    if (!isPlatformBrowser(platformId)) {
      return Promise.resolve(true);
    }

    const token = ls.getItem(LocalConstants.JWT_TOKEN);
    if (token) {
      return loginService.checkTokenIsValid().toPromise();
    }
    loginService.getUrlServices();
    return Promise.resolve(true);
  };
}
