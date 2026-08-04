import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { TemplateService } from '@/app/domains/admin/modules/neuron/services/template.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const templateService = inject(TemplateService);
  const token = templateService.getTokenConnection(req.url);

  const changedReq = token
    ? req.clone({ setHeaders: { Authorization: token } })
    : req;

  return next(changedReq);
};
