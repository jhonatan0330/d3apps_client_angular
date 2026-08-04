import { Injectable } from '@angular/core';

export const LocalConstants = {
  JWT_TOKEN: 'JWT_TOKEN',
  PUBLIC_TOKEN: 'PUBLIC_TOKEN',
  APP_USER: 'EGRET_USER',
  TEMPLATES: 'SW42_TEMPLATES',
  URL_CONF: 'URL_CONF',
  SERVERS: 'SERVERS',
};

@Injectable({ providedIn: 'root' })
export class LocalStoreService {
  private get ls(): Storage {
    return window.localStorage;
  }

  setItem(key: string, value: unknown): boolean {
    const storage = this.ls;
    if (!storage) return false;
    storage.setItem(key, JSON.stringify(value));
    return true;
  }

  getItem(key: string): unknown {
    const storage = this.ls;
    if (!storage) return null;
    const value = storage.getItem(key);
    try {
      return JSON.parse(value ?? 'null');
    } catch {
      return null;
    }
  }

  clear(): void {
    this.ls?.clear();
  }

  getUrlAccess(endpoint: string, server: string | null = null): string {
    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint;
    }
    let url = this.getUrl4Id(server);
    if (!url) {
      url = this.getItem(LocalConstants.URL_CONF) as string | null;
    }
    if (!url) {
      url = '';
    }
    return url.concat(endpoint);
  }

  private getUrl4Id(id: string | null): string | null {
    if (!id) return null;
    const otherSystems = this.getItem(LocalConstants.SERVERS) as
      | { llaveTabla: string; servidorUrl: string }[]
      | null;
    if (!otherSystems) return null;
    const org = otherSystems.find((item) => id === item.llaveTabla);
    return org ? org.servidorUrl : null;
  }
}
