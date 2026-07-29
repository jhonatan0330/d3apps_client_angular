import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../base/base';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';

@Component({
  selector: 'neuron-control-seccion',
  standalone: true,
  template: `
    <div [style.display]="isInvisible ? 'none': 'block'" class="mt-2 mb-1">
      <div class="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b pb-1">
        {{ structure.nombre }}
      </div>
    </div>
  `,
})
export default class SeccionControl extends BaseComponent implements OnInit {
  override ngOnInit(): void {
    super.ngOnInit();
  }
}
