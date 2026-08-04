import { inject, Injectable } from '@angular/core';
import { TemplateService } from '@/app/domains/admin/modules/neuron/services/template.service';
import {
  DocumentoPlantillaDTO,
  PedidoVentaDTO,
  ProcesoTransicionDTO,
} from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';

@Injectable({ providedIn: 'root' })
export class FormTransitionsService {
  private readonly templateService = inject(TemplateService);

  getTransitionsOfTemplate(
    pTemplate: DocumentoPlantillaDTO,
    pState: string,
    pDocumentTransition: PedidoVentaDTO,
    pIsVinculo: boolean,
  ): ProcesoTransicionDTO[] {
    const transitions: ProcesoTransicionDTO[] = [];
    if (!pTemplate?.estados || pTemplate.estados.length === 0) return transitions;

    for (const _stateElement of pTemplate.estados) {
      if (_stateElement.llaveTabla === pState) {
        if (!_stateElement.transiciones || _stateElement.transiciones.length === 0) return transitions;

        for (const _transition of _stateElement.transiciones) {
          if (_transition.plantilla) {
            const _templateTransition = this.templateService.getTemplate(_transition.plantilla, pTemplate.server);
            if (_templateTransition && !PlantillaHelper.isEmpty(_templateTransition.propiedades, PlantillaHelper.PERMISO_PLANTILLA_CREAR)) {
              if (pIsVinculo && PlantillaHelper.isEmpty(_transition.propiedades, PlantillaHelper.TRANSICION_VISIBLE_VINCULO)) continue;
              const _newtransicion = new ProcesoTransicionDTO();
              _newtransicion.imagen = _templateTransition.imagen;
              _newtransicion.plantilla = _templateTransition.llaveTabla;
              _newtransicion.nombre = _transition.nombre;
              _newtransicion.documentToTransition = pDocumentTransition;
              transitions.push(_newtransicion);
            }
          }
        }
        return transitions;
      }
    }

    return transitions;
  }

  getVinculoTransitions(pedido: PedidoVentaDTO, plantilla: DocumentoPlantillaDTO): ProcesoTransicionDTO[] {
    const transitions: ProcesoTransicionDTO[] = [];

    if (pedido.llaveTabla && pedido.estado === 'A') {
      for (const _element of pedido.caracteristicas!) {
        if (_element.campoDTO?.formato === 'VINCULO' as any) {
          if (_element.expedientes) {
            const expTransitions = this.getTransitionsOfTemplate(
              this.templateService.getTemplate(_element.expedientes[0].plantilla!, null)!,
              _element.expedientes[0].estadoExpediente!, _element.expedientes[0], true);
            transitions.push(...expTransitions);
          } else {
            const _property = PlantillaHelper.buscarPropiedad(_element.campoDTO!.propiedades, PlantillaHelper.VINCULO_DATA);
            if (_property && _property.motivo && !_property.relaciones) {
              const _templateVinculo = this.templateService.getTemplate(_property.valor, null);
              if (_templateVinculo) {
                const _newtransicion = new ProcesoTransicionDTO();
                _newtransicion.imagen = _templateVinculo.imagen;
                _newtransicion.plantilla = _templateVinculo.llaveTabla;
                _newtransicion.nombre = _property.motivo.toUpperCase();
                transitions.push(_newtransicion);
              }
            }
          }
        }
      }
    }

    return transitions;
  }

  resolveRapidTransition(pedido: PedidoVentaDTO, plantilla: DocumentoPlantillaDTO): string | null {
    if (!plantilla?.estados || plantilla.estados.length === 0) return null;

    for (const estado of plantilla.estados) {
      if (estado.llaveTabla === pedido.estadoExpediente && estado.transiciones?.length) {
        for (const _transition of estado.transiciones) {
          if (_transition.rapida) {
            return _transition.plantilla;
          }
        }
      }
    }

    return null;
  }
}
