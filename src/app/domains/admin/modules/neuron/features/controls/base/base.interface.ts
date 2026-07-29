import { BehaviorSubject } from 'rxjs';
import {
  DocumentoPlantillaCaracteristicaDTO,
  PedidoVentaCaracteristicaDTO,
  PedidoVentaDTO,
} from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { PropiedadDTO } from '@/app/shared/domain/shared.domain';

export interface IDynamicControl {
  structure: DocumentoPlantillaCaracteristicaDTO;
  data: PedidoVentaCaracteristicaDTO;
  parent: PedidoVentaDTO;
  formIsEnabled: boolean;
  urlServer: string;
  isInvisible: boolean;
  isSectionInvisible: boolean;
  listeners: IDynamicControl[];
  formIsModified: BehaviorSubject<boolean | null>;
  _structure: DocumentoPlantillaCaracteristicaDTO;

  adicionarListener(pField: IDynamicControl): void;
  actualizarDependencia(campoModificado: PedidoVentaCaracteristicaDTO): void;
  notificarModificacion(campoFiltro: PedidoVentaCaracteristicaDTO): void;
  validateVisibility(textSelected: string): void;
  setValorNumero(valor: number): void;
  send2Server(): boolean;

  form: {
    reviewFieldsVisibility(): void;
  };
}
