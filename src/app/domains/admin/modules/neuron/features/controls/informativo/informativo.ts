import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PedidoVentaCaracteristicaFilterDTO, PedidoVentaDTO } from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { BaseComponent } from '../base/base';

@Component({
  selector: 'neuron-control-informativo',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field [style.display]="isInvisible ? 'none': 'block'" class="w-full">
      <mat-label>{{ structure.nombre }}</mat-label>
      <input matInput [formControl]="fControl" [name]="structure.llaveTabla" [required]="required" [readonly]="true" autocomplete="off" />
    </mat-form-field>
  `,
})
export default class InformativoControl extends BaseComponent implements OnInit {
  fControl = new FormControl('');

  override ngOnInit(): void {
    super.ngOnInit();
    if (this.data) {
      if (this.data.valorText) {
        this.fControl.setValue(this.data.valorText);
      } else if (!this.data.principal) {
        this.procesarCampo(null);
      }
    }
    this.fControl.valueChanges.subscribe(() => this.actualizar());
  }

  override actualizar(): void {
    const nuevoValor = this.fControl.value;
    if (this.data.valorText !== nuevoValor) {
      this.data.valorText = nuevoValor;
      if (nuevoValor) this.avisarModificacion();
    }
  }

  override procesarCampo(_campoFiltro: PedidoVentaCaracteristicaFilterDTO | null): void {
    if (!this.data.dependientes || this.data.dependientes.length === 0) return;
    let filterVerification: string | null = null;
    for (const iDependent of this.data.dependientes) {
      if (iDependent.valorOpcion) filterVerification = iDependent.valorOpcion;
    }
    if (!filterVerification) return;
    console.warn('InformativoControl.procesarCampo: consultarDatosBase not yet connected');
  }
}
