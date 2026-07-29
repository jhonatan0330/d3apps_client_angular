import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { PedidoVentaCaracteristicaFilterDTO } from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';
import { BaseComponent } from '../base/base';

@Component({
  selector: 'neuron-control-product',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, MatAutocompleteModule, MatOptionModule],
  template: `
    <mat-form-field [style.display]="(isInvisible || isSectionInvisible) ? 'none': 'block'" class="w-full">
      @if (errorMessage) {
        <label class="items-center font-medium tracking-wide text-red-500 text-xs mt-1 ml-1">{{ errorMessage }}</label>
      }
      <mat-label>{{ structure.nombre }}</mat-label>
      <input matInput [formControl]="fControl" [name]="structure.llaveTabla"
        [required]="required" [readonly]="!isEnabled" autocomplete="off" />
    </mat-form-field>
  `,
})
export default class ProductControl extends BaseComponent implements OnInit {
  fControl = new FormControl('');

  override ngOnInit(): void {
    super.ngOnInit();
    if (this.data?.valorText) this.fControl.setValue(this.data.valorText);
    this.fControl.valueChanges.subscribe(() => this.actualizar());
  }

  override actualizar(): void {
    const nuevoValor = this.fControl.value;
    if (this.data.valorText !== nuevoValor) {
      this.data.valorText = nuevoValor;
      this.avisarModificacion();
    }
  }

  override send2Server(): boolean {
    this.errorMessage = null;
    if (this.required && !this.data.valorText && !this.isInvisible) {
      this.errorMessage = `En la plantilla ${this._structure.plantillaNombre} es obligatorio registrar el campo ${this._structure.nombre})`;
    }
    if (this.errorMessage) {
      const input = document.getElementById(this.idField!) as HTMLInputElement;
      if (input) input.focus();
      return false;
    }
    return true;
  }
}
