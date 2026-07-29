import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '@/app/domains/admin/modules/neuron/services/api.service';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';
import { BaseComponent } from '../base/base';

@Component({
  selector: 'neuron-control-archivo',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <div [style.display]="(isInvisible || isSectionInvisible) ? 'none': 'block'" class="py-2">
      <div class="text-sm font-medium mb-1">{{ structure.nombre }}</div>
      @if (isLoading) { <mat-progress-bar mode="indeterminate"></mat-progress-bar> }
      @if (data.valorText) {
        <div class="flex items-center gap-2">
          <a [href]="data.valorText" target="_blank" class="text-blue-600 underline text-sm truncate max-w-[200px]">{{ data.valorText }}</a>
          @if (isEnabled) {
            <button mat-icon-button (click)="clearFile()" tabindex="-1"><mat-icon>delete</mat-icon></button>
          }
        </div>
      }
      @if (isEnabled && !data.valorText) {
        <button mat-stroked-button (click)="fileInput.click()">
          <mat-icon>upload_file</mat-icon> Seleccionar archivo
        </button>
        <input #fileInput type="file" hidden (change)="onFileSelected($event)" />
      }
    </div>
  `,
})
export default class ArchivoControl extends BaseComponent implements OnInit {
  private readonly api = inject(ApiService);

  override ngOnInit(): void {
    super.ngOnInit();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.isLoading = true;
    this.api.uploadFile(file, this.urlServer).subscribe({
      next: (result) => {
        this.data.valorText = result.message || file.name;
        this.data.modificado = true;
        this.avisarModificacion();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });
  }

  clearFile(): void {
    this.data.valorText = '';
    this.data.modificado = true;
    this.avisarModificacion();
  }
}
