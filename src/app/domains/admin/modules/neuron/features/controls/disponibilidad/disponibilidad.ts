import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../base/base';

@Component({
  selector: 'neuron-control-disponibilidad',
  standalone: true,
  template: `
    <div [style.display]="(isInvisible || isSectionInvisible) ? 'none': 'block'" class="py-2">
      <div class="text-sm font-medium mb-1">{{ structure.nombre }}</div>
      @if (data.valorText) {
        <div class="text-sm text-gray-600">{{ data.valorText }}</div>
      } @else {
        <div class="text-xs text-gray-400">Sin disponibilidad definida</div>
      }
    </div>
  `,
})
export default class DisponibilidadControl extends BaseComponent implements OnInit {
  override ngOnInit(): void {
    super.ngOnInit();
  }
}
