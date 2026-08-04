import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { PedidoVentaDTO, ReporteBaseDTO } from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { TemplateService } from '@/app/domains/admin/modules/neuron/services/template.service';
import { UtilsService } from '@/app/domains/admin/modules/neuron/services/utils.service';
import { LocalConstants, LocalStoreService } from '@/app/shared/services/local-store.service';

@Injectable({ providedIn: 'root' })
export class FormActionsService {
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly templateService = inject(TemplateService);
  private readonly utilsService = inject(UtilsService);
  private readonly ls = inject(LocalStoreService);

  showReport(reporte: ReporteBaseDTO, pedido: PedidoVentaDTO): void {
    if (!reporte) return;
    let stringURL = reporte.servidorUrl;
    if (!stringURL) stringURL = (this.ls.getItem(LocalConstants.URL_CONF) as string) || '';
    stringURL += '/reporte?nombre=' + reporte.llaveTabla + '&P_KEY=' + pedido.llaveTabla + '&P_TOKEN=' + this.templateService.getTokenConnection(stringURL);
    if (reporte.variables) stringURL += '&' + reporte.variables;
    window.open(stringURL, '_blank');
  }

  showMassive(plantillaId: string, server: string, dialogRef: MatDialogRef<unknown>): void {
    let redirect = 'massive/' + plantillaId;
    if (server) redirect += '/' + server;
    this.router.navigateByUrl(redirect);
    dialogRef.close();
  }

  showTransfer(
    pedido: PedidoVentaDTO,
    plantillaId: string,
    server: string,
    dialogRef: MatDialogRef<unknown>,
  ): void {
    this.utilsService.modalTransfer(
      pedido.llaveTabla, pedido.estadoExpediente!, pedido.plantilla!, server,
    ).then((res) => {
      if (res && dialogRef) dialogRef.close();
    });
  }

  showTrace(pedido: PedidoVentaDTO, plantillaId: string, server: string): void {
    this.utilsService.modalTrace(
      pedido.llaveTabla, pedido.plantilla!, server,
      pedido.nombre!, pedido.estadoNombre!, pedido.estado!,
    );
  }

  getURLDocument(plantillaId: string, pedidoBase: PedidoVentaDTO): string {
    return window.location.origin + '/main/' + plantillaId + '/' + pedidoBase.llaveTabla;
  }

  sendWhatsApp(plantillaId: string, pedidoBase: PedidoVentaDTO): void {
    window.open('whatsapp://send?text=' + this.getURLDocument(plantillaId, pedidoBase), '_blank');
  }

  copyUrl(plantillaId: string, pedidoBase: PedidoVentaDTO): void {
    navigator.clipboard.writeText(this.getURLDocument(plantillaId, pedidoBase)).then(() => {
      this.snackBar.open('Link copiado al portapapeles', '', { duration: 1000 });
    });
  }

  copyName(pedido: PedidoVentaDTO): void {
    if (pedido?.nombre) {
      navigator.clipboard.writeText(pedido.nombre).then(() => {
        this.snackBar.open(pedido.nombre + ' Copiado al portapapeles', '', { duration: 1000 });
      });
    }
  }

  duplicate(
    pedido: PedidoVentaDTO,
    plantillaId: string,
    server: string,
  ): void {
    this.utilsService.modalWithParams(this.buildDuplicateDoc(pedido, plantillaId, server), false);
  }

  reloadScreen(pedido: PedidoVentaDTO, dialogRef: MatDialogRef<unknown>, pTemplate?: string): void {
    dialogRef.close();
    this.utilsService.modalWithParams(pedido, false, undefined, false, pTemplate);
  }

  private buildDuplicateDoc(pedido: PedidoVentaDTO, plantillaId: string, server: string): PedidoVentaDTO {
    const { PedidoVentaDTO: PedidoVentaClass, PedidoVentaCaracteristicaDTO } = require('@/app/domains/admin/modules/neuron/domain/sw42.domain');
    const { PlantillaHelper } = require('@/app/shared/domain/plantilla-helper');
    const { DocumentoPlantillaCaracteristicaEnum } = require('@/app/domains/admin/modules/neuron/domain/sw42.enum');

    const _doc = new PedidoVentaClass();
    _doc.plantilla = plantillaId;
    _doc.caracteristicas = [];
    for (const campoDocumento of pedido.caracteristicas!) {
      const block = PlantillaHelper.isEmpty(campoDocumento.campoDTO?.propiedades, PlantillaHelper.PERMISO_CAMPO_BLOQUEAR);
      if (
        campoDocumento.campoDTO &&
        block &&
        [
          DocumentoPlantillaCaracteristicaEnum.FECHA,
          DocumentoPlantillaCaracteristicaEnum.NUMERO,
          DocumentoPlantillaCaracteristicaEnum.PROCESO,
          DocumentoPlantillaCaracteristicaEnum.TEXTO,
          DocumentoPlantillaCaracteristicaEnum.PRODUCTO,
          DocumentoPlantillaCaracteristicaEnum.CONFIGURACION,
        ].includes(campoDocumento.campoDTO.formato as string)
      ) {
        const campoBase = new PedidoVentaCaracteristicaDTO();
        campoBase.campo = campoDocumento.campo;
        if (!campoDocumento.dependientes && !(campoDocumento.campoDTO.formato === DocumentoPlantillaCaracteristicaEnum.PROCESO && !campoDocumento.valorOpcion)) {
          campoBase.valorText = campoDocumento.valorText;
          campoBase.valorNumero = campoDocumento.valorNumero;
          campoBase.valorFecha = campoDocumento.valorFecha;
          campoBase.valorOpcion = campoDocumento.valorOpcion;
        }
        _doc.caracteristicas.push(campoBase);
      }
    }
    _doc.server = server;
    return _doc;
  }
}
