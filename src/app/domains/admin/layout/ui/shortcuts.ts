import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { Component, OnDestroy, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { DocumentoPlantillaDTO, PedidoVentaDTO } from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { UtilsService } from '@/app/domains/admin/modules/neuron/services/utils.service';
import { TemplateService } from '@/app/domains/admin/modules/neuron/services/template.service';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';

@Component({
  standalone: true,
  selector: 'shortcuts',
  imports: [
    FormsModule,
    MatIconButton,
    MatIcon,
    CdkConnectedOverlay,
    CdkOverlayOrigin,
  ],
  template: `
    <button
      matIconButton
      cdkOverlayOrigin
      (click)="toggle()"
      #trigger="cdkOverlayOrigin"
    >
      <mat-icon svgIcon="bolt" />
    </button>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="trigger"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="'transparent'.split(' ')"
      (detach)="toggle(false)"
      (backdropClick)="toggle(false)"
    >
      <div
        class="z-10 flex max-h-120 w-full max-w-xs flex-col overflow-y-auto rounded-lg bg-white shadow-(--mat-sys-level2) dark:bg-neutral-800"
      >
        <div class="flex items-center p-4 pb-2 pl-6">
          <mat-icon class="size-4.5 mr-3" svgIcon="bolt" />
          <div class="text-xl font-semibold tracking-tighter">Formularios</div>
          <div class="flex-auto"></div>
          <input
            class="w-32 rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-700"
            placeholder="Filtrar..."
            [(ngModel)]="filterValue"
            (input)="filterItem()"
          />
        </div>

        <div class="grid grid-cols-2 gap-1 p-2">
          @for (item of filteredShortcuts(); track item.llaveTabla) {
            <button
              class="flex flex-col items-center rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              (click)="openShortcut(item)"
            >
              <img class="mb-1 h-10 w-10 rounded object-cover" [src]="item.imagen" alt="" />
              <span class="text-center text-xs font-medium leading-tight">{{ item.nombre }}</span>
            </button>
          }
        </div>

        @if (!filteredShortcuts().length) {
          <div class="flex flex-col items-center py-8 px-8">
            <div class="mb-2 text-2xl font-semibold">Sin accesos</div>
            <div class="text-sm text-neutral-500">No hay formularios de acceso rapido.</div>
          </div>
        }
      </div>
    </ng-template>
  `,
})
export class Shortcuts implements OnDestroy {
  private readonly templateService = inject(TemplateService);
  private readonly utilsService = inject(UtilsService);
  private readonly templatesWatcher: ReturnType<typeof effect>;

  protected open = signal(false);
  protected filterValue = '';
  protected shortcuts = signal<DocumentoPlantillaDTO[]>([]);
  protected filteredShortcuts = signal<DocumentoPlantillaDTO[]>([]);

  constructor() {
    this.templatesWatcher = effect(() => {
      const templates = this.templateService.templates();
      const result: DocumentoPlantillaDTO[] = [];
      if (templates && templates.length) {
        for (const iTemplate of templates) {
          if (
            PlantillaHelper.buscarPropiedad(iTemplate.propiedades, PlantillaHelper.PLANTILLA_ACCESO_RAPIDO)
            && PlantillaHelper.buscarPropiedad(iTemplate.propiedades, PlantillaHelper.PERMISO_PLANTILLA_CREAR)
          ) {
            result.push(iTemplate);
          }
        }
      }
      this.shortcuts.set(result);
      this.filteredShortcuts.set([...result]);
    });
  }

  ngOnDestroy() {
    this.templatesWatcher.destroy();
  }

  toggle(force: boolean | null = null) {
    this.open.update((v) => (force === null ? !v : force));
  }

  filterItem() {
    if (!this.filterValue) {
      this.filteredShortcuts.set([...this.shortcuts()]);
      return;
    }
    this.filteredShortcuts.set(
      this.shortcuts().filter(
        (item) => item.nombre.toLowerCase().indexOf(this.filterValue.toLowerCase()) > -1,
      ),
    );
  }

  openShortcut(shortcut: DocumentoPlantillaDTO) {
    this.toggle(false);
    const pedidoVenta = new PedidoVentaDTO();
    pedidoVenta.plantilla = shortcut.llaveTabla;
    this.utilsService.modalWithParams(pedidoVenta, true);
  }
}
