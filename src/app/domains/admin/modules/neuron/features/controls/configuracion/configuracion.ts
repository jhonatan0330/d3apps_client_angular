import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BaseComponent } from '../base/base';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';

@Component({
  selector: 'neuron-control-configuracion',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <mat-form-field [style.display]="(isInvisible || isSectionInvisible) ? 'none': 'block'" class="w-full">
      @if (errorMessage) {
        <label class="items-center font-medium tracking-wide text-red-500 text-xs mt-1 ml-1">{{ errorMessage }}</label>
      }
      <mat-label>{{ structure.nombre }}</mat-label>
      <mat-select [formControl]="fControl" [required]="required" [disabled]="!isEnabled || !formIsEnabled">
        @for (opt of options; track opt.valor) {
          <mat-option [value]="opt.valor">{{ opt.texto || opt.valor }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
export default class ConfiguracionControl extends BaseComponent implements OnInit {
  fControl = new FormControl('');
  options: { valor: string; texto: string }[] = [];

  override ngOnInit(): void {
    super.ngOnInit();
    const propOptions = this.obtenerValorMultiple(PlantillaHelper.CONFIGURACION_OPCIONES);
    if (propOptions) {
      this.options = propOptions.map((p) => ({ valor: p.valor, texto: p.texto || p.valor }));
    }
    if (this.data) {
      if (this.data.valorOpcion) this.fControl.setValue(this.data.valorOpcion);
      else if (!this.data.llaveTabla) {
        const defaultValue = this.obtenerValor(PlantillaHelper.DEFAULT);
        if (defaultValue) this.fControl.setValue(defaultValue);
      }
    }
    if (this.required) {
      this.fControl.setValidators([]);
      this.fControl.updateValueAndValidity();
    }
    this.fControl.valueChanges.subscribe(() => this.actualizar());
  }

  override actualizar() {
    const nuevoValor = this.fControl.value;
    if (this.data.valorOpcion !== nuevoValor) {
      this.data.valorOpcion = nuevoValor;
      const selected = this.options.find((o) => o.valor === nuevoValor);
      this.data.valorText = selected ? selected.texto : nuevoValor;
      this.avisarModificacion();
    }
  }

  override send2Server(): boolean {
    this.errorMessage = null;
    if (this.required && !this.data.valorOpcion && !this.isInvisible) {
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
