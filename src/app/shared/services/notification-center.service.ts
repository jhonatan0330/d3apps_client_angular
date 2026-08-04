import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '@/app/shared/components/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

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

  async confirm(title: string, text?: string): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title, message: text } as ConfirmDialogData,
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    return result === true;
  }

  toast(title: string, text?: string, _opts?: Record<string, unknown>) {
    this.snackBar.open(`${title}${text ? ': ' + text : ''}`, 'Cerrar', { duration: 3000 });
  }
}
