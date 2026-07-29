import { Component, OnInit, inject } from '@angular/core';
import { UntypedFormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { formatNumber } from '@angular/common';
import { debounceTime, distinctUntilChanged, map, tap } from 'rxjs';
import { PedidoVentaCaracteristicaDTO, PedidoVentaCaracteristicaFilterDTO } from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { DocumentoPlantillaCaracteristicaEnum } from '@/app/domains/admin/modules/neuron/domain/sw42.enum';
import { ApiService } from '@/app/domains/admin/modules/neuron/services/api.service';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';
import { FormulaHelper } from '@/app/domains/admin/modules/neuron/helpers/formula.helper';
import { PropiedadDTO } from '@/app/shared/domain/shared.domain';
import { BaseComponent } from '../base/base';

@Component({
  selector: 'neuron-control-numero',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatProgressBarModule],
  template: `
    @if (isLoading) { <mat-progress-bar mode="indeterminate"></mat-progress-bar> }
    <mat-form-field [style.display]="(isInvisible || isSectionInvisible) ? 'none': 'block'" class="w-full">
      @if (errorMessage) {
        <label class="items-center font-medium tracking-wide text-red-500 text-xs mt-1 ml-1">{{ errorMessage }}</label>
      }
      <mat-label>{{ structure.nombre }}</mat-label>
      <input [id]="idField" matInput class="text-right" [name]="structure.llaveTabla"
        [formControl]="fControl" [required]="required" [readonly]="!isEnabled || !formIsEnabled"
        (focus)="getInitialFocus($event)" (keydown.enter)="onEnter($event)" autocomplete="off" />
    </mat-form-field>
  `,
})
export default class NumeroControl extends BaseComponent implements OnInit {
  private readonly api = inject(ApiService);
  fControl = new UntypedFormControl(0, { updateOn: 'blur' });
  step = 1;
  formula: string = '';
  formulaMaximum: PropiedadDTO | null = null;
  formulaMinimum: PropiedadDTO | null = null;
  funcion: string = '';
  numeroDecimales = 2;

  override ngOnInit() {
    super.ngOnInit();
    if (!this.data.valorNumero) this.data.valorNumero = 0;
    this.fControl.setValue(this.numberToInput(this.data.valorNumero));
    if (this.required) {
      this.fControl.setValidators(Validators.required);
      this.fControl.updateValueAndValidity();
    }
    this.startControl();
    if (this.funcion) {
      this.fControl.valueChanges.pipe(debounceTime(200)).subscribe(() => this.actualizar());
    } else {
      this.fControl.valueChanges.pipe(
        distinctUntilChanged(),
        map((value) => { this.fControl.setValue(this.numberToInput(value), { emitEvent: false }); return value; }),
        tap(() => { this.actualizar(); this.validateErrorMessage(); }),
      ).subscribe();
    }
    if (this.data.valorNumero !== Number(String(this.fControl.value).replace(/,/g, '').replace(/\s/g, ''))) {
      this.actualizar();
    }
  }

  onEnter(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fControl.setValue(this.numberToInput(Number(input.value)));
  }

  startControl(): void {
    this.formula = this.obtenerValor(PlantillaHelper.NUMERO_FORMULA);
    this.formulaMaximum = this.obtenerPropiedad(PlantillaHelper.NUMERO_MAXIMO);
    this.formulaMinimum = this.obtenerPropiedad(PlantillaHelper.NUMERO_MINIMO);
    this.funcion = this.obtenerValor(PlantillaHelper.NUMERO_FUNCION);
    const decimales = this.obtenerValor(PlantillaHelper.NUMERO_REDONDEO);
    if (decimales) this.numeroDecimales = Number(decimales);
    if (this.data.valorText) {
      if (this.data.valorNumero === 0) this.data.valorNumero = Number(this.data.valorText);
      this.fControl.setValue(this.numberToInput(this.data.valorNumero!));
    } else if (!this.data.documento) {
      if (!this.isEmpty(this.formula) || !this.isEmpty(this.funcion)) {
        this.procesarCampo(this.transformPVCtoFilter(this.data));
      } else if (this.obtenerValorMultiple(PlantillaHelper.DEFAULT)) {
        this.data.valorNumero = Number(this.obtenerValor(PlantillaHelper.DEFAULT));
      }
    }
  }

  formatStringXML(texto: string): string {
    if (!texto) return 'EMPTY';
    return texto.replace(/ /g, '_').replace('Ñ', 'N').trim();
  }

  numberToInput(_valueNumber: number): string {
    let _value = String(_valueNumber).replace(/,/g, '').replace(/\s/g, '');
    let numericValue = 0;
    if (/^[0-9+\-*/().]+$/.test(_value)) {
      try { numericValue = Function('"use strict";return (' + _value + ')')(); } catch { numericValue = 0; }
    }
    return formatNumber(numericValue, 'en-US', '1.0-' + this.numeroDecimales);
  }

  override actualizar(): void {
    let controlValue = this.fControl.value;
    if (!controlValue) controlValue = '0';
    else controlValue = controlValue.replace(/,/g, '').replace(/\s/g, '');
    if (this.data.valorNumero !== Number(controlValue)) {
      this.data.valorNumero = Number(controlValue);
      this.data.valorText = controlValue;
      this.avisarModificacion();
    }
  }

  private formulaReplaceDependents(textoCalculado: string): string {
    if (!this.data?.dependientes?.length || !textoCalculado) return textoCalculado;
    for (const iterable of this.data.dependientes) {
      let valorNumero = iterable.valorNumero ?? 0;
      const diccionario = new Map<string, number>();
      if (iterable.campoDTO?.formato === DocumentoPlantillaCaracteristicaEnum.PRODUCTO && iterable.detalles) {
        for (const det of iterable.detalles) {
          if (det.documentoDetalle?.caracteristicas) {
            for (const campo of det.documentoDetalle.caracteristicas) {
              const existing = diccionario.get(campo.campoDTO!.codigo!) ?? 0;
              diccionario.set(campo.campoDTO!.codigo!, existing + (campo.valorNumero ?? 0));
            }
          }
        }
      } else if (iterable.campoDTO?.formato === DocumentoPlantillaCaracteristicaEnum.PROCESO && PlantillaHelper.buscarPropiedad(iterable.campoDTO!.propiedades, PlantillaHelper.MULTIPLE) && iterable.expedientes) {
        for (const exp of iterable.expedientes) {
          if (exp.caracteristicas && exp.dinero) {
            for (const campo of exp.caracteristicas) {
              const codeToReplace = this.formatStringXML(campo.campo!) + '_' + this.formatStringXML(campo.valorText ?? '');
              const existing = diccionario.get(codeToReplace) ?? 0;
              diccionario.set(codeToReplace, existing + (exp.dinero.valorTotal ?? 0));
            }
          }
        }
      }
      for (const key of diccionario.keys()) {
        let nuevoValor = diccionario.get(key) ?? 0;
        textoCalculado = textoCalculado.split(iterable.campoDTO!.codigo + '_' + key).join(nuevoValor.toFixed(8));
      }
      textoCalculado = textoCalculado.split(iterable.campoDTO!.codigo!).join(valorNumero.toString());
    }
    return textoCalculado;
  }

  override procesarCampo(campoFiltro: PedidoVentaCaracteristicaFilterDTO): void {
    if (!this.isEmpty(this.formula)) {
      const textoCalculado = this.formulaReplaceDependents(this.formula);
      let resultado = FormulaHelper.calcular(textoCalculado);
      resultado = Number(resultado.toFixed(this.numeroDecimales));
      if (this.data.valorNumero !== resultado) {
        this.fControl.setValue(this.numberToInput(resultado));
      }
      return;
    }
    if (!this.isEmpty(this.funcion) && campoFiltro) {
      const filtro = new PedidoVentaCaracteristicaFilterDTO();
      if (this.relatedFields) {
        if (!this.data.dependientes || this.data.dependientes.length !== this.relatedFields.length) return;
        for (const pvc of this.data.dependientes) {
          if (!pvc.valorOpcion && (!pvc.campoDTO || pvc.campoDTO.formato === DocumentoPlantillaCaracteristicaEnum.PROCESO)) {
            if (!PlantillaHelper.buscarPropiedad(pvc.campoDTO!.propiedades, PlantillaHelper.PERMISO_CAMPO_OPCIONAL)) {
              if (!PlantillaHelper.buscarPropiedad(pvc.campoDTO!.propiedades, PlantillaHelper.MULTIPLE)) return;
            }
          }
        }
        filtro.dependientes = this.data.dependientes;
      } else {
        if (!this.data.documento) return;
      }
      filtro.campoDTO = this.structure;
      filtro.campo = this.structure.llaveTabla;
      filtro.documento = campoFiltro.documento;
      this.isLoading = true;
      this.api.consultarDatosBase(filtro, this.urlServer).subscribe({
        next: (_value: PedidoVentaCaracteristicaFilterDTO) => {
          this.fControl.setValue(this.numberToInput(_value.valorNumeroMax!));
          this.isLoading = false;
        },
        error: () => { this.isLoading = false; },
      });
    }
  }

  override setValorNumero(valor: number): void {
    this.fControl.setValue(this.numberToInput(valor));
  }

  getInitialFocus(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  validateErrorMessage(): void {
    this.errorMessage = null;
    if (this.formulaMaximum) {
      const textoMaximum = this.formulaReplaceDependents(this.formulaMaximum.valor);
      const resultadoMaximum = FormulaHelper.calcular(textoMaximum);
      if (this.data.valorNumero! > resultadoMaximum) {
        this.errorMessage = this.formulaMaximum.motivo
          ? `En el campo ${this.structure.nombre} ${this.formulaMaximum.motivo}. Maximo : ${new Intl.NumberFormat('es-CO').format(resultadoMaximum)}`
          : `En el campo ${this.structure.nombre} el valor maximo que puedes colocar es ${new Intl.NumberFormat('es-CO').format(resultadoMaximum)}`;
        return;
      }
    }
    if (this.formulaMinimum) {
      const textoMinimum = this.formulaReplaceDependents(this.formulaMinimum.valor);
      const resultadoMinimum = FormulaHelper.calcular(textoMinimum);
      if (this.data.valorNumero! < resultadoMinimum) {
        this.errorMessage = this.formulaMinimum.motivo
          ? `En el campo ${this.structure.nombre} ${this.formulaMinimum.motivo}. Minimo : ${new Intl.NumberFormat('es-CO').format(resultadoMinimum)}`
          : `En el campo ${this.structure.nombre} el valor minimo que puedes colocar es ${new Intl.NumberFormat('es-CO').format(resultadoMinimum)}`;
      }
    }
  }

  override send2Server(): boolean {
    if (this.isLoading) return false;
    this.errorMessage = null;
    if (this.required && !this.data.valorNumero && !this.isInvisible) {
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
