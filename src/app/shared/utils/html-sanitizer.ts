import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { inject, Injectable } from '@angular/core';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'blockquote', 'pre', 'code', 'hr', 'sub', 'sup', 'small', 'mark',
];

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ['href', 'target', 'rel', 'title'],
  img: ['src', 'alt', 'width', 'height', 'loading'],
  span: ['style', 'class'],
  div: ['style', 'class'],
  p: ['style', 'class'],
  td: ['colspan', 'rowspan', 'style', 'class'],
  th: ['colspan', 'rowspan', 'style', 'class'],
};

const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:'];

function sanitizeNode(node: Node): void {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tag = el.tagName.toLowerCase();

      if (!ALLOWED_TAGS.includes(tag)) {
        el.remove();
        continue;
      }

      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const attrName = attr.name.toLowerCase();
        const allowedForTag = ALLOWED_ATTRS[tag] ?? [];
        if (!allowedForTag.includes(attrName) && attrName !== 'class') {
          el.removeAttribute(attr.name);
          continue;
        }

        if (attrName === 'href' || attrName === 'src') {
          const value = attr.value.toLowerCase().trim();
          if (DANGEROUS_PROTOCOLS.some((proto) => value.startsWith(proto))) {
            el.removeAttribute(attr.name);
          }
        }
      }

      sanitizeNode(child);
    }
  }
}

@Injectable({ providedIn: 'root' })
export class HtmlSanitizerService {
  private readonly sanitizer = inject(DomSanitizer);

  sanitize(html: string): SafeHtml {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    sanitizeNode(doc.body);
    return this.sanitizer.bypassSecurityTrustHtml(doc.body.innerHTML);
  }
}
