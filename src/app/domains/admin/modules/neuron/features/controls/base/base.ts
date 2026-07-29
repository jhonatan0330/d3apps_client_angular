import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  DocumentoPlantillaCaracteristicaDTO,
  PedidoVentaCaracteristicaDTO,
  PedidoVentaCaracteristicaFilterDTO,
  PedidoVentaDTO,
} from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { PropiedadDTO } from '@/app/shared/domain/shared.domain';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';
import { IDynamicControl } from './base.interface';

@Component({ selector: 'app-base', template: '', standalone: true })
export class BaseComponent implements OnInit, IDynamicControl {
  data: PedidoVentaCaracteristicaDTO;
  parent: PedidoVentaDTO;
  relatedFields: PropiedadDTO[];
  propVisibleDepende: PropiedadDTO[];
  listeners: IDynamicControl[] = [];
  required = true;
  isEnabled = true;
  formIsEnabled = true;
  isLoading = false;
  help = 'x';
  isInvisible = false;
  isSectionInvisible = false;
  form: { reviewFieldsVisibility(): void };
  urlServer: string;
  errorMessage: string | null = null;
  formIsModified = new BehaviorSubject<boolean | null>(null);
  idField = '';

  _structure: DocumentoPlantillaCaracteristicaDTO;
  get structure(): DocumentoPlantillaCaracteristicaDTO {
    return this._structure;
  }
  set structure(value: DocumentoPlantillaCaracteristicaDTO) {
    this._structure = value;
    this.required = PlantillaHelper.isEmpty(value.propiedades, PlantillaHelper.PERMISO_CAMPO_OPCIONAL);
    this.isInvisible = !PlantillaHelper.isEmpty(value.propiedades, PlantillaHelper.INVISIBLE);
    this.relatedFields = this.obtenerValorMultiple(PlantillaHelper.DEPENDE);
    this.idField =
      ((this.parent && this.parent.llaveTabla) ? this.parent.llaveTabla : Date.now().toString()) + value.llaveTabla;
    this.propVisibleDepende = this.obtenerValorMultiple(PlantillaHelper.VISIBLE_VALOR_DEPENDIENTE);
  }

  ngOnInit(): void {
    this.isEnabled = this._getEditable();
    if (!this.form) {
      this.required = false;
    }
  }

  actualizar(): void {}

  _getEditable(): boolean {
    const resultado = PlantillaHelper.isEmpty(
      this.structure.propiedades,
      PlantillaHelper.PERMISO_CAMPO_BLOQUEAR,
    );
    if (this.data && this.data.documento) {
      if (!this.formIsEnabled) return false;
      if (!PlantillaHelper.isEmpty(this.structure.propiedades, PlantillaHelper.PERMISO_CAMPO_MODIFICABLE)) {
        if (this.data.campoDTO) {
          return !PlantillaHelper.isEmpty(this.data.campoDTO.propiedades, PlantillaHelper.PERMISO_CAMPO_MODIFICABLE);
        }
      } else {
        return false;
      }
    }
    return resultado;
  }

  getValorTexto(): string {
    return this.data == null ? '' : this.data.valorText ?? '';
  }

  getValorNumero(): number {
    return this.data == null ? 0 : this.data.valorNumero ?? 0;
  }

  setValorNumero(valor: number): void {
    if (this.data) this.data.valorNumero = valor;
  }

  setCampo(campo: PedidoVentaCaracteristicaDTO): void {
    this.data = campo;
  }

  isEmpty(s: string | null | undefined): boolean {
    return s == null || s.length === 0;
  }

  actualizarDependencia(campoModificado: PedidoVentaCaracteristicaDTO): void {
    if (!this.data) return;
    if (!this.data.dependientes) this.data.dependientes = [];
    if (campoModificado.campoDTO) {
      const idx = this.data.dependientes.findIndex(
        (i) => i.campoDTO && campoModificado.campoDTO && i.campoDTO.codigo === campoModificado.campoDTO.codigo,
      );
      if (idx >= 0) this.data.dependientes.splice(idx, 1);
    }
    this.data.dependientes.push(campoModificado);
  }

  avisarModificacion(inicioCampo = false, omitirFormModified = false): void {
    if (!inicioCampo && this.data) {
      this.data.modificado = true;
      if (!omitirFormModified) {
        this.formIsModified.next(true);
      }
    }
    if (this.listeners && this.listeners.length !== 0) {
      for (const listener of this.listeners) {
        listener.actualizarDependencia(this.data);
        if (!inicioCampo) {
          listener.notificarModificacion(this.data);
        }
        listener.validateVisibility(this.getValorTexto());
      }
    }
  }

  validateVisibility(textSelected: string): void {
    if (this.propVisibleDepende) {
      this.isInvisible = true;
      for (const propVisible of this.propVisibleDepende) {
        if (propVisible.campo === this.structure.llaveTabla && textSelected === propVisible.valor) {
          this.isInvisible = false;
          if (this.form) this.form.reviewFieldsVisibility();
          break;
        }
      }
    }
  }

  adicionarListener(pField: IDynamicControl): void {
    if (!this.data) return;
    if (!this.listeners) this.listeners = [];
    if (!pField.data.dependientes) pField.data.dependientes = [];
    pField.data.dependientes.push(this.data);
    this.listeners.push(pField);
    pField.validateVisibility(this.getValorTexto());
  }

  obtenerValor(key: string): string {
    if (!this || !this.structure) return '';
    return PlantillaHelper.buscarValor(this.structure.propiedades, key);
  }

  obtenerPropiedad(key: string): PropiedadDTO | null {
    if (!this || !this.structure) return null;
    return PlantillaHelper.buscarPropiedad(this.structure.propiedades, key);
  }

  obtenerTexto(key: string): string {
    const prop = PlantillaHelper.buscarPropiedad(this.structure?.propiedades, key);
    return prop ? (prop.texto ?? '') : '';
  }

  obtenerValorMultiple(key: string): PropiedadDTO[] {
    if (!this || !this.structure) return [];
    return PlantillaHelper.buscarValorMultiple(this.structure.propiedades, key) ?? [];
  }

  transformPVCtoFilter(campoFiltro: PedidoVentaCaracteristicaDTO): PedidoVentaCaracteristicaFilterDTO {
    const nFilter = new PedidoVentaCaracteristicaFilterDTO();
    nFilter.campo = campoFiltro.campo;
    nFilter.campoDTO = campoFiltro.campoDTO;
    nFilter.dependientes = campoFiltro.dependientes;
    nFilter.documento = campoFiltro.documento;
    nFilter.estado = campoFiltro.estado;
    nFilter.expedientes = campoFiltro.expedientes;
    nFilter.llaveTabla = campoFiltro.llaveTabla;
    nFilter.valorAuxiliar = campoFiltro.valorAuxiliar ?? '';
    nFilter.valorOpcion = campoFiltro.valorOpcion ?? '';
    nFilter.valorText = campoFiltro.valorText ?? '';
    return nFilter;
  }

  notificarModificacion(campoFiltro: PedidoVentaCaracteristicaDTO): void {
    this.procesarCampo(this.transformPVCtoFilter(campoFiltro));
  }

  procesarCampo(_campoFiltro: PedidoVentaCaracteristicaFilterDTO): void {}

  send2Server(): boolean {
    return true;
  }
}
