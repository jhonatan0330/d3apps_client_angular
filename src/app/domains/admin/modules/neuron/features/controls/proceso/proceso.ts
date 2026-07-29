import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PedidoVentaCaracteristicaDTO, PedidoVentaCaracteristicaFilterDTO, PedidoVentaDTO } from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { ApiService } from '@/app/domains/admin/modules/neuron/services/api.service';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';
import { UtilsService } from '@/app/domains/admin/modules/neuron/services/utils.service';
import { BaseComponent } from '../base/base';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'neuron-control-proceso',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, MatAutocompleteModule, MatOptionModule, MatProgressBarModule],
  template: `
    @if (isLoading) { <mat-progress-bar mode="indeterminate"></mat-progress-bar> }
    <mat-form-field [style.display]="(isInvisible || isSectionInvisible) ? 'none': 'block'" class="w-full">
      @if (errorMessage) {
        <label class="items-center font-medium tracking-wide text-red-500 text-xs mt-1 ml-1">{{ errorMessage }}</label>
      }
      <mat-label>{{ structure.nombre }}</mat-label>
      <input matInput [id]="idField" [formControl]="fControl" [name]="structure.llaveTabla"
        [required]="required" [readonly]="!isEnabled" [matAutocomplete]="auto" autocomplete="off" />
      <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayFn">
        @for (opt of filteredOptions; track opt.llaveTabla) {
          <mat-option [value]="opt">{{ opt.nombre }}</mat-option>
        }
      </mat-autocomplete>
      @if (isEnabled && data?.valorOpcion) {
        <button mat-icon-button matSuffix (click)="openProcess()" tabindex="-1">
          <mat-icon>open_in_new</mat-icon>
        </button>
      }
    </mat-form-field>
  `,
})
export default class ProcesoControl extends BaseComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly utilsService = inject(UtilsService);
  fControl = new FormControl('');
  filteredOptions: PedidoVentaDTO[] = [];
  isMultiple = false;
  funcion = '';

  override ngOnInit(): void {
    super.ngOnInit();
    this.isMultiple = !PlantillaHelper.isEmpty(this.structure.propiedades, PlantillaHelper.MULTIPLE);
    this.funcion = this.obtenerValor(PlantillaHelper.NUMERO_FUNCION);
    if (this.data) {
      if (this.data.valorText) this.fControl.setValue(this.data.valorText);
      else if (!this.data.llaveTabla) {
        const defaultValue = this.obtenerValor(PlantillaHelper.DEFAULT);
        if (defaultValue) this.fControl.setValue(defaultValue);
      }
    }
    this.fControl.valueChanges.subscribe((value) => {
      if (typeof value === 'string') {
        this.data.valorText = value;
        this.avisarModificacion();
      } else if (value && typeof value === 'object') {
        this.data.valorOpcion = (value as PedidoVentaDTO).llaveTabla;
        this.data.valorText = (value as PedidoVentaDTO).nombre;
        this.avisarModificacion();
      }
    });
  }

  displayFn(item: PedidoVentaDTO): string {
    return item?.nombre ?? '';
  }

  openProcess(): void {
    if (this.data?.valorOpcion) {
      const pedidoVenta = new PedidoVentaDTO();
      pedidoVenta.plantilla = this.data.valorOpcion;
      pedidoVenta.llaveTabla = this.data.valorOpcion;
      pedidoVenta.server = this.urlServer;
      this.utilsService.modalWithParams(pedidoVenta, false);
    }
  }
}
