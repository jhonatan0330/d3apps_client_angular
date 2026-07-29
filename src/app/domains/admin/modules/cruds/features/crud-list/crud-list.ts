import { AfterViewInit, Component, OnDestroy, OnInit, Type, ViewChild, ViewContainerRef, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { ImageFormatPipe } from '@/app/shared/pipes/image-format.pipe';
import {
  DocumentoPlantillaCaracteristicaDTO,
  DocumentoPlantillaDTO,
  PedidoVentaCaracteristicaDTO,
  PedidoVentaCaracteristicaFilterDTO,
  PedidoVentaDTO,
  ProcesoEstadoDTO,
  ReporteBaseDTO,
} from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { PedidoVentaFilterDTO } from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { ApiService } from '@/app/domains/admin/modules/neuron/services/api.service';
import { TemplateService } from '@/app/domains/admin/modules/neuron/services/template.service';
import { UtilsService } from '@/app/domains/admin/modules/neuron/services/utils.service';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';
import { DocumentoPlantillaCaracteristicaEnum, StatesEnum } from '@/app/domains/admin/modules/neuron/domain/sw42.enum';
import { LocalConstants, LocalStoreService } from '@/app/shared/services/local-store.service';
import { PropiedadDTO } from '@/app/shared/domain/shared.domain';
import { IDynamicControl } from '@/app/domains/admin/modules/neuron/features/controls/base/base.interface';
import { getComponent } from '@/app/domains/admin/modules/neuron/helpers/form-helper';

@Component({
  selector: 'app-crud-list',
  imports: [
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatDividerModule,
    MatTableModule,
    MatCardModule,
    ImageFormatPipe,
  ],
  template: `
    <div class="absolute inset-0 flex flex-col min-w-0 overflow-hidden">
      <mat-drawer-container class="flex-auto h-full">
        <!-- Drawer (filters) -->
        <mat-drawer
          position="end"
          class="w-80 dark:bg-neutral-900"
          [mode]="drawerMode"
          [(opened)]="drawerOpened"
          #drawer
        >
          <div class="flex flex-col flex-auto w-full p-2">
            @if (!isLoading) {
              <div class="w-full">
                <button mat-icon-button color="primary" matTooltip="Listar" (click)="listar(1)" class="m-1">
                  <mat-icon>refresh</mat-icon>
                </button>
                <button
                  mat-icon-button
                  [class.text-primary]="viewMode === 'list-view'"
                  (click)="viewMode = 'list-view'"
                >
                  <mat-icon>format_list_bulleted</mat-icon>
                </button>
                <button
                  mat-icon-button
                  [class.text-primary]="viewMode === 'grid-view'"
                  (click)="viewMode = 'grid-view'"
                >
                  <mat-icon>apps</mat-icon>
                </button>
                @if (viewMode !== 'grid-view' && plantilla()?.reportes?.length) {
                  <div class="py-1">
                    <button mat-flat-button color="accent" class="w-full" [matMenuTriggerFor]="userMenuList">
                      <mat-icon svgIcon="heroicons_outline:printer"></mat-icon> Imprimir
                    </button>
                    <mat-menu #userMenuList="matMenu">
                      @for (r of plantilla()?.reportes; track r.llaveTabla) {
                        <button mat-menu-item (click)="showReport(r, null)">
                          <mat-icon svgIcon="heroicons_outline:printer"></mat-icon>
                          <span>{{ r.nombre }}</span>
                        </button>
                      }
                    </mat-menu>
                  </div>
                }
                @if (reportForms()) {
                  <div class="py-1">
                    <button mat-flat-button color="accent" class="w-full" [matMenuTriggerFor]="reportFormMenuList">
                      <mat-icon svgIcon="heroicons_outline:printer"></mat-icon> Informes
                    </button>
                    <mat-menu #reportFormMenuList="matMenu">
                      @for (rf of reportForms(); track rf.llaveTabla) {
                        <button mat-menu-item (click)="openDialog(rf.valor, '')">
                          <mat-icon svgIcon="heroicons_outline:printer"></mat-icon>
                          <span>{{ rf.texto }}</span>
                        </button>
                      }
                    </mat-menu>
                  </div>
                }
              </div>
            }
            <div>
              @if (hasCreatePermission()) {
                <button class="w-full" mat-flat-button color="primary" (click)="openDialogFromTemplateModule()">
                  <mat-icon>add</mat-icon>
                  <span>Nuevo</span>
                </button>
              }
              @if (templatesFromProcess().length > 0) {
                @for (templateToCreate of templatesFromProcess(); track templateToCreate.llaveTabla) {
                  <button
                    class="w-full my-1"
                    mat-flat-button
                    color="primary"
                    (click)="openDialog(templateToCreate.llaveTabla, templateToCreate.server)"
                  >
                    <mat-icon>add</mat-icon>
                    <span>{{ templateToCreate.nombre }}</span>
                  </button>
                }
              }
            </div>

            <div class="text-primary text-xs uppercase font-bold py-2">Filtrar</div>
            <label><input id="chkCodeFull" class="mx-2" type="checkbox" [formControl]="fControlCheck" /> Filtrar por codigo Exacto</label>
            <div>
              <mat-form-field subscriptSizing="dynamic">
                <input matInput type="text" placeholder="Coloca un texto y presiona enter" [formControl]="fControlSearch" autocomplete="off" (keyup.enter)="listar(1)" />
                <button matSuffix mat-icon-button (click)="fControlSearch.setValue('')">
                  <mat-icon svgIcon="heroicons_outline:x-circle"></mat-icon>
                </button>
              </mat-form-field>
              <button class="w-full" mat-flat-button color="accent" (click)="listar(1)">
                <mat-icon>refresh</mat-icon>
                <span>Listar</span>
              </button>
            </div>

            @if (!fControlCheck.value) {
              @if (solicitarFechas()) {
                <div class="text-primary text-xs uppercase font-bold py-2">Filtrar por fechas</div>
                <div>
                  <div class="flex">
                    <mat-form-field class="pr-2" subscriptSizing="dynamic">
                      <mat-label>Fecha Inicial</mat-label>
                      <input matInput [matDatepicker]="pickerFrom" [formControl]="fCDateStart" autocomplete="off" />
                      <mat-datepicker-toggle matSuffix [for]="pickerFrom" [tabIndex]="-1"></mat-datepicker-toggle>
                      <mat-datepicker #pickerFrom></mat-datepicker>
                    </mat-form-field>
                    @if (fCDateStart.value) {
                      <mat-form-field class="w-52" subscriptSizing="dynamic">
                        <mat-label>Hora Inicial</mat-label>
                        <input matInput type="time" [formControl]="fCTimeStart" />
                      </mat-form-field>
                    }
                  </div>
                  <div class="flex">
                    <mat-form-field class="pr-2" subscriptSizing="dynamic">
                      <mat-label>Fecha Final</mat-label>
                      <input matInput [matDatepicker]="pickerTo" [formControl]="fCDateEnd" autocomplete="off" />
                      <mat-datepicker-toggle matSuffix [for]="pickerTo" [tabIndex]="-1"></mat-datepicker-toggle>
                      <mat-datepicker #pickerTo></mat-datepicker>
                    </mat-form-field>
                    @if (fCDateEnd.value) {
                      <mat-form-field class="w-52" subscriptSizing="dynamic">
                        <mat-label>Hora Final</mat-label>
                        <input matInput type="time" [formControl]="fCTimeEnd" />
                      </mat-form-field>
                    }
                  </div>
                </div>
              }

              @if (dynamicControls.length > 0) {
                <div class="text-primary text-xs uppercase font-bold py-2">Filtros por campos</div>
                <div class="pt-2">
                  <ng-template #dynamycFormElement></ng-template>
                </div>
              }

              <div class="py-2">
                <label class="text-primary text-xs uppercase font-bold px-2">
                  <input class="mx-2 py-1" type="checkbox" [(ngModel)]="masterSelected" (change)="toggleAll()" /> Filtrar por estados
                </label>
              </div>
              <form [formGroup]="form">
                @if (plantilla()?.estados) {
                  @for (_estado of plantilla()?.estados; track _estado.llaveTabla) {
                    <div class="p-0.5 w-full flex items-center">
                      <label class="text-sm w-full px-2">
                        <input class="mx-2 py-1" type="checkbox" [formControlName]="_estado.llaveTabla" />
                        {{ _estado.nombre }}
                      </label>
                      <div class="w-4 h-4 border rounded" [style.backgroundColor]="getColor(_estado.llaveTabla)!" [style.color]="getColorFont(_estado.llaveTabla)!"></div>
                    </div>
                  }
                }
              </form>

              <div class="text-primary text-xs uppercase font-bold py-2">Filtrar por fecha registro</div>
              <div>
                <div class="flex">
                  <mat-form-field class="pr-2" subscriptSizing="dynamic">
                    <mat-label>Fecha Inicial</mat-label>
                    <input matInput [matDatepicker]="pickerFromR" [formControl]="fRegistroDateStart" autocomplete="off" />
                    <mat-datepicker-toggle matSuffix [for]="pickerFromR" [tabIndex]="-1"></mat-datepicker-toggle>
                    <mat-datepicker #pickerFromR></mat-datepicker>
                  </mat-form-field>
                  @if (fRegistroDateStart.value) {
                    <mat-form-field class="w-52" subscriptSizing="dynamic">
                      <mat-label>Hora Inicial</mat-label>
                      <input matInput type="time" [formControl]="fRegistroTimeStart" />
                    </mat-form-field>
                  }
                </div>
                <div class="flex">
                  <mat-form-field class="pr-2" subscriptSizing="dynamic">
                    <mat-label>Fecha Final</mat-label>
                    <input matInput [matDatepicker]="pickerToR" [formControl]="fRegistroDateEnd" autocomplete="off" />
                    <mat-datepicker-toggle matSuffix [for]="pickerToR" [tabIndex]="-1"></mat-datepicker-toggle>
                    <mat-datepicker #pickerToR></mat-datepicker>
                  </mat-form-field>
                  @if (fRegistroDateEnd.value) {
                    <mat-form-field class="w-52" subscriptSizing="dynamic">
                      <mat-label>Hora Final</mat-label>
                      <input matInput type="time" [formControl]="fRegistroTimeEnd" />
                    </mat-form-field>
                  }
                </div>
              </div>
            }
          </div>
        </mat-drawer>

        <!-- Main content -->
        <mat-drawer-content class="flex flex-col">
          <div class="flex-auto">
            <div class="flex flex-col flex-auto min-w-0">
              <!-- Header -->
              <div class="flex flex-row flex-0 sm:items-center sm:justify-between p-3 sm:py-4 sm:px-5 border-b bg-white dark:bg-neutral-800">
                <img class="w-12 h-12 object-cover rounded cursor-pointer" [src]="(plantilla()?.imagen ?? '') | imageFormat" (click)="openDiagram()" />
                <div class="flex-1 min-w-0">
                  <div class="mt-2">
                    <h2 class="text-xl md:text-2xl font-extrabold tracking-tight leading-7 sm:leading-10 truncate">
                      {{ plantilla()?.nombre }}
                    </h2>
                  </div>
                </div>
                @if (!drawerOpened) {
                  <button mat-icon-button matTooltip="Listar" (click)="listar(1)" class="m-1">
                    <mat-icon>refresh</mat-icon>
                  </button>
                  @if (hasCreatePermission()) {
                    <button mat-icon-button matTooltip="Crear" (click)="openDialogFromTemplateModule()" class="m-1">
                      <mat-icon>add</mat-icon>
                    </button>
                  }
                }
                <button mat-icon-button class="m-1" (click)="toggleDrawer()">
                  <mat-icon svgIcon="heroicons_outline:bars-3"></mat-icon>
                </button>
              </div>

              <!-- Grid View -->
              @if (viewMode === 'grid-view') {
                <div class="flex flex-wrap p-1 w-full">
                  @for (iDocument of dataProvider(); track iDocument.llaveTabla) {
                    <div class="w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 p-1">
                      <div class="p-0 rounded shadow-sm h-full border-b bg-white dark:bg-neutral-800">
                        <div class="p-1 rounded-t"
                          [style.backgroundColor]="getColor(iDocument.estadoExpediente)!"
                          [style.color]="getColorFont(iDocument.estadoExpediente)!">
                          <div class="flex items-center">
                            <div class="w-16 p-1">
                              <a (click)="openDocument(iDocument)">
                                <img class="w-full object-cover" [src]="iDocument.imagen | imageFormat" />
                              </a>
                            </div>
                            <div class="w-full p-1 rounded leading-tight font-semibold">
                              <a (click)="openDocument(iDocument)">
                                <div class="text-md">{{ iDocument.nombre }}</div>
                              </a>
                              @if (iDocument.descripcion) {
                                <a (click)="openDocument(iDocument)">
                                  <div class="text-sm line-clamp-4">{{ iDocument.descripcion }}</div>
                                </a>
                              }
                            </div>
                            @if (plantilla()?.reportes?.length) {
                              <button mat-icon-button [matMenuTriggerFor]="userMenu">
                                <mat-icon>more_vert</mat-icon>
                              </button>
                              <mat-menu #userMenu="matMenu">
                                @for (r of plantilla()?.reportes; track r.llaveTabla) {
                                  <button mat-menu-item (click)="showReport(r, iDocument)">
                                    <mat-icon svgIcon="heroicons_outline:printer"></mat-icon>
                                    <span>{{ r.nombre }}</span>
                                  </button>
                                }
                              </mat-menu>
                            }
                          </div>
                          <div class="flex flex-row gap-2 text-xs">
                            <span>{{ iDocument.fecha | date }}</span>
                            <span class="font-semibold">{{ iDocument.estadoNombre }}</span>
                          </div>
                          @if (iDocument.dinero) {
                            <div class="flex justify-between text-sm">
                              <span class="line-clamp-1">{{ iDocument.dinero.valorCampo | currency }}</span>
                              <span>{{ iDocument.dinero.valorTotal | currency }}</span>
                            </div>
                          }
                        </div>
                        @if (iDocument.caracteristicas?.length) {
                          <div class="p-1">
                            @for (f of iDocument.caracteristicas; track f.campo) {
                              <div class="flex items-center text-xs">
                                <small class="whitespace-nowrap font-extralight mr-2">{{ f.campoDTO?.nombre }}</small>
                                @if (f.valorText) {
                                  <div class="text-right w-full truncate text-md">
                                    @if (f.valorText.startsWith('http')) {
                                      <img [src]="f.valorText" class="h-8" />
                                    } @else {
                                      <div class="line-clamp-1" [class.font-bold]="f.estado === 'C'">{{ f.valorText }}</div>
                                    }
                                  </div>
                                }
                              </div>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Table View -->
              @if (viewMode !== 'grid-view') {
                <table mat-table [dataSource]="dataProvider()" class="w-full">
                  <ng-container matColumnDef="select">
                    <th mat-header-cell *matHeaderCellDef>
                      <input type="checkbox" (change)="masterToggle()"
                        [checked]="selection.hasValue() && isAllSelected()"
                        [indeterminate]="selection.hasValue() && !isAllSelected()" />
                    </th>
                    <td mat-cell *matCellDef="let row">
                      <input type="checkbox" (click)="$event.stopPropagation(); multipleSelect($event, row)"
                        (change)="selection.toggle(row)"
                        [checked]="selection.isSelected(row)" />
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="nombre">
                    <th mat-header-cell *matHeaderCellDef>CODIGO</th>
                    <td mat-cell *matCellDef="let element">
                      <a (click)="$event.stopPropagation(); openDocument(element)" class="flex items-center gap-1 cursor-pointer text-primary">
                        <mat-icon class="text-sm">open_in_new</mat-icon>
                        <span class="mat-caption">{{ element.nombre }}</span>
                      </a>
                    </td>
                  </ng-container>

                  @if (displayedColumns().includes('descripcion')) {
                    <ng-container matColumnDef="descripcion">
                      <th mat-header-cell *matHeaderCellDef>NOMBRE</th>
                      <td mat-cell *matCellDef="let element">
                        <small>{{ element.descripcion }}</small>
                      </td>
                    </ng-container>
                  }

                  <ng-container matColumnDef="estadoExpediente">
                    <th mat-header-cell *matHeaderCellDef>ESTADO</th>
                    <td mat-cell *matCellDef="let element">
                      <small>{{ element.estadoNombre }}</small>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="fecha">
                    <th mat-header-cell *matHeaderCellDef>FECHA</th>
                    <td mat-cell *matCellDef="let element">
                      <small>{{ element.fecha | date }}</small>
                    </td>
                  </ng-container>

                  @if (displayedColumns().includes('valor')) {
                    <ng-container matColumnDef="valor">
                      <th mat-header-cell *matHeaderCellDef>VALOR</th>
                      <td mat-cell *matCellDef="let element">
                        @if (element.dinero) {
                          <span>{{ element.dinero.valorTotal | currency }}</span>
                        }
                      </td>
                    </ng-container>
                  }

                  <ng-container matColumnDef="detalles">
                    <th mat-header-cell *matHeaderCellDef>DETALLES</th>
                    <td mat-cell *matCellDef="let element">
                      @if (element.caracteristicas?.length) {
                        <div class="w-full">
                          @for (f of element.caracteristicas; track f.campo) {
                            <div class="w-full flex justify-between text-sm">
                              <div>{{ f.campoDTO?.nombre }}</div>
                              <div class="w-full text-right pl-2 line-clamp-1">{{ f.valorText }}</div>
                            </div>
                          }
                        </div>
                      }
                    </td>
                  </ng-container>

                  @if (plantilla()?.reportes?.length) {
                    <ng-container matColumnDef="acciones">
                      <th mat-header-cell *matHeaderCellDef>:</th>
                      <td mat-cell *matCellDef="let element">
                        <button mat-icon-button [matMenuTriggerFor]="userMenu" (click)="$event.stopPropagation()">
                          <mat-icon>more_vert</mat-icon>
                        </button>
                        <mat-menu #userMenu="matMenu">
                          @for (r of plantilla()?.reportes; track r.llaveTabla) {
                            <button mat-menu-item (click)="showReport(r, element)">
                              <mat-icon svgIcon="heroicons_outline:printer"></mat-icon>
                              <span>{{ r.nombre }}</span>
                            </button>
                          }
                        </mat-menu>
                      </td>
                    </ng-container>
                  }

                  <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns()" (click)="multipleSelect($event, row)"></tr>
                </table>
              }

              <!-- Empty state -->
              @if (!isLoading && !isEnd && dataProvider().length === 0) {
                <div class="my-48 flex flex-col items-center justify-center">
                  <div class="max-w-sm p-6 bg-white border border-neutral-200 rounded-lg shadow dark:bg-neutral-800 dark:border-neutral-700 mx-auto text-center">
                    <img class="w-12 h-12 mx-auto mb-2" [src]="(plantilla()?.imagen ?? '') | imageFormat" />
                    <h5 class="mb-2 text-2xl font-semibold tracking-tight">{{ plantilla()?.nombre }}</h5>
                    <p>{{ plantilla()?.objetivo }}</p>
                    <br />
                    <p class="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
                      Para encontrar lo que necesitas, simplemente utiliza los filtros.
                      <button class="align-middle" mat-icon-button (click)="toggleDrawer()">
                        <mat-icon svgIcon="heroicons_outline:bars-3"></mat-icon>
                      </button>
                    </p>
                    <button mat-flat-button class="w-full" (click)="listar(pagina())">Buscar</button>
                  </div>
                </div>
              }

              <!-- No results -->
              @if (isEnd && dataProvider().length === 0) {
                <div class="m-auto my-48 flex flex-col items-center justify-center">
                  <div class="max-w-sm p-6 bg-white border border-neutral-200 rounded-lg shadow dark:bg-neutral-800 dark:border-neutral-700 mx-auto text-center">
                    <p class="text-lg font-medium">No se han encontrado resultados</p>
                    <br />
                    <p class="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
                      Lo sentimos, no encontramos ningun resultado para tu busqueda.
                      <button class="align-middle" mat-icon-button (click)="toggleDrawer()">
                        <mat-icon svgIcon="heroicons_outline:bars-3"></mat-icon>
                      </button>
                    </p>
                    <button mat-flat-button class="w-full" (click)="listar(pagina())">Buscar</button>
                  </div>
                </div>
              }
            </div>

            <!-- Footer / Pagination -->
            <div class="w-full px-4 py-3 bg-white border-t border-neutral-200 shadow-sm sm:px-6 dark:bg-neutral-800 dark:border-neutral-700">
              <mat-progress-bar mode="indeterminate" *ngIf="isLoading"></mat-progress-bar>
              @if (!isLoading) {
                <div class="flex justify-between w-full items-center">
                  <div class="flex items-center flex-col">
                    @if (viewMode !== 'grid-view') {
                      <div>Seleccionados: {{ selection.selected.length }}</div>
                    }
                    <div class="flex items-center gap-2">
                      <button mat-icon-button (click)="toggleDrawer()">
                        <mat-icon svgIcon="heroicons_outline:bars-3"></mat-icon>
                      </button>
                      <span class="font-medium">Total: {{ dataProvider().length }}</span>
                    </div>
                  </div>
                  <select [formControl]="pageControl"
                    class="bg-neutral-50 border border-neutral-300 text-sm rounded-lg p-2.5 dark:bg-neutral-700 dark:border-neutral-600">
                    <option value="30">30</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                  @if (!isLoading && !isEnd) {
                    <button mat-raised-button (click)="listar(pagina())" class="flex items-center gap-1 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 dark:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-600">
                      Presiona aqui para buscar mas resultados
                      <svg stroke="currentColor" fill="currentColor" viewBox="0 0 20 20" class="w-5 h-5">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                      </svg>
                    </button>
                  }
                </div>
              }
            </div>
          </div>
        </mat-drawer-content>
      </mat-drawer-container>
    </div>
  `,
})
export default class CrudListComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly templateService = inject(TemplateService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly ls = inject(LocalStoreService);
  private readonly utilsService = inject(UtilsService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private readonly _unsubscribeAll = new Subject<void>();

  protected readonly plantilla = signal<DocumentoPlantillaDTO | null>(null);
  protected readonly templatesFromProcess = signal<DocumentoPlantillaDTO[]>([]);
  protected readonly dataProvider = signal<PedidoVentaDTO[]>([]);
  protected readonly displayedColumns = signal<string[]>([]);
  protected readonly reportForms = signal<PropiedadDTO[]>([]);
  protected readonly solicitarFechas = signal(true);
  protected readonly hasCreatePermission = signal(false);
  protected readonly pagina = signal(1);

  protected fControlSearch = new FormControl('');
  protected fCDateStart = new FormControl<Date | null>(null);
  protected fCDateEnd = new FormControl<Date | null>(null);
  protected fCTimeStart = new FormControl({ value: '00:00', disabled: false });
  protected fCTimeEnd = new FormControl({ value: '23:59', disabled: false });
  protected fRegistroDateStart = new FormControl<Date | null>(null);
  protected fRegistroDateEnd = new FormControl<Date | null>(null);
  protected fRegistroTimeStart = new FormControl({ value: '', disabled: true });
  protected fRegistroTimeEnd = new FormControl({ value: '', disabled: true });
  protected fControlCheck = new FormControl(false);
  protected pageControl = new FormControl('30');
  protected isLoading = false;
  protected isEnd = false;
  protected viewMode = 'grid-view';
  protected form: FormGroup = new FormGroup({});
  protected masterSelected = false;

  protected selection = new SelectionModel<PedidoVentaDTO>(true, []);
  private lastSelectedSegmentRow: PedidoVentaDTO | null = null;

  @ViewChild('drawer') drawer!: MatDrawer;
  protected drawerMode: 'over' | 'side' = 'side';
  protected drawerOpened = true;

  @ViewChild('dynamycFormElement', { read: ViewContainerRef })
  myForm!: ViewContainerRef;
  protected dynamicControls: IDynamicControl[] = [];

  ngOnInit() {
    this.breakpointObserver.observe([Breakpoints.Medium, Breakpoints.Large, Breakpoints.XLarge])
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((state) => {
        if (state.matches) {
          this.drawerMode = 'side';
          this.drawerOpened = true;
        } else {
          this.drawerMode = 'over';
          this.drawerOpened = false;
        }
      });

    this.route.params.pipe(takeUntil(this._unsubscribeAll)).subscribe((params: Params) => {
      const propType = params['type'];
      if (!propType) { this.router.navigate(['/admin/main']); return; }

      this.isEnd = false;
      this.dataProvider.set([]);
      this.templatesFromProcess.set([]);
      this.fControlSearch.setValue('');
      this.procesoId = null;

      if (propType === 'list') {
        const p = this.templateService.getTemplate(params['id'], params['server_id']);
        if (!p) { this.router.navigate(['/admin/main']); return; }
        this.plantilla.set(p);
      } else if (propType === 'process_crud') {
        this.procesoId = params['id'];
        if (this.procesoId) {
          const proc = this.templateService.getProceso(this.procesoId);
          this.plantilla.set(proc ?? null);
          if (proc?.proceso) {
            const list = this.templateService.getTemplateOfProcess(this.procesoId);
            if (list) {
              this.templatesFromProcess.set(list.filter(
                (item) => item.propiedades &&
                  PlantillaHelper.buscarPropiedad(item.propiedades, PlantillaHelper.PERMISO_PLANTILLA_CREAR) &&
                  PlantillaHelper.buscarPropiedad(item.propiedades, PlantillaHelper.PLANTILLA_INICIA_PROCESO),
              ));
            }
          }
        } else {
          this.router.navigate(['/admin/main']); return;
        }
      } else {
        this.router.navigate(['/admin/main']); return;
      }

      const p = this.plantilla();
      if (!p) { this.router.navigate(['/admin/main']); return; }

      const solicitar = !PlantillaHelper.isEmpty(p.propiedades, PlantillaHelper.FORM_SOLICITAR_FECHAS);
      let anyProcessSolicitar = solicitar;
      if (!solicitar && this.templatesFromProcess().length > 0) {
        for (const tp of this.templatesFromProcess()) {
          if (!PlantillaHelper.isEmpty(tp.propiedades, PlantillaHelper.FORM_SOLICITAR_FECHAS)) {
            anyProcessSolicitar = true; break;
          }
        }
      }
      this.solicitarFechas.set(anyProcessSolicitar);
      this.reportForms.set(PlantillaHelper.buscarValorMultiple(p.propiedades, PlantillaHelper.REPORT_MODULE_REFERENCE) ?? []);

      if (anyProcessSolicitar) {
        this.fCDateStart.setValue(new Date());
        const endDate = new Date(); endDate.setDate(endDate.getDate() + 1);
        this.fCDateEnd.setValue(endDate);
        this.fCTimeStart.enable();
        this.fCTimeEnd.enable();
        this.fCTimeStart.setValue('00:00');
        this.fCTimeEnd.setValue('23:59');
      } else {
        this.fCDateStart.setValue(null);
        this.fCDateEnd.setValue(null);
        this.fCTimeStart.reset();
        this.fCTimeEnd.reset();
        this.fCTimeStart.disable();
        this.fCTimeEnd.disable();
      }

      this.fRegistroDateStart.setValue(null);
      this.fRegistroDateEnd.setValue(null);
      this.fRegistroTimeStart.disable();
      this.fRegistroTimeEnd.disable();

      this.hasCreatePermission.set(!PlantillaHelper.isEmpty(p.propiedades, PlantillaHelper.PERMISO_PLANTILLA_CREAR));

      if (p.estados) {
        const controls: Record<string, FormControl> = {};
        for (const element of p.estados) {
          const key = element.llaveTabla || element.estadoDocumento;
          controls[key] = new FormControl(element.estadoDocumento === StatesEnum.ACTIVE);
        }
        this.form = this.formBuilder.group(controls);
      }

      const cols: string[] = [];
      if (p.reportes && p.reportes.length > 0) cols.push('select');
      cols.push('nombre');
      if (!PlantillaHelper.isEmpty(p.propiedades, PlantillaHelper.FORM_DESCRIPCION)) cols.push('descripcion');
      cols.push('estadoExpediente');
      cols.push('fecha');
      if (!PlantillaHelper.isEmpty(p.propiedades, PlantillaHelper.FORM_TOTAL)) cols.push('valor');
      cols.push('detalles');
      if (p.reportes && p.reportes.length > 0) cols.push('acciones');
      this.displayedColumns.set(cols);

      setTimeout(() => this.showFields());
    });
  }

  private procesoId: string | null = null;

  ngAfterViewInit() {
    setTimeout(() => this.showFields());
  }

  ngOnDestroy() {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  toggleDrawer() { this.drawer.toggle(); }

  openDialogFromTemplateModule() {
    const p = this.plantilla();
    if (p) this.openDialog(p.llaveTabla, p.server);
  }

  openDialog(template: string, server: string) {
    if (!template) return;
    const pedidoVenta = new PedidoVentaDTO();
    pedidoVenta.plantilla = template;
    pedidoVenta.server = server;
    this.utilsService.modalWithParams(pedidoVenta);
  }

  getColor(pEstado: string) { return this.templateService.getColor(pEstado); }
  getColorFont(pEstado: string) { return this.templateService.getColorFont(pEstado); }

  listar(_pagina: number) {
    if (this.isLoading) return;
    const p = this.plantilla();
    if (!p) return;

    const entity = new PedidoVentaFilterDTO();
    entity.plantilla = p.llaveTabla;
    entity.proceso = this.procesoId ?? '';

    if (this.fControlCheck.value) {
      if (!this.fControlSearch.value) {
        this.snackBar.open('Seleccionaste la opcion codigo exacto, ayudanos colocando el codigo del documento. Gracias', 'Cerrar', { duration: 5000 });
        return;
      }
      entity.nombre = this.fControlSearch.value ?? '';
      entity.filtroParametro = '';
    } else {
      entity.nombre = '';
      entity.filtroParametro = this.fControlSearch.value ?? '';
      if (this.solicitarFechas() && (!this.fCDateStart.value || !this.fCDateEnd.value)) {
        this.snackBar.open('Por favor coloca una fecha de inicio y una fecha de fin', 'Cerrar', { duration: 5000 });
        return;
      }
      if (this.fCDateStart.value) entity.fechaMin = this.formatDate(this.fCDateStart, this.fCTimeStart);
      if (this.fCDateEnd.value) entity.fechaMax = this.formatDate(this.fCDateEnd, this.fCTimeEnd);
      if (!this.validateDate(entity.fechaMin, entity.fechaMax)) return;
      if (this.fRegistroDateStart.value) entity.fechaRegistroMin = this.formatDate(this.fRegistroDateStart, this.fRegistroTimeStart);
      if (this.fRegistroDateEnd.value) entity.fechaRegistroMax = this.formatDate(this.fRegistroDateEnd, this.fRegistroTimeEnd);
      if (!this.validateDate(entity.fechaRegistroMin, entity.fechaRegistroMax)) return;
    }

    if (p.estados && !this.fControlCheck.value) {
      let estadoExp = '';
      for (const key of Object.keys(this.form.controls)) {
        if (this.form.controls[key].value) estadoExp += ';' + key;
      }
      if (!estadoExp) {
        this.snackBar.open('Selecciona minimo un estado del filtro', 'Cerrar', { duration: 5000 });
        return;
      }
      if (estadoExp === ';A') { entity.estado = StatesEnum.ACTIVE; entity.estadoExpediente = ''; }
      else if (estadoExp === ';I') { entity.estado = StatesEnum.INACTIVE; entity.estadoExpediente = ''; }
      else if (estadoExp === ';A;I') { entity.estado = ''; entity.estadoExpediente = ''; }
      else { entity.estado = ''; }
    }

    this.isLoading = true;
    if (_pagina === 1) {
      this.dataProvider.set([]);
      this.isEnd = false;
      this.selection.clear();
      this.pagina.set(1);
    }
    entity.paginacionRegistroInicial = Number(this.pageControl.value) * (_pagina - 1);
    entity.paginacionRegistroFinal = Number(this.pageControl.value);

    if (this.dynamicControls.length > 0) {
      entity.filtersByFields = this.dynamicControls.map((field) => {
        const fe = new PedidoVentaCaracteristicaFilterDTO();
        fe.campo = field.data.campo;
        fe.valorOpcion = field.data.valorOpcion ?? '';
        fe.valorAuxiliar = field.data.valorAuxiliar ?? '';
        fe.valorText = field.data.valorText ?? '';
        return fe;
      });
    }

    this.api.listarDocumentos(entity, p.server).subscribe({
      next: (dataResult) => {
        if (!dataResult) dataResult = [];
        this.dataProvider.update((current) => _pagina === 1 ? dataResult : [...current, ...dataResult]);
        if (dataResult.length >= Number(this.pageControl.value)) {
          this.pagina.update((v) => v + 1);
        } else {
          this.isEnd = true;
          this.pagina.set(1);
        }
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });
  }

  isAllSelected() { return this.selection.selected.length === this.dataProvider().length; }

  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.dataProvider().forEach((row) => this.selection.select(row));
  }

  multipleSelect(event: MouseEvent, row: PedidoVentaDTO) {
    if (event.shiftKey && this.lastSelectedSegmentRow) {
      let start = this.dataProvider().findIndex((e) => e.llaveTabla === this.lastSelectedSegmentRow!.llaveTabla);
      let end = this.dataProvider().findIndex((e) => e.llaveTabla === row.llaveTabla);
      if (start > end) {
        const tmp = end; end = start; start = tmp;
      }
      this.dataProvider().slice(start, end + 1).forEach((e) => this.selection.select(e));
    }
    this.lastSelectedSegmentRow = row;
  }

  checkboxLabel(row?: PedidoVentaDTO): string {
    if (!row) return this.isAllSelected() ? 'select all' : 'deselect all';
    return this.selection.isSelected(row) ? 'deselect' : 'select';
  }

  openDocument(pDocument: PedidoVentaDTO) {
    const pedidoVenta = new PedidoVentaDTO();
    pedidoVenta.plantilla = pDocument.plantilla;
    pedidoVenta.llaveTabla = pDocument.llaveTabla;
    pedidoVenta.server = this.plantilla()?.server ?? '';
    this.utilsService.modalWithParams(pedidoVenta, false);
  }

  showReport(reporte: ReporteBaseDTO | null, pDocument: PedidoVentaDTO | null) {
    if (!reporte) return;
    let stringURL = reporte.servidorUrl || (this.ls.getItem(LocalConstants.URL_CONF) as string);
    stringURL += '/reporte?nombre=' + reporte.llaveTabla;
    if (pDocument) stringURL += '&P_KEY=' + pDocument.llaveTabla;
    stringURL += '&P_TOKEN=' + this.ls.getItem(LocalConstants.JWT_TOKEN);
    if (reporte.variables) stringURL += '&' + reporte.variables;

    if (this.selection.selected.length >= 1) {
      const count = this.selection.selected.length;
      const msg = count > 50
        ? `Vas a imprimir ${count} documentos. Abriremos ${Math.ceil(count / 50)} pestañas.`
        : `Vas a imprimir ${count} documentos.`;
      if (confirm(msg)) {
        let multiKey = '';
        for (let i = 1; i <= this.selection.selected.length; i++) {
          const pd = this.selection.selected[i - 1];
          multiKey += pd.llaveTabla + ';';
          if (i % 50 === 0) { window.open(stringURL + '&P_MULTIPLE=' + multiKey, '_blank'); multiKey = ''; }
        }
        if (multiKey) window.open(stringURL + '&P_MULTIPLE=' + multiKey, '_blank');
      }
    } else {
      window.open(stringURL, '_blank');
    }
  }

  private showFields() {
    if (this.myForm) {
      this.myForm.clear();
      this.dynamicControls = [];
    } else { return; }
    const p = this.plantilla();
    if (!p) return;
    if (p.estado === 'T') return;
    if (!p.caracteristicas) {
      this.loadTemplate(p.llaveTabla, null);
      return;
    }

    const filterDocument = new PedidoVentaDTO();
    for (const _campo of p.caracteristicas) {
      if (_campo.formato === DocumentoPlantillaCaracteristicaEnum.PROCESO
        && PlantillaHelper.isEmpty(_campo.propiedades, PlantillaHelper.MULTIPLE)
        && PlantillaHelper.isEmpty(_campo.propiedades, PlantillaHelper.PERMISO_CAMPO_BLOQUEAR)) {
        const componentDynamic: Type<any> = getComponent(_campo);
        const componentRef = this.myForm.createComponent(componentDynamic as any);
        const instance = componentRef.instance as IDynamicControl;
        instance.structure = _campo;
        instance.parent = filterDocument;
        instance.urlServer = p.server;
        const uc = new PedidoVentaCaracteristicaDTO();
        uc.campo = _campo.llaveTabla;
        instance.data = uc;
        this.dynamicControls.push(instance);
      }
    }

    for (const iBase of p.caracteristicas) {
      const deps = PlantillaHelper.buscarValorMultipleFromManyKeys(
        iBase.propiedades,
        [PlantillaHelper.DEPENDE, PlantillaHelper.INFORMATIVE_DATA, PlantillaHelper.UPDATE_INFORMATIVE_FIELD],
      );
      if (deps?.length) {
        let depField: IDynamicControl | undefined;
        for (const f of this.dynamicControls) {
          if (f.structure.codigo === iBase.codigo) { depField = f; break; }
        }
        if (depField) {
          for (const codigo of deps) {
            for (const refField of this.dynamicControls) {
              if (refField.structure.llaveTabla === codigo.valor) {
                refField.adicionarListener(depField);
                break;
              }
            }
          }
        }
      }
    }
  }

  private loadTemplate(plantillaId: string, urlServer: string | null) {
    const dp = this.templateService.getTemplate(plantillaId, urlServer);
    if (dp) {
      if (!dp.caracteristicas) {
        this.isLoading = true;
        this.api.obtenerCampos(plantillaId, dp.server).subscribe({
          next: (plantilla) => {
            plantilla.server = dp.server;
            this.isLoading = false;
            this.applyTemplateFields(plantilla);
          },
          error: () => { this.isLoading = false; },
        });
      }
    } else {
      this.snackBar.open('No tienes permisos para ver este documento.', 'Cerrar', { duration: 5000 });
    }
  }

  private applyTemplateFields(value: DocumentoPlantillaDTO) {
    const dp = this.templateService.getTemplate(value.llaveTabla, value.server);
    if (dp) {
      dp.caracteristicas = value.caracteristicas;
      this.plantilla.update((p) => { if (p) p.caracteristicas = value.caracteristicas; return p; });
      this.showFields();
    }
  }

  private formatDate(fecha: FormControl, time: FormControl): Date {
    const d = new Date(fecha.value);
    if (time.value) d.setHours(Number(time.value.substring(0, 2)), Number(time.value.substring(3, 5)), 0, 0);
    else d.setHours(0, 0, 0, 0);
    return d;
  }

  private validateDate(fechaMin: Date | null | undefined, fechaMax: Date | null | undefined): boolean {
    if (fechaMin && fechaMax && fechaMax.getTime() - fechaMin.getTime() <= 0) {
      this.snackBar.open('La fecha maxima es menor que la fecha minima', 'Cerrar', { duration: 5000 });
      return false;
    }
    return true;
  }

  toggleAll() {
    for (const key of Object.keys(this.form.controls)) {
      this.form.controls[key].setValue(this.masterSelected);
    }
  }

  openDiagram() {
    // BPM Diagram component not yet migrated
  }
}
