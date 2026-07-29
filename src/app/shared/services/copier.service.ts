import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class CopierService {
  private readonly platformId = inject(PLATFORM_ID);

  async copyText(text: string): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return this.fallbackCopy(text);
      }
    }
    return this.fallbackCopy(text);
  }

  private fallbackCopy(text: string): boolean {
    const textarea = document.createElement('textarea');
    textarea.style.fontSize = '12pt';
    textarea.classList.add('cdk-visually-hidden');
    const yPosition = window.pageYOffset || document.documentElement.scrollTop;
    textarea.style.top = `${yPosition}px`;
    textarea.setAttribute('readonly', '');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const copySuccessful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copySuccessful;
  }
}
