import { Injectable, inject, signal } from '@angular/core';
import { LocalConstants, LocalStoreService } from '@/app/shared/services/local-store.service';
import { UsuarioDTO } from '@/app/domains/auth/domain/auth.domain';
import { environment } from '@/environments/environment';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly ls = inject(LocalStoreService);

  readonly user = signal<UsuarioDTO | null>(null);
  private _token: string | null = null;

  get token(): string | null {
    if (!this._token) {
      this._token = this.getJwtToken() as string | null;
    }
    return this._token;
  }

  set token(value: string | null) {
    this._token = value;
  }

  getJwtToken(): unknown {
    return this.ls.getItem(LocalConstants.JWT_TOKEN);
  }

  getUser(): unknown {
    return this.ls.getItem(LocalConstants.APP_USER);
  }

  setToken(token: string | null): void {
    this._token = token;
    this.ls.setItem(LocalConstants.JWT_TOKEN, token);
  }

  setUser(user: UsuarioDTO | null): void {
    this.user.set(user);
    this.ls.setItem(LocalConstants.APP_USER, user);
  }

  setTokenAndUser(token: string | null, user: UsuarioDTO | null): void {
    this._token = token;
    this.ls.setItem(LocalConstants.JWT_TOKEN, token);
    this.user.set(user);
    this.ls.setItem(LocalConstants.APP_USER, user);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      if (!exp) return false;
      return Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  }

  clear(): void {
    this._token = null;
    this.user.set(null);
    this.ls.setItem(LocalConstants.JWT_TOKEN, null);
    this.ls.setItem(LocalConstants.APP_USER, null);
  }
}
