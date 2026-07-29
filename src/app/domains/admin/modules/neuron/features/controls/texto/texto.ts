import { Component, OnInit, inject } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PedidoVentaCaracteristicaFilterDTO } from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';
import { BaseComponent } from '../base/base';

@Component({
  selector: 'neuron-control-texto',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field [style.display]="(isInvisible || isSectionInvisible) ? 'none': 'block'" class="w-full">
      @if (errorMessage) {
        <label class="items-center font-medium tracking-wide text-red-500 text-xs mt-1 ml-1">{{ errorMessage }}</label>
      }
      <mat-label>{{ structure.nombre }}</mat-label>
      @if (!textoLargo) {
        <input matInput [id]="idField" [formControl]="fControl" [name]="structure.llaveTabla"
          [required]="required" [readonly]="!isEnabled || formatText==='D'" autocomplete="off" />
      }
      @if (textoLargo) {
        <textarea matInput class="textarea-form" [formControl]="fControl" [name]="structure.llaveTabla"
          [required]="required" [readonly]="!isEnabled"></textarea>
      }
    </mat-form-field>
  `,
})
export default class TextoControl extends BaseComponent implements OnInit {
  textoLargo = false;
  scannerEnabled = false;
  formatText = '';
  valorDefecto: string = '';
  fControl = new FormControl('');

  override ngOnInit(): void {
    super.ngOnInit();
    this.valorDefecto = this.obtenerValor(PlantillaHelper.DEFAULT);
    this.formatText = this.obtenerValor(PlantillaHelper.FORMATO);
    this.textoLargo = !this.isEmpty(this.obtenerValor(PlantillaHelper.TEXTO_LARGO));
    this.scannerEnabled = !this.isEmpty(this.obtenerValor(PlantillaHelper.READ_QR));
    if (this.data) {
      if (this.data.valorText) {
        this.fControl.setValue(this.data.valorText);
      } else if (!this.data.llaveTabla && this.valorDefecto) {
        this.fControl.setValue(this.valorDefecto);
      }
    }
    if (this.required) {
      this.fControl.setValidators(Validators.required);
      this.fControl.updateValueAndValidity();
    }
    this.fControl.valueChanges.subscribe(() => this.actualizar());
  }

  override actualizar(): void {
    const nuevoValor = this.fControl.value;
    if (this.data.valorText !== nuevoValor) {
      this.data.valorText = nuevoValor;
      this.avisarModificacion();
    }
  }

  override procesarCampo(_campoFiltro: PedidoVentaCaracteristicaFilterDTO): void {
    let textoCalculado = this.obtenerValor(PlantillaHelper.TEXTO_FORMULA);
    if (!this.isEmpty(textoCalculado) && this.data.dependientes?.length) {
      for (const element of this.data.dependientes) {
        textoCalculado = textoCalculado.replace(
          element.campoDTO!.codigo,
          !element.valorText ? '' : element.valorText,
        );
      }
      this.fControl.setValue(textoCalculado);
      this.actualizar();
    }
  }

  override send2Server(): boolean {
    if (this.isLoading) return false;
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
