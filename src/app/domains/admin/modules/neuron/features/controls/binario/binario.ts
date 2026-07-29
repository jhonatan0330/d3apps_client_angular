import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';
import { BaseComponent } from '../base/base';

@Component({
  selector: 'neuron-control-binario',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div [style.display]="(isInvisible || isSectionInvisible) ? 'none': 'block'">
      <label>
        <input class="border-b m-1" type="checkbox" [name]="structure.llaveTabla" [formControl]="fControl" [required]="required" />
        {{ labelTextBinary }}
      </label>
    </div>
  `,
})
export default class BinarioControl extends BaseComponent implements OnInit {
  fControl = new FormControl(false);
  labelTextBinary = '';

  override ngOnInit() {
    super.ngOnInit();
    if (this.data) {
      if (!this.data.valorNumero) this.data.valorNumero = 0;
      if (this.data.valorNumero === 1) this.fControl.setValue(true);
    }
    if (this.required) {
      this.fControl.setValidators(Validators.required);
      this.fControl.updateValueAndValidity();
    }
    if (this.isEnabled) this.fControl.enable();
    else this.fControl.disable();
    this.fControl.valueChanges.subscribe(() => this.actualizar());
    this.labelTextBinary = this.obtenerValor(PlantillaHelper.BINARIO_PREGUNTA);
    if (this.labelTextBinary) this.labelTextBinary = this.structure.nombre + ' - ' + this.labelTextBinary;
    else this.labelTextBinary = this.structure.nombre;
  }

  override actualizar() {
    const nuevoValor = this.fControl.value ? 1 : 0;
    if (this.data.valorNumero !== nuevoValor) {
      this.data.valorNumero = nuevoValor;
      this.data.valorText = nuevoValor === 1
        ? (this.obtenerValor(PlantillaHelper.BINARIO_VERDADERO) || '1')
        : (this.obtenerValor(PlantillaHelper.BINARIO_FALSO) || '0');
      if (!this.data.valorText) this.data.valorText = nuevoValor.toString();
      this.avisarModificacion();
    }
  }
}
