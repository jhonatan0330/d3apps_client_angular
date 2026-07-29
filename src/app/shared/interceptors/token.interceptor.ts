import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { TemplateService } from '@/app/domains/admin/modules/neuron/services/template.service';

function isIsoDateString(value: unknown): boolean {
  if (!value) return false;
  return value instanceof Date;
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
  if (!value) return false;
  if (typeof value === 'string' && /\d*-\d*-\d*@/g.test(value)) return true;
  return false;
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

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const templateService = inject(TemplateService);
  const token = templateService.getTokenConnection(req.url);

  const changedReq = token
    ? req.clone({ setHeaders: { Authorization: token } })
    : req;

  convert(changedReq.body);

  return next(changedReq).pipe(
    map((event) => {
      if (event instanceof HttpResponse) {
        convertResponse(event.body);
      }
      return event;
    }),
  );
};
