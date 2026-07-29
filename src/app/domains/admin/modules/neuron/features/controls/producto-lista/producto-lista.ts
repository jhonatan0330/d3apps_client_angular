import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { BaseComponent } from '../base/base';

@Component({
  selector: 'neuron-control-producto-lista',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div [style.display]="(isInvisible || isSectionInvisible) ? 'none': 'block'" class="py-2">
      <div class="text-sm font-medium mb-1">{{ structure.nombre }}</div>
      @if (data?.detalles?.length) {
        <div class="space-y-1">
          @for (detalle of data.detalles; track detalle.detalleId) {
            <div class="flex justify-between items-center text-sm border-b pb-1">
              <span>{{ detalle.nombre }} x{{ detalle.cantidad }}</span>
              <span class="font-semibold">{{ detalle.valorTotal | number }}</span>
            </div>
          }
        </div>
      } @else {
        <div class="text-xs text-gray-400">Sin productos</div>
      }
    </div>
  `,
})
export default class ProductoListaControl extends BaseComponent implements OnInit {
  override ngOnInit(): void {
    super.ngOnInit();
  }
}
