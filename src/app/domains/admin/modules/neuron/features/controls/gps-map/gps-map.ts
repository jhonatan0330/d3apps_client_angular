import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../base/base';

@Component({
  selector: 'neuron-control-gps-map',
  standalone: true,
  template: `
    <div [style.display]="(isInvisible || isSectionInvisible) ? 'none': 'block'" class="py-2">
      <div class="text-sm font-medium mb-1">{{ structure.nombre }}</div>
      @if (data?.valorText) {
        <div class="text-xs text-gray-500">{{ data.valorText }}</div>
      }
      <div class="bg-gray-100 rounded p-4 text-center text-gray-400 text-sm">
        Mapa (OpenLayers) - pendiente de integracion
      </div>
    </div>
  `,
})
export default class GpsMapControl extends BaseComponent implements OnInit {
  override ngOnInit(): void {
    super.ngOnInit();
  }
}
