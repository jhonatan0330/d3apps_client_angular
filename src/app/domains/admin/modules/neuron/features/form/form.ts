import {
  Component,
  OnInit,
  AfterViewInit,
  inject,
  ViewContainerRef,
  ViewChild,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { DatePipe, CurrencyPipe, SlicePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  DetallePedidoVentaDTO,
  DocumentoPlantillaCaracteristicaDTO,
  DocumentoPlantillaDTO,
  PedidoVentaAjusteDTO,
  PedidoVentaCaracteristicaDTO,
  PedidoVentaDineroDTO,
  PedidoVentaDTO,
  PedidoVentaFilterDTO,
  ProcesoTransicionDTO,
  ReporteBaseDTO,
} from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { DocumentoPlantillaCaracteristicaEnum, StatesEnum } from '@/app/domains/admin/modules/neuron/domain/sw42.enum';
import { ApiService } from '@/app/domains/admin/modules/neuron/services/api.service';
import { TemplateService } from '@/app/domains/admin/modules/neuron/services/template.service';
import { UtilsService } from '@/app/domains/admin/modules/neuron/services/utils.service';
import { FormActionsService } from '@/app/domains/admin/modules/neuron/services/form-actions.service';
import { FormTransitionsService } from '@/app/domains/admin/modules/neuron/services/form-transitions.service';
import { FormReportsService } from '@/app/domains/admin/modules/neuron/services/form-reports.service';
import { getComponent } from '@/app/domains/admin/modules/neuron/helpers/form-helper';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';
import { ImageFormatPipe } from '@/app/shared/pipes/image-format.pipe';
import { LoginService } from '@/app/domains/auth/services/login.service';
import { IDynamicControl } from '../controls/base/base.interface';

@Component({
  selector: 'app-form',
  templateUrl: './form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressBarModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatTooltipModule,
    MatCardModule,
    ImageFormatPipe,
    DatePipe,
    CurrencyPipe,
    SlicePipe,
  ],
})
export default class FormComponent implements OnInit, AfterViewInit {
  @ViewChild('dynamycFormElement', { read: ViewContainerRef }) myForm?: ViewContainerRef;

  public readonly dialogRef = inject(MatDialogRef<FormComponent, unknown>);
  public readonly data: any = inject(MAT_DIALOG_DATA);
  private readonly templateService = inject(TemplateService);
  private readonly api = inject(ApiService);
  public readonly jwt = inject(LoginService);
  private readonly utilsService = inject(UtilsService);
  private readonly actionsService = inject(FormActionsService);
  private readonly transitionsService = inject(FormTransitionsService);
  private readonly reportsService = inject(FormReportsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  formIsModified = false;
  dynamicControls: IDynamicControl[] = [];
  submitted = false;
  modificable = false;
  instruccionCrear?: string;
  fullScreen = false;

  pedidoBase?: PedidoVentaDTO;
  plantilla: DocumentoPlantillaDTO | null = null;
  pedido?: PedidoVentaDTO;
  esRol = false;

  identificadorInicial?: string;
  close2Save = false;
  saveInField = false;
  openQuickTransitionAfterSave?: string;

  auxPlantillaProxima?: string;
  documentToTransition?: PedidoVentaDTO;
  transiciones: ProcesoTransicionDTO[] = [];
  uidOpenToNotDuplicate?: string;
  reportes: ReporteBaseDTO[] = [];

  canMassive = false;
  canTransfer = false;
  canDuplicate = false;
  hasVoucher = false;

  canChangeState = false;
  isChangeState = false;
  changeStateIsLoading = false;
  changeStateForm?: FormGroup;
  changeStateEstadoFinal = new FormControl('', Validators.required);
  changeStateMotivo = new FormControl('', Validators.required);
  isLoading = false;

  private readonly CAMPO_POSIBLE_MENOR_PRIORIDAD = '__*__';
  styleSizePop = '';

  ngOnInit(): void {
    if (this.pedidoBase && this.pedidoBase === this.data.data) return;

    if (this.jwt.token !== this.jwt.getJwtToken()) {
      location.reload();
      this.dialogRef.close(false);
      return;
    }

    this.pedidoBase = this.data.data;
    this.identificadorInicial = this.data.identificador;
    this.saveInField = this.data.saveInField ?? false;
    this.openQuickTransitionAfterSave = this.data.openQuickTransitionAfterSave;
    if (this.data.close2Save) this.close2Save = this.data.close2Save;
    if (!this.pedidoBase) return;

    this.plantilla = this.cargarPlantilla(this.pedidoBase.plantilla, this.pedidoBase.server);
    if (!this.plantilla) return;

    if (this.pedidoBase.llaveTabla) {
      this.consultarDocumento(this.pedidoBase.llaveTabla);
    } else {
      if (!PlantillaHelper.isEmpty(this.plantilla.propiedades, PlantillaHelper.FUNCION_SQL_NEW_ANTES)) {
        this.validacionPrevia();
      } else {
        this.pedido = this.copiarPedidoBase(this.pedidoBase, false);
      }
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.showForm());
    this.uidOpenToNotDuplicate = Date.now().toString();
  }

  submit(): void {
    if (this.submitted || !this.modificable) return;
    this.submitted = true;
    this.cdr.detectChanges();

    for (const element of this.dynamicControls) {
      if (!element.send2Server()) {
        this.submitted = false;
        this.cdr.detectChanges();
        return;
      }
    }

    let modificado = false;
    if (this.pedido?.caracteristicas) {
      for (const element of this.pedido.caracteristicas) {
        if (element.modificado) { modificado = true; break; }
      }
    }

    if (this.pedido!.llaveTabla && !modificado) {
      this.snackBar.open('No se ha realizado ninguna modificacion', 'Cerrar', { duration: 2000 });
      this.submitted = false;
      this.cdr.detectChanges();
      return;
    }
    this.pedidoBase!.messages = [];

    if (this.saveInField) {
      this.dialogRef.close({ data: this.pedido });
    } else {
      this.api
        .guardarDocumento(this.copiarPedidoBase(this.pedido!, true), this.plantilla!.server, this.uidOpenToNotDuplicate ?? '')
        .subscribe({
          next: (dataResult: PedidoVentaDTO) => this.openManager(dataResult),
          error: () => { this.submitted = false; this.cdr.detectChanges(); },
        });
    }
  }

  openManager(value: PedidoVentaDTO): void {
    const openNewFormCopyData = PlantillaHelper.buscarValorMultiple(this.plantilla!.propiedades, PlantillaHelper.PERMISO_PLANTILLA_INICIO_RAPIDO);
    const successFullText = PlantillaHelper.buscarValor(this.plantilla!.propiedades, PlantillaHelper.PLANTILLA_SUCCESS_INFORMATION);

    if ((!this.identificadorInicial && !this.close2Save && !successFullText) || openNewFormCopyData) {
      const pedidoVenta = new PedidoVentaDTO();
      pedidoVenta.plantilla = value.plantilla;
      if (openNewFormCopyData) {
        for (const iCopyData of openNewFormCopyData) {
          for (const jField of this.pedido!.caracteristicas!) {
            if (jField.campo === iCopyData.valor) {
              if (!pedidoVenta.caracteristicas) pedidoVenta.caracteristicas = [];
              const uc = new PedidoVentaCaracteristicaDTO();
              uc.valorOpcion = jField.valorOpcion;
              uc.valorAuxiliar = jField.valorAuxiliar;
              uc.valorFecha = jField.valorFecha;
              uc.valorNumero = jField.valorNumero;
              uc.valorText = jField.valorText;
              uc.campo = jField.campo;
              pedidoVenta.caracteristicas.push(uc);
              break;
            }
          }
        }
      } else {
        pedidoVenta.llaveTabla = value.llaveTabla;
      }
      pedidoVenta.server = this.plantilla!.server;
      pedidoVenta.messages = value.messages;
      this.utilsService.modalWithParams(pedidoVenta);
    } else {
      this.snackBar.open(value.nombre ?? 'Guardado', '', { duration: 1500, panelClass: ['snackbar-success'] });
    }

    this.pedido!.llaveTabla = value.llaveTabla;
    this.reportsService.autoPrintReports(this.reportes, this.pedido!);
    this.submitted = false;

    if (successFullText) {
      this.utilsService.modalSuccess(successFullText);
    }

    const rapidTemplate = this.transitionsService.resolveRapidTransition(value, this.plantilla!);
    if (rapidTemplate) {
      this.actionsService.reloadScreen(this.pedido!, this.dialogRef, rapidTemplate);
      return;
    }

    if (this.dialogRef) {
      if (!openNewFormCopyData) {
        this.dialogRef.close({ data: value });
      } else {
        this.dialogRef.close();
      }
    }
  }

  consultarDocumento(id: string): void {
    const entity = new PedidoVentaFilterDTO();
    entity.llaveTabla = id;
    this.api.consultarDocumento(entity, this.plantilla!.server).subscribe({
      next: (_value: PedidoVentaDTO) => {
        this.pedido = _value;
        this.pedido.messages = this.pedidoBase!.messages;
        this.showForm();
        this.cdr.detectChanges();
      },
      error: () => this.dialogRef.close(),
    });
  }

  validacionPrevia(): void {
    if (!this.plantilla?.llaveTabla) return;
    const entity = new PedidoVentaFilterDTO();
    entity.plantilla = this.plantilla.llaveTabla;
    this.api.validateBeforeNew(entity, this.plantilla.server).subscribe({
      next: (_value: PedidoVentaDTO) => {
        if (_value?.messages && _value.messages.length > 0) {
          const msg = _value.messages.map((m) => m.message).join('\n');
          this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
          this.dialogRef.close();
        } else {
          this.pedido = this.copiarPedidoBase(this.pedidoBase!, false);
          this.showForm();
          this.cdr.detectChanges();
        }
      },
      error: () => this.dialogRef.close(),
    });
  }

  cargarPlantilla(plantillaId: string, urlServer: string): DocumentoPlantillaDTO | null {
    const dp = this.templateService.getTemplate(plantillaId, urlServer);
    if (dp) {
      if (!this.pedidoBase!.llaveTabla && PlantillaHelper.isEmpty(dp.propiedades, PlantillaHelper.PERMISO_PLANTILLA_CREAR)) {
        this.snackBar.open('No tienes permisos para crear registros este tipo de documento. ' + dp.nombre, 'Cerrar', { duration: 3000 });
        this.dialogRef.close();
        return null;
      }
      if (!dp.caracteristicas) {
        this.isLoading = true;
        this.cdr.detectChanges();
        this.api.obtenerCampos(plantillaId, dp.server).subscribe({
          next: (plantilla: DocumentoPlantillaDTO) => {
            plantilla.server = dp.server;
            this.isLoading = false;
            this.cargarCamposPlantilla(plantilla);
            this.cdr.detectChanges();
          },
          error: () => { this.isLoading = false; this.dialogRef.close(); this.cdr.detectChanges(); },
        });
        return null;
      }
      return dp;
    } else {
      this.snackBar.open('No tienes permisos para ver este documento.', 'Cerrar', { duration: 3000 });
      this.dialogRef.close();
      return null;
    }
  }

  cargarCamposPlantilla(value: DocumentoPlantillaDTO): void {
    const dp = this.templateService.getTemplate(value.llaveTabla!, value.server);
    if (dp) {
      dp.caracteristicas = value.caracteristicas;
      if (!this.plantilla) {
        this.plantilla = dp;
        if (this.pedidoBase) {
          if (this.pedidoBase.llaveTabla) {
            this.consultarDocumento(this.pedidoBase.llaveTabla);
          } else {
            this.pedido = this.copiarPedidoBase(this.pedidoBase, false);
            this.showForm();
            this.cdr.detectChanges();
          }
        }
      } else {
        if (this.auxPlantillaProxima) {
          this.crearPlantilla(this.auxPlantillaProxima, this.documentToTransition);
          this.auxPlantillaProxima = undefined;
          this.documentToTransition = undefined;
        }
      }
    }
  }

  copiarPedidoBase(actual: PedidoVentaDTO, toSave: boolean): PedidoVentaDTO {
    const copyPedido = new PedidoVentaDTO();
    if (toSave) {
      copyPedido.llaveTabla = actual.llaveTabla;
      copyPedido.estadoExpediente = actual.estadoExpediente;
    }
    copyPedido.plantilla = this.plantilla!.llaveTabla;
    copyPedido.imagen = this.plantilla!.imagen;
    copyPedido.caracteristicas = [];

    if (this.plantilla!.caracteristicas) {
      for (const element of this.plantilla!.caracteristicas) {
        const uc = new PedidoVentaCaracteristicaDTO();
        uc.campo = element.llaveTabla;
        if (!toSave) uc.campoDTO = element;

        if (actual.caracteristicas && actual.caracteristicas.length !== 0) {
          let coincidenciaCampo = false;
          for (const campo of actual.caracteristicas) {
            if (campo.campoDTO == null) {
              if (campo.campo && campo.campo === element.llaveTabla) coincidenciaCampo = true;
            } else {
              if (campo.campoDTO.codigo && campo.campoDTO.codigo === element.codigo) coincidenciaCampo = true;
              else if (campo.campoDTO.llaveTabla && campo.campoDTO.llaveTabla === element.llaveTabla) coincidenciaCampo = true;
            }
            if (coincidenciaCampo) {
              uc.valorOpcion = campo.valorOpcion;
              uc.valorAuxiliar = campo.valorAuxiliar;
              uc.valorFecha = campo.valorFecha;
              uc.valorNumero = campo.valorNumero;
              uc.valorText = campo.valorText;
              if (!toSave) uc.principal = campo.principal;
              else { uc.modificado = campo.modificado; uc.llaveTabla = campo.llaveTabla; }
              uc.expedientes = campo.expedientes;
              uc.productosExclusivos = campo.productosExclusivos;
              if (campo.detalles) {
                uc.detalles = [];
                for (const dpv of campo.detalles) {
                  const newDetalle = new DetallePedidoVentaDTO();
                  Object.assign(newDetalle, {
                    cantidad: dpv.cantidad, cantidadTotal: dpv.cantidadTotal, nombre: dpv.nombre,
                    producto: dpv.producto, valorMaximo: dpv.valorMaximo, valorMinimo: dpv.valorMinimo,
                    valorSubtotal: dpv.valorSubtotal, valorTotal: dpv.valorTotal, valorUnitario: dpv.valorUnitario,
                    cantidadPromocion: dpv.cantidadPromocion, cantidadPromocionBase: dpv.cantidadPromocionBase,
                    detalleId: dpv.detalleId, plantilla: dpv.plantilla, plantillaDetalle: dpv.plantillaDetalle,
                  });
                  newDetalle.documentoDetalle = new PedidoVentaDTO();
                  newDetalle.documentoDetalle.estadoExpediente = dpv.documentoDetalle?.estadoExpediente;
                  newDetalle.documentoDetalle.caracteristicas = [];
                  if (dpv.documentoDetalle?.caracteristicas) {
                    for (const campoInterno of dpv.documentoDetalle.caracteristicas) {
                      const cpInterno = new PedidoVentaCaracteristicaDTO();
                      cpInterno.campo = campoInterno.campo;
                      if (!toSave) cpInterno.campoDTO = campoInterno.campoDTO;
                      cpInterno.valorOpcion = campoInterno.valorOpcion;
                      cpInterno.valorAuxiliar = campoInterno.valorAuxiliar;
                      cpInterno.valorFecha = campoInterno.valorFecha;
                      cpInterno.valorNumero = campoInterno.valorNumero;
                      cpInterno.valorText = campoInterno.valorText;
                      cpInterno.modificado = campoInterno.modificado;
                      cpInterno.principal = campoInterno.principal;
                      newDetalle.documentoDetalle.caracteristicas.push(cpInterno);
                    }
                  }
                  if (!toSave) {
                    newDetalle.llaveTabla = undefined!;
                    newDetalle.propiedades = dpv.propiedades;
                    newDetalle.tarifas = dpv.tarifas;
                  } else {
                    newDetalle.llaveTabla = dpv.llaveTabla;
                  }
                  uc.detalles!.push(newDetalle);
                }
              }
              break;
            }
          }
        }
        copyPedido.caracteristicas!.push(uc);
      }
    }

    if (actual.dinero) {
      copyPedido.dinero = new PedidoVentaDineroDTO();
      copyPedido.dinero.valorTotal = actual.dinero.valorTotal;
      copyPedido.dinero.saldo = actual.dinero.saldo;
    }
    return copyPedido;
  }

  showForm(): void {
    if (!this.plantilla?.caracteristicas || !this.pedido || this.dynamicControls.length !== 0) return;

    if (!this.pedido.llaveTabla) {
      if (
        !PlantillaHelper.isEmpty(this.plantilla.propiedades, PlantillaHelper.PERMISO_PLANTILLA_CREAR) &&
        PlantillaHelper.isEmpty(this.plantilla.propiedades, PlantillaHelper.PLANTILLA_OCULTAR_GUARDAR)
      ) {
        this.modificable = true;
        this.formIsModified = true;
      }
    } else {
      this.modificable = !PlantillaHelper.isEmpty(this.plantilla.propiedades, PlantillaHelper.PERMISO_PLANTILLA_MODIFICAR);
      if (this.modificable && this.pedido.estadoExpediente) {
        if (this.plantilla.estados?.length) {
          for (const estadoModificable of this.plantilla.estados) {
            if (estadoModificable.llaveTabla === this.pedido.estadoExpediente) {
              this.modificable = !PlantillaHelper.isEmpty(estadoModificable.propiedades, PlantillaHelper.MODIFICABLE);
              break;
            }
          }
        }
      }
    }
    this.instruccionCrear = PlantillaHelper.buscarValor(this.plantilla.propiedades, PlantillaHelper.PLANTILLA_INSTRUCCION_CREAR);
    if (this.instruccionCrear) this.toogleScreen();
    this.showFields();
    this.resolvePropiertiesForm();
    this.reportes = this.reportsService.getReports(this.plantilla, this.pedido);
    if (this.openQuickTransitionAfterSave) {
      this.crearPlantilla(this.openQuickTransitionAfterSave, this.pedido);
    }
  }

  showFields(): void {
    if (this.identificadorInicial && !this.pedido!.llaveTabla) {
      const consecutivoEscrito = PlantillaHelper.buscarPropiedad(this.plantilla!.propiedades, PlantillaHelper.FORM_CONSECUTIVO);
      if (consecutivoEscrito) {
        for (const element of this.pedido!.caracteristicas!) {
          if (element.campo === consecutivoEscrito.valor) {
            element.valorNumero = Number(this.identificadorInicial);
            element.valorText = this.identificadorInicial;
            break;
          }
        }
      }
    }

    this.plantilla!.caracteristicas!.forEach((_campo) => {
      const componentDynamic = getComponent(_campo);
      const componentRef = this.myForm!.createComponent(componentDynamic as any);
      const instance = componentRef.instance as IDynamicControl;
      instance.structure = _campo;
      instance.parent = this.pedido!;
      instance.urlServer = this.plantilla!.server;
      instance.form = this as unknown as { reviewFieldsVisibility(): void };
      for (const element of this.pedido!.caracteristicas!) {
        if (element.campo === _campo.llaveTabla) {
          instance.data = element;
          element.campoDTO = _campo;
          instance.formIsEnabled = this.modificable;
          instance.formIsModified.subscribe((x: boolean | null) => {
            if (x) this.formIsModified = true;
          });
          break;
        }
      }
      this.dynamicControls.push(instance);
    });

    for (const iBase of this.plantilla!.caracteristicas!) {
      const codigoDepende = PlantillaHelper.buscarValorMultipleFromManyKeys(
        iBase.propiedades,
        [PlantillaHelper.DEPENDE, PlantillaHelper.INFORMATIVE_DATA, PlantillaHelper.UPDATE_INFORMATIVE_FIELD],
      );
      if (codigoDepende && codigoDepende.length > 0) {
        let iCampoDependiente: IDynamicControl | undefined;
        for (const iField of this.dynamicControls) {
          if (iField.structure.codigo === iBase.codigo) { iCampoDependiente = iField; break; }
        }
        if (iCampoDependiente) {
          for (const codigo of codigoDepende) {
            for (const iFieldReferenciado of this.dynamicControls) {
              if (iFieldReferenciado.structure.llaveTabla === codigo.valor) {
                iFieldReferenciado.adicionarListener(iCampoDependiente);
                break;
              }
            }
          }
        }
      }
    }
    this.cdr.detectChanges();
  }

  resolvePropiertiesForm(): void {
    if (this.jwt.isAdmin()) {
      this.esRol = !PlantillaHelper.isEmpty(this.plantilla!.propiedades, PlantillaHelper.PLANTILLA_TIPO_ROL);
    }
    this.canMassive = !PlantillaHelper.isEmpty(this.plantilla!.propiedades, PlantillaHelper.PERMISO_PLANTILLA_CARGA_MASIVA);

    if (this.pedido!.llaveTabla) {
      this.hasVoucher = !PlantillaHelper.isEmpty(this.plantilla!.propiedades, PlantillaHelper.TEMPLATE_VOUCHER);
      if (!this.pedido!.estadoExpediente) {
        if (this.pedido!.estado === StatesEnum.ACTIVE) {
          const plantillaEliminar = PlantillaHelper.buscarValor(this.plantilla!.propiedades, PlantillaHelper.FORM_ANULAR);
          if (plantillaEliminar) {
            const tEliminar = this.templateService.getTemplate(plantillaEliminar, this.plantilla!.server);
            if (tEliminar && !PlantillaHelper.isEmpty(tEliminar.propiedades, PlantillaHelper.PERMISO_PLANTILLA_CREAR)) {
              const _newtransicion = new ProcesoTransicionDTO();
              _newtransicion.imagen = tEliminar.imagen;
              _newtransicion.plantilla = tEliminar.llaveTabla;
              _newtransicion.nombre = tEliminar.nombre;
              this.transiciones.push(_newtransicion);
            }
          }
        } else {
          const _templateAction = PlantillaHelper.buscarValor(this.plantilla!.propiedades, PlantillaHelper.FORM_ACTIVATE);
          if (_templateAction) {
            const _tAction = this.templateService.getTemplate(_templateAction, this.plantilla!.server);
            if (_tAction && !PlantillaHelper.isEmpty(_tAction.propiedades, PlantillaHelper.PERMISO_PLANTILLA_CREAR)) {
              const _newAction = new ProcesoTransicionDTO();
              _newAction.imagen = _tAction.imagen;
              _newAction.plantilla = _tAction.llaveTabla;
              _newAction.nombre = _tAction.nombre;
              this.transiciones.push(_newAction);
            }
          }
        }
      } else {
        this.canTransfer = !PlantillaHelper.isEmpty(this.plantilla!.propiedades, PlantillaHelper.PERMISO_PLANTILLA_TRANSFERIR);
        this.canChangeState = !PlantillaHelper.isEmpty(this.plantilla!.propiedades, PlantillaHelper.PERMISO_PLANTILLA_CAMBIAR_ESTADO);
        this.showActions();
      }
    }
  }

  getColor(): string | null {
    return this.pedido ? this.templateService.getColor(this.pedido.estadoExpediente) : null;
  }

  getColorFont(): string {
    return this.pedido ? this.templateService.getColorFont(this.pedido.estadoExpediente) : '#000000';
  }

  showActions(): void {
    let _estadollave = this.pedido!.estadoExpediente;
    if (!_estadollave) _estadollave = this.pedido!.estado;

    const baseTransitions = this.transitionsService.getTransitionsOfTemplate(this.plantilla!, _estadollave, this.pedido!, false);
    this.transiciones.push(...baseTransitions);

    const vinculoTransitions = this.transitionsService.getVinculoTransitions(this.pedido!, this.plantilla!);
    this.transiciones.push(...vinculoTransitions);
  }

  crearPlantilla(pNextTemplate: string, pDocument?: PedidoVentaDTO): void {
    if (!pNextTemplate) return;
    if (this.formIsModified) {
      this.snackBar.open('Guarda documento antes de crear una nueva accion', 'Cerrar', { duration: 3000 });
      return;
    }
    this.auxPlantillaProxima = pNextTemplate;
    this.documentToTransition = pDocument;
    const _nextTemplate = this.cargarPlantilla(pNextTemplate, this.plantilla!.server);
    if (!_nextTemplate) return;
    const _doc = new PedidoVentaDTO();
    _doc.plantilla = pNextTemplate;
    const camposPosibles: DocumentoPlantillaCaracteristicaDTO[] = [];

    if (_nextTemplate.caracteristicas && pDocument?.caracteristicas) {
      for (const campo of _nextTemplate.caracteristicas) {
        for (const campoDoc of pDocument.caracteristicas) {
          if (campo.codigo === campoDoc.campoDTO?.codigo) {
            if (!_doc.caracteristicas) _doc.caracteristicas = [];
            campoDoc.principal = undefined!;
            _doc.caracteristicas.push(campoDoc);
            break;
          }
        }
        const textoCampoPosible = this.validateIsPossibleField(campo, pDocument.plantilla!);
        if (textoCampoPosible) {
          if (textoCampoPosible === this.CAMPO_POSIBLE_MENOR_PRIORIDAD) camposPosibles.push(campo);
          else camposPosibles.unshift(campo);
        }
      }
    }

    if (camposPosibles.length !== 0) {
      const campoTransicion = camposPosibles[0];
      if (!_doc.caracteristicas) _doc.caracteristicas = [];
      for (let k = 0; k < _doc.caracteristicas.length; k++) {
        if (_doc.caracteristicas[k].campoDTO?.codigo === campoTransicion.codigo) {
          _doc.caracteristicas = _doc.caracteristicas.filter((v) => v.llaveTabla !== _doc.caracteristicas![k].llaveTabla);
          break;
        }
      }
      const campoBase = new PedidoVentaCaracteristicaDTO();
      campoBase.campoDTO = campoTransicion;
      if (pDocument?.dinero) campoBase.valorNumero = pDocument.dinero.saldo;
      if (PlantillaHelper.isEmpty(campoTransicion.propiedades, PlantillaHelper.MULTIPLE)) {
        campoBase.valorText = pDocument?.nombre ?? null;
        campoBase.valorOpcion = pDocument?.llaveTabla ?? null;
      } else {
        campoBase.expedientes = [pDocument!];
      }
      _doc.caracteristicas.push(campoBase);
    }
    _doc.server = this.plantilla!.server;
    this.utilsService.modalWithParams(_doc, true).then((res) => {
      if (res && this.dialogRef) {
        this.dialogRef.close();
        if (!this.close2Save) {
          if ((res as any)?.data?.messages) this.pedido!.messages = (res as any).data.messages;
          else this.pedido!.messages = null;
          this.utilsService.modalWithParams(this.pedido!);
        }
      }
    });
  }

  private validateIsPossibleField(campo: DocumentoPlantillaCaracteristicaDTO, plantilla: string): string | null {
    if (!campo || campo.formato !== DocumentoPlantillaCaracteristicaEnum.PROCESO) return null;
    const propAuxiliarTemplates = PlantillaHelper.buscarValorMultiple(campo.propiedades, PlantillaHelper.PLANTILLA_AUXILIAR);
    if (!propAuxiliarTemplates || propAuxiliarTemplates.length === 0) return this.CAMPO_POSIBLE_MENOR_PRIORIDAD;
    for (const param of propAuxiliarTemplates) {
      if (param.valor === plantilla) return param.valor;
    }
    return null;
  }

  showMassive(): void {
    if (this.canMassive) {
      this.actionsService.showMassive(this.plantilla!.llaveTabla, this.plantilla!.server, this.dialogRef);
    }
  }

  showTransfer(): void {
    if (this.canTransfer) {
      this.actionsService.showTransfer(this.pedido!, this.plantilla!.llaveTabla, this.plantilla!.server, this.dialogRef);
    }
  }

  showTrace(): void {
    this.actionsService.showTrace(this.pedido!, this.plantilla!.llaveTabla, this.plantilla!.server);
  }

  showChangeState(): void {
    if (this.canChangeState) {
      this.isChangeState = !this.isChangeState;
      if (this.isChangeState && !this.changeStateForm) {
        this.changeStateEstadoFinal = new FormControl('', Validators.required);
        this.changeStateMotivo = new FormControl('', Validators.required);
        this.changeStateForm = new FormGroup({
          estadoFinal: this.changeStateEstadoFinal,
          motivo: this.changeStateMotivo,
        });
      }
    }
  }

  autoCompleteDisplayChangeState(item: any): string {
    return item?.nombre ?? '';
  }

  changeState(): void {
    if (!this.canChangeState || !this.changeStateForm) return;
    const formData = this.changeStateForm.value;
    if (!formData.estadoFinal?.llaveTabla) {
      this.snackBar.open('Selecciona el nuevo estado', 'Cerrar', { duration: 2000 });
      return;
    }
    const ajuste = new PedidoVentaAjusteDTO();
    ajuste.documento = this.pedido!.llaveTabla;
    ajuste.estadoFinal = formData.estadoFinal.llaveTabla;
    ajuste.motivo = formData.motivo;
    this.changeStateIsLoading = true;
    this.cdr.detectChanges();
    this.api.ajustarEstado(ajuste, this.plantilla!.server).subscribe({
      next: () => { this.dialogRef.close(this.pedido); this.changeStateIsLoading = false; },
      error: () => { this.changeStateIsLoading = false; this.cdr.detectChanges(); },
    });
  }

  sendWhatsApp(): void {
    this.actionsService.sendWhatsApp(this.plantilla!.llaveTabla, this.pedidoBase!);
  }

  copyUrl(): void {
    this.actionsService.copyUrl(this.plantilla!.llaveTabla, this.pedidoBase!);
  }

  copyName(): void {
    this.actionsService.copyName(this.pedido!);
  }

  toogleScreen(): void {
    this.fullScreen = !this.fullScreen;
    this.styleSizePop = this.fullScreen ? 'width: 98vw;' : '';
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.dialogRef.close(false);
    else if (event.key === 'F9') this.submit();
  }

  abrirUsuario(pUsuario: string): void {
    this.api.searchUserByRol(pUsuario).subscribe((contact: any) => {
      this.utilsService.modalUser(contact.llaveTabla);
    });
  }

  flex(): void {
    this.utilsService.modalFlex(this.plantilla!.llaveTabla);
  }

  duplicate(): void {
    this.actionsService.duplicate(this.pedido!, this.plantilla!.llaveTabla, this.plantilla!.server);
  }

  reloadScreen(): void {
    this.actionsService.reloadScreen(this.pedido!, this.dialogRef);
  }

  showReport(reporte: ReporteBaseDTO): void {
    this.actionsService.showReport(reporte, this.pedido!);
  }

  reviewFieldsVisibility(): void {
    let sectionIsInvisible = false;
    for (const element of this.dynamicControls) {
      if (element.structure.formato === DocumentoPlantillaCaracteristicaEnum.SECCION) {
        sectionIsInvisible = element.isInvisible || element.isSectionInvisible;
      } else {
        element.isSectionInvisible = sectionIsInvisible;
      }
    }
  }
}
