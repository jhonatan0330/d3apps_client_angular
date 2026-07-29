import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'neuron-success',
  template: `
    <div class="p-6 text-center">
      <mat-icon class="mb-4 text-green-500" [style.fontSize.px]="64">check_circle</mat-icon>
      <h2 class="text-xl font-bold">Operacion exitosa</h2>
      @if (data?.data) {
        <div class="mt-4" [innerHTML]="data.data"></div>
      }
      <button matButton="filled" class="mt-6" mat-dialog-close>Cerrar</button>
    </div>
  `,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
})
export class SuccessComponent {
  protected readonly data = inject(MAT_DIALOG_DATA, { optional: true });
}
