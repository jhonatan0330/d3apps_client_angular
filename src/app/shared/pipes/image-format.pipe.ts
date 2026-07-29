import { Pipe, PipeTransform, inject } from '@angular/core';
import { LocalConstants, LocalStoreService } from '@/app/shared/services/local-store.service';

export function formatImageUrl(ls: LocalStoreService, url: string): string {
  if (!url) return url;
  if (url.startsWith('www.')) {
    url = 'http://' + url;
  }
  if (!url.startsWith('http')) {
    url = (ls.getItem(LocalConstants.URL_CONF) as string || '') + '/files' + url;
  }
  return url;
}

@Pipe({ name: 'imageFormat', standalone: true })
export class ImageFormatPipe implements PipeTransform {
  private readonly ls = inject(LocalStoreService);

  transform(url: string): string {
    return formatImageUrl(this.ls, url);
  }
}
