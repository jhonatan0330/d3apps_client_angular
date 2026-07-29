import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import DashboardComponent from '@/app/domains/admin/modules/authorization/features/dashboard/dashboard';

@Component({
  standalone: true,
  selector: 'app-buscador',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, DashboardComponent],
  template: `
    <div class="flex flex-col h-full max-h-[90vh] overflow-hidden">
      <div class="flex justify-end p-2">
        <button matIconButton mat-dialog-close>
          <mat-icon svgIcon="x" />
        </button>
      </div>
      <div class="flex-1 overflow-y-auto">
        <app-dashboard [showTemplates]="true" />
      </div>
    </div>
  `,
})
export class BuscadorComponent {}
