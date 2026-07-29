import { Component, OnInit, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PedidoVentaCaracteristicaFilterDTO, PedidoVentaDTO } from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';
import { UtilsService } from '@/app/domains/admin/modules/neuron/services/utils.service';
import { BaseComponent } from '../base/base';

@Component({
  selector: 'neuron-control-vinculo',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  template: `
    <mat-form-field [style.display]="isInvisible ? 'none': 'block'" class="w-full">
      <mat-label>{{ structure.nombre }}</mat-label>
      <input matInput [value]="data?.valorText || ''" [readonly]="true" autocomplete="off" />
      @if (data?.expedientes && data.expedientes.length > 0) {
        <button mat-icon-button matSuffix (click)="openVinculo()" tabindex="-1">
          <mat-icon>open_in_new</mat-icon>
        </button>
      }
    </mat-form-field>
  `,
})
export default class VinculoControl extends BaseComponent implements OnInit {
  private readonly utilsService = inject(UtilsService);

  override ngOnInit(): void {
    super.ngOnInit();
  }

  openVinculo(): void {
    if (this.data?.expedientes && this.data.expedientes.length > 0) {
      const doc = this.data.expedientes[0];
      const pedidoVenta = new PedidoVentaDTO();
      pedidoVenta.plantilla = doc.plantilla;
      pedidoVenta.llaveTabla = doc.llaveTabla;
      pedidoVenta.server = this.urlServer;
      this.utilsService.modalWithParams(pedidoVenta, false);
    }
  }
}
