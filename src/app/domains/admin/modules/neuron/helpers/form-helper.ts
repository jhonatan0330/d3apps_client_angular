import { Type } from '@angular/core';
import { DocumentoPlantillaCaracteristicaEnum } from '@/app/domains/admin/modules/neuron/domain/sw42.enum';
import { DocumentoPlantillaCaracteristicaDTO } from '@/app/domains/admin/modules/neuron/domain/sw42.domain';

import ArchivoComponent from '../features/controls/archivo/archivo';
import BinarioComponent from '../features/controls/binario/binario';
import ConfiguracionComponent from '../features/controls/configuracion/configuracion';
import CroquisComponent from '../features/controls/croquis/croquis';
import DetalleComponent from '../features/controls/detalle/detalle';
import DisponibilidadComponent from '../features/controls/disponibilidad/disponibilidad';
import FechaComponent from '../features/controls/fecha/fecha';
import GpsComponent from '../features/controls/gps/gps';
import GpsMapComponent from '../features/controls/gps-map/gps-map';
import NumeroComponent from '../features/controls/numero/numero';
import ProcesoComponent from '../features/controls/proceso/proceso';
import TextoComponent from '../features/controls/texto/texto';
import SeccionComponent from '../features/controls/seccion/seccion';
import ProductoListaComponent from '../features/controls/producto-lista/producto-lista';
import InformativoComponent from '../features/controls/informativo/informativo';
import VinculoComponent from '../features/controls/vinculo/vinculo';

export function getComponent(
  pCampo: DocumentoPlantillaCaracteristicaDTO,
): Type<unknown> {
  switch (pCampo.formato) {
    case DocumentoPlantillaCaracteristicaEnum.ARCHIVO:
      return ArchivoComponent;
    case DocumentoPlantillaCaracteristicaEnum.BINARIO:
      return BinarioComponent;
    case DocumentoPlantillaCaracteristicaEnum.CONFIGURACION:
      return ConfiguracionComponent;
    case DocumentoPlantillaCaracteristicaEnum.CROQUIS:
      return CroquisComponent;
    case DocumentoPlantillaCaracteristicaEnum.PRODUCTO:
      return DetalleComponent;
    case DocumentoPlantillaCaracteristicaEnum.DISPONIBILIDAD:
      return DisponibilidadComponent;
    case DocumentoPlantillaCaracteristicaEnum.FECHA:
      return FechaComponent;
    case DocumentoPlantillaCaracteristicaEnum.GPS:
      return GpsComponent;
    case DocumentoPlantillaCaracteristicaEnum.GPS_MAP:
      return GpsMapComponent;
    case DocumentoPlantillaCaracteristicaEnum.NUMERO:
      return NumeroComponent;
    case DocumentoPlantillaCaracteristicaEnum.PROCESO:
      return ProcesoComponent;
    case DocumentoPlantillaCaracteristicaEnum.TEXTO:
      return TextoComponent;
    case DocumentoPlantillaCaracteristicaEnum.SECCION:
      return SeccionComponent;
    case DocumentoPlantillaCaracteristicaEnum.PRODUCTO_LISTA:
      return ProductoListaComponent;
    case DocumentoPlantillaCaracteristicaEnum.INFORMATIVE:
      return InformativoComponent;
    case DocumentoPlantillaCaracteristicaEnum.VINCULO:
      return VinculoComponent;
    default:
      return TextoComponent;
  }
}
