import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
  private readonly snackBar = inject(MatSnackBar);

  info(title: string, text?: string) {
    this.snackBar.open(`${title}${text ? ': ' + text : ''}`, 'Cerrar', { duration: 5000 });
  }

  success(title: string, text?: string) {
    this.snackBar.open(`${title}${text ? ': ' + text : ''}`, 'Cerrar', { duration: 5000 });
  }

  warn(title: string, text?: string) {
    this.snackBar.open(`${title}${text ? ': ' + text : ''}`, 'Cerrar', { duration: 5000 });
  }

  error(title: string, text?: string) {
    this.snackBar.open(`${title}${text ? ': ' + text : ''}`, 'Cerrar', { duration: 5000 });
  }

  confirm(title: string, text?: string): Promise<boolean> {
    return Promise.resolve(true);
  }

  toast(title: string, text?: string, _opts?: Record<string, unknown>) {
    this.snackBar.open(`${title}${text ? ': ' + text : ''}`, 'Cerrar', { duration: 3000 });
  }
}
