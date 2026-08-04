import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

function isIsoDateString(value: unknown): boolean {
  if (!value || typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}

function convert(body: unknown): void {
  if (!body || typeof body !== 'object') return;
  for (const key of Object.keys(body as Record<string, unknown>)) {
    const value = (body as Record<string, unknown>)[key];
    if (isIsoDateString(value)) {
      (body as Record<string, unknown>)[key] = new Date(value as string)
        .toISOString()
        .replace('T', '@')
        .replace('Z', '-0000');
    } else if (typeof value === 'object') {
      convert(value);
    }
  }
}

function isStringDate(value: unknown): boolean {
  if (!value || typeof value !== 'string') return false;
  return /\d*-\d*-\d*@/g.test(value);
}

function convertResponse(body: unknown): void {
  if (!body || typeof body !== 'object') return;
  for (const key of Object.keys(body as Record<string, unknown>)) {
    const value = (body as Record<string, unknown>)[key];
    if (isStringDate(value)) {
      (body as Record<string, unknown>)[key] = new Date(
        (value as string).replace('@', 'T').replace('-0000', 'Z'),
      );
    } else if (typeof value === 'object') {
      convertResponse(value);
    }
  }
}

export const dateConversionInterceptor: HttpInterceptorFn = (req, next) => {
  convert(req.body);

  return next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse) {
        convertResponse(event.body);
      }
      return event;
    }),
  );
};
