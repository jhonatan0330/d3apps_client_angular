import { Component, Input, OnDestroy, OnInit, inject, signal, effect } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subject, takeUntil } from 'rxjs';
import { ImageFormatPipe } from '@/app/shared/pipes/image-format.pipe';
import { DocumentoPlantillaDTO, PedidoVentaDTO } from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { TemplateService } from '@/app/domains/admin/modules/neuron/services/template.service';
import { UtilsService } from '@/app/domains/admin/modules/neuron/services/utils.service';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';
import { LoginService } from '@/app/domains/auth/services/login.service';
import { OrganizacionDTO, UsuarioDTO } from '@/app/domains/auth/domain/auth.domain';
import { TemplateItemComponent, TemplateEnum } from './template-item/template-item';
import { environment } from '@/environments/environment';
import AnalyticsDashboard from '../../../dashboards/features/analytics/analytics';
import FinanceDashboard from '../../../dashboards/features/finance/finance';
import ProjectDashboard from '../../../dashboards/features/project/project';

interface MenuNode {
  section: string;
  sectionKey: string;
  children?: DocumentoPlantillaDTO[];
  visible: boolean;
  image: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    ImageFormatPipe,
    TemplateItemComponent,
    AnalyticsDashboard,
    FinanceDashboard,
    ProjectDashboard,
  ],
  template: `
    <div class="flex flex-col flex-auto min-w-0">
      @if (showTemplates) {
        @if (user(); as u) {
          <div class="flex flex-auto flex-col">
            <div class="flex flex-col shadow-sm bg-white dark:bg-neutral-800">
              <div class="flex flex-row flex-0 items-center max-w-5xl w-full mx-auto px-8 lg:h-[4.5rem] bg-white dark:bg-neutral-800">
                <div class="max-w-32 z-0">
                  <img
                    class="w-full h-full rounded-full ring-4 ring-white dark:ring-neutral-800 bg-white"
                    [src]="company()?.imagen"
                    alt="Logo"
                  />
                </div>
                <div class="flex flex-col items-center lg:items-start mt-4 mb-4 lg:mt-0 lg:mb-0">
                  <div class="text-lg font-bold leading-none">{{ company()?.nombre }}</div>
                  <div class="text-neutral-500 dark:text-neutral-400 p-1">{{ company()?.slogan }}</div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 lg:gap-y-0 md:gap-x-6 px-8 py-4 max-w-5xl mx-auto w-full">
              <div class="col-span-1 lg:col-span-2 flex flex-col items-start w-full">
                <mat-card class="flex flex-col w-full p-3" appearance="outlined">
                  <div class="text-xl font-semibold">Bienvenido {{ u.nombre }}</div>
                  <div class="flex flex-col sm:flex-row items-start mt-2">
                    <div class="hidden sm:flex items-center">
                      <img
                        class="w-12 min-w-12 h-12 rounded-full mr-4 object-cover"
                        [src]="u.imagen"
                        alt="Avatar"
                      />
                    </div>
                    <mat-form-field class="w-full" subscriptSizing="dynamic">
                      <mat-label>Que deseas consultar?</mat-label>
                      <input matInput [formControl]="filterControl" (input)="filterItem()" (keyup.enter)="selectFirst()" />
                    </mat-form-field>
                  </div>
                </mat-card>

                <div class="w-full">
                  @for (group of filteredModules(); track group.sectionKey) {
                    <div class="bg-neutral-50 px-6 py-4 border-b dark:bg-transparent rounded-lg">
                      <div class="flex items-center p-4 cursor-pointer" (click)="toggleSection(group)">
                        <img class="w-10 h-10 mr-4 object-cover rounded" [alt]="group.section" [src]="group.image | imageFormat" />
                        <div class="text-xl font-semibold">{{ group.section }}</div>
                      </div>
                      @if (group.visible) {
                        <div class="flex flex-wrap mt-4">
                          @for (template of group.children; track template.llaveTabla) {
                            <div class="w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 p-1">
                              <app-template-item
                                class="h-full"
                                [id]="template.llaveTabla"
                                [nombre]="template.nombre"
                                [imagen]="template.imagen"
                                [processId]="template.proceso"
                                [serverId]="template.server"
                                [type]="getTemplateEnum(template.estado)"
                              ></app-template-item>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>

              <mat-card class="col-span-1 flex flex-col w-full p-3" appearance="outlined">
                <div class="flex items-center justify-between">
                  <div class="text-2xl font-semibold leading-tight">Reportes</div>
                </div>
                @for (template of filteredReports(); track template.llaveTabla) {
                  <div class="w-full p-1">
                    <app-template-item
                      class="h-full"
                      [id]="template.llaveTabla"
                      [nombre]="template.nombre"
                      [imagen]="template.imagen"
                      [processId]="template.proceso"
                      [serverId]="template.server"
                      [type]="getTemplateEnum(template.estado)"
                    ></app-template-item>
                  </div>
                }
              </mat-card>
            </div>
          </div>
        }
      } @else {
        <div class="flex flex-col w-full items-center justify-center h-40 lg:h-[12.5rem] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
          @if (slides().length > 0) {
            <img
              class="w-full h-full object-cover"
              [src]="slides()[currentSlide()]"
              alt="Slide"
            />
            <div class="flex gap-2 -mt-6 z-10">
              @for (slide of slides(); track slide; let i = $index) {
                <button
                  class="w-2 h-2 rounded-full border border-white transition-colors cursor-pointer"
                  [class.bg-white]="i === currentSlide()"
                  [class.bg-transparent]="i !== currentSlide()"
                  (click)="currentSlide.set(i)"
                ></button>
              }
            </div>
          }
        </div>
        <analytics-dashboard />
        <finance-dashboard />
        <project-dashboard />
      }
    </div>
  `,
})
export default class DashboardComponent implements OnInit, OnDestroy {
  @Input() showTemplates = false;

  private readonly templateService = inject(TemplateService);
  private readonly utilsService = inject(UtilsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly loginservice = inject(LoginService);
  private readonly formBuilder = inject(FormBuilder);

  private readonly _unsubscribeAll = new Subject<void>();

  protected readonly currentSlide = signal(0);
  protected readonly slides = signal<string[]>([]);
  protected readonly user = signal<UsuarioDTO | null>(null);
  protected readonly company = signal<OrganizacionDTO | null>(null);
  protected readonly modules = signal<DocumentoPlantillaDTO[]>([]);
  protected readonly filteredReports = signal<DocumentoPlantillaDTO[]>([]);
  protected readonly filteredModules = signal<MenuNode[]>([]);
  protected readonly filterControl = new FormControl('');
  protected isLoading = false;
  protected readonly currentApplicationVersion = environment.appVersion;

  protected signInForm: FormGroup;

  private tempTemplateOpen: string | undefined;
  private tempIdOpen: string | undefined;

  private readonly templateWatcher = effect(() => {
    const templates = this.templateService.templates();
    if (templates) {
      this.loadMenu(templates);
      if (this.tempTemplateOpen) {
        this.openDialog(this.tempTemplateOpen, this.tempIdOpen);
        this.tempTemplateOpen = undefined;
        this.tempIdOpen = undefined;
      }
    }
  });

  private readonly userWatcher = effect(() => {
    const u = this.loginservice.user();
    this.user.set(u);
  });

  private readonly companyWatcher = effect(() => {
    const c = this.loginservice.company();
    this.company.set(c);
  });

  private readonly slidesWatcher = effect(() => {
    this.slides.set(this.loginservice.slides());
  });

  private readonly dateWatcher = effect(() => {
    const date = this.loginservice.currentDate();
    if (!date) return;
    const received = date instanceof Date ? date : new Date(date);
    if (received < new Date()) {
      this.utilsService.modalUserChangePass().then();
    }
  });

  getTemplateEnum(estado: string | undefined | null): TemplateEnum {
    if (estado === 'R') return TemplateEnum.TIPO_REPORTE;
    if (estado === 'T') return TemplateEnum.TIPO_TABLERO;
    return TemplateEnum.TIPO_PLANTILLA;
  }

  ngOnInit() {
    this.signInForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required],
    });

    this.openFormLink();
  }

  ngOnDestroy() {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
    this.templateWatcher.destroy();
    this.userWatcher.destroy();
    this.companyWatcher.destroy();
    this.slidesWatcher.destroy();
    this.dateWatcher.destroy();
  }

  private loadMenu(templates: DocumentoPlantillaDTO[]) {
    const allModules: DocumentoPlantillaDTO[] = [];
    if (templates && templates.length > 0) {
      templates.forEach((element) => {
        if (!element.llaveTabla) {
          allModules.push(element);
          element.estado = 'T';
        }
        if (
          PlantillaHelper.buscarPropiedad(element.propiedades, PlantillaHelper.PLANTILLA_TIPO_REPORTE)
          && PlantillaHelper.buscarPropiedad(element.propiedades, PlantillaHelper.PERMISO_PLANTILLA_CREAR)
        ) {
          const reportElement = new DocumentoPlantillaDTO();
          reportElement.llaveTabla = element.llaveTabla;
          reportElement.nombre = element.nombre;
          reportElement.imagen = element.imagen;
          reportElement.proceso = element.proceso;
          reportElement.server = element.server;
          reportElement.estado = 'R';
          allModules.push(reportElement);
        }
        if (PlantillaHelper.buscarPropiedad(element.propiedades, PlantillaHelper.PERMISO_PLANTILLA_LISTAR_MENU)) {
          element.estado = 'P';
          allModules.push(element);
        }
      });
      this.modules.set(allModules);
      this.filterItem();
    }
  }

  filterItem() {
    let value: string = this.filterControl.value ?? '';
    if (value.endsWith(' ')) value = value.substring(0, value.length - 1);

    const moduleFilter = this.modules().filter(
      (item) =>
        ((item.nombre && item.nombre.toLowerCase().indexOf(value.toLowerCase()) > -1)
          || (item.codigo && item.codigo.toLowerCase() === value.toLowerCase()))
        && item.estado?.indexOf('P') > -1,
    );

    const filtered: MenuNode[] = [];
    moduleFilter.forEach((iFilterModule) => {
      let flagFind = false;
      for (const iFilterMenu of filtered) {
        const prop = PlantillaHelper.buscarPropiedad(iFilterModule.propiedades, PlantillaHelper.PERMISO_PLANTILLA_LISTAR_MENU);
        if (prop && iFilterMenu.sectionKey === prop.valor) {
          if (!iFilterMenu.children) iFilterMenu.children = [];
          iFilterMenu.children.push(iFilterModule);
          flagFind = true;
          break;
        }
      }
      if (!flagFind) {
        const prop = PlantillaHelper.buscarPropiedad(iFilterModule.propiedades, PlantillaHelper.PERMISO_PLANTILLA_LISTAR_MENU);
        if (prop) {
          filtered.push({
            section: prop.texto,
            sectionKey: prop.valor,
            children: [iFilterModule],
            visible: !!value || filtered.length === 0,
            image: iFilterModule.imagen,
          });
        }
      }
    });
    this.filteredModules.set(filtered);

    this.filteredReports.set(
      this.modules().filter(
        (item) =>
          item.nombre && item.nombre.toLowerCase().indexOf(value.toLowerCase()) > -1
          && item.estado?.indexOf('R') > -1,
      ),
    );
  }

  private openFormLink() {
    this.route.params.pipe(takeUntil(this._unsubscribeAll)).subscribe((params: Params) => {
      const type = params['type'];
      if (type) {
        const plantilla = this.templateService.getTemplate(type, null);
        if (plantilla) {
          this.openDialog(type, params['id']);
        } else {
          this.tempTemplateOpen = type;
          this.tempIdOpen = params['id'];
        }
      }
    });
  }

  private openDialog(_type: string, _id?: string) {
    const plantilla = this.templateService.getTemplate(_type, null);
    if (plantilla) {
      const pedidoVenta = new PedidoVentaDTO();
      pedidoVenta.plantilla = plantilla.llaveTabla;
      pedidoVenta.server = plantilla.server;
      if (_id) pedidoVenta.llaveTabla = _id;
      this.utilsService.modalWithParams(pedidoVenta, true);
      this.router.navigate(['/admin/main'], {
        queryParams: { type: null, id: null },
        queryParamsHandling: 'merge',
      });
    }
  }

  selectFirst() {
    if (this.filteredModules().length > 0) {
      const firstChild = this.filteredModules()[0].children?.[0];
      if (firstChild) {
        this.router.navigate(['/admin/list/' + firstChild.llaveTabla]);
        this.filterControl.setValue(null);
        this.filterItem();
      }
    }
  }

  toggleSection(pMenu: MenuNode) {
    this.filteredModules.update((items) =>
      items.map((item) =>
        item.sectionKey === pMenu.sectionKey ? { ...item, visible: !item.visible } : item,
      ),
    );
  }
}
