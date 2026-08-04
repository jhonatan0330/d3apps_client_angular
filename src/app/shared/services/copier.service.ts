import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CopierService {
  async copyText(text: string): Promise<boolean> {
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
