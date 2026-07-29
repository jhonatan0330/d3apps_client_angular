import { Component, OnInit, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseComponent } from '../base/base';

@Component({
  selector: 'neuron-control-croquis',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div [style.display]="(isInvisible || isSectionInvisible) ? 'none': 'block'" class="py-2">
      <div class="text-sm font-medium mb-1">{{ structure.nombre }}</div>
      <canvas #canvasEl class="border rounded w-full" width="300" height="150"></canvas>
      @if (isEnabled) {
        <div class="flex gap-2 mt-1">
          <button mat-stroked-button (click)="clear()"><mat-icon>delete</mat-icon> Limpiar</button>
        </div>
      }
    </div>
  `,
})
export default class CroquisControl extends BaseComponent implements OnInit, AfterViewInit {
  @ViewChild('canvasEl') canvasEl!: ElementRef<HTMLCanvasElement>;
  private signaturePad: any;

  override ngOnInit(): void {
    super.ngOnInit();
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      const SignaturePad = (await import('signature_pad')).default;
      this.signaturePad = new SignaturePad(this.canvasEl.nativeElement);
      if (this.data?.valorText) {
        const img = new Image();
        img.onload = () => {
          const ctx = this.canvasEl.nativeElement.getContext('2d');
          if (ctx) ctx.drawImage(img, 0, 0);
        };
        img.src = this.data.valorText;
      }
      this.signaturePad.addEventListener('endStroke', () => {
        if (this.data) {
          this.data.valorText = this.canvasEl.nativeElement.toDataURL();
          this.data.modificado = true;
          this.avisarModificacion();
        }
      });
    } catch {
      console.warn('signature_pad not available');
    }
  }

  clear(): void {
    if (this.signaturePad) this.signaturePad.clear();
    if (this.data) {
      this.data.valorText = '';
      this.data.modificado = true;
      this.avisarModificacion();
    }
  }
}
