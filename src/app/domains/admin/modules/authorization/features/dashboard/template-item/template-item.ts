import { Component, input } from '@angular/core';
import { Router } from '@angular/router';
import { ImageFormatPipe } from '@/app/shared/pipes/image-format.pipe';
import { UtilsService } from '@/app/domains/admin/modules/neuron/services/utils.service';
import { PedidoVentaDTO } from '@/app/domains/admin/modules/neuron/domain/sw42.domain';

export enum TemplateEnum {
  TIPO_REPORTE = 'R',
  TIPO_PLANTILLA = 'P',
  TIPO_TABLERO = 'T',
}

@Component({
  selector: 'app-template-item',
  imports: [ImageFormatPipe],
  template: `
    <div
      class="flex items-center p-4 cursor-pointer h-[4.5rem] border-b bg-white dark:bg-neutral-800 rounded-lg"
      (click)="showTemplate()"
    >
      <img class="w-10 h-10 mr-4 object-cover rounded" [alt]="nombre()" [src]="imagen() | imageFormat" />
      <div class="flex flex-col min-w-0">
        <div class="text-base font-medium leading-tight line-clamp-2 truncate">{{ nombre() }}</div>
        @if (type() === TemplateEnum.TIPO_REPORTE) {
          <div class="text-xs text-neutral-500 dark:text-neutral-400">Report</div>
        }
        @if (type() === TemplateEnum.TIPO_TABLERO) {
          <div class="text-xs text-neutral-500 dark:text-neutral-400">Process</div>
        }
      </div>
    </div>
  `,
})
export class TemplateItemComponent {
  readonly nombre = input('');
  readonly imagen = input('');
  readonly id = input.required<string>();
  readonly processId = input<string>('');
  readonly type = input<TemplateEnum>(TemplateEnum.TIPO_PLANTILLA);
  readonly serverId = input<string>('');

  protected readonly TemplateEnum = TemplateEnum;

  constructor(
    private readonly router: Router,
    private readonly utilsService: UtilsService,
  ) {}

  showTemplate() {
    if (this.type() === TemplateEnum.TIPO_REPORTE) {
      this.openDialog();
    } else {
      let newRoute = '';
      if (this.type() === TemplateEnum.TIPO_TABLERO) {
        newRoute = '/admin/list/process_crud/' + this.processId();
      } else {
        newRoute = '/admin/list/list/' + this.id();
      }
      if (this.serverId()) newRoute += '/' + this.serverId();
      this.router.navigate([newRoute]);
    }
  }

  private openDialog() {
    const pedidoVenta = new PedidoVentaDTO();
    pedidoVenta.plantilla = this.id();
    if (this.serverId()) pedidoVenta.server = this.serverId();
    const close2Save = this.type() === TemplateEnum.TIPO_REPORTE;
    this.utilsService.modalWithParams(pedidoVenta, close2Save);
  }
}
