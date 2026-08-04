import { inject, Injectable } from '@angular/core';
import {
  DocumentoPlantillaDTO,
  PedidoVentaDTO,
  ReporteBaseDTO,
} from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';
import { FormActionsService } from './form-actions.service';

@Injectable({ providedIn: 'root' })
export class FormReportsService {
  private readonly actionsService = inject(FormActionsService);

  getReports(plantilla: DocumentoPlantillaDTO, pedido: PedidoVentaDTO): ReporteBaseDTO[] {
    const reports: ReporteBaseDTO[] = [];
    if (plantilla?.reportes) {
      for (const reporte of plantilla.reportes) {
        const propVisibleState = PlantillaHelper.buscarValorMultiple(reporte.propiedades, PlantillaHelper.REP_VISIBLE_STATE);
        if (!propVisibleState || !pedido.estadoExpediente || propVisibleState.find((x) => x.valor === pedido.estadoExpediente)) {
          reports.push(reporte);
        }
      }
    }
    return reports;
  }

  autoPrintReports(reports: ReporteBaseDTO[], pedido: PedidoVentaDTO): void {
    for (const _report of reports) {
      if (PlantillaHelper.buscarValor(_report.propiedades, PlantillaHelper.REP_AUTOPRINT)) {
        this.actionsService.showReport(_report, pedido);
      }
    }
  }
}
