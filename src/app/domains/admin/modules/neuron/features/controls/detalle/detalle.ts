import { Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DetallePedidoVentaDTO } from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { BaseComponent } from '../base/base';

@Component({
  selector: 'neuron-control-detalle',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, DecimalPipe],
  template: `
    <div [style.display]="(isInvisible || isSectionInvisible) ? 'none': 'block'" class="py-2">
      <div class="text-sm font-medium mb-1">{{ structure.nombre }}</div>
      @if (data.detalles.length) {
        <div class="space-y-1">
          @for (detalle of data.detalles; track detalle.detalleId) {
            <div class="flex justify-between items-center text-sm border-b pb-1">
              <span>{{ detalle.nombre }}</span>
              <span class="font-semibold">{{ detalle.valorTotal | number }}</span>
            </div>
          }
        </div>
      } @else {
        <div class="text-xs text-gray-400">Sin items</div>
      }
    </div>
  `,
})
export default class DetalleControl extends BaseComponent implements OnInit {
  override ngOnInit(): void {
    super.ngOnInit();
  }
}
