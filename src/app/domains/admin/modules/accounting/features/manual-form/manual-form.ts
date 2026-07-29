import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { AccountingService } from '../../services/accounting.service';
import { AccountDTO, ManualAccountAuxiliarDTO, ManualAccountDTO, ManualDTO, VoucherLine } from '../../domain/accounting.domain';
import { NotificationCenterService } from '@/app/shared/services/notification-center.service';
import { TemplateService } from '@/app/domains/admin/modules/neuron/services/template.service';
import { ReporteBaseDTO } from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { LocalConstants, LocalStoreService } from '@/app/shared/services/local-store.service';
import { debounceTime, map, pairwise, startWith, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-manual-form',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex flex-col max-w-240 md:min-w-160 max-h-screen">
      <div class="flex flex-0 items-center justify-between h-16 pr-3 sm:pr-5 pl-6 sm:pl-8 bg-primary text-on-primary">
        <div class="text-lg font-medium">Comprobante contable Manual {{ codigoComprobante() }}</div>
        @if (reportes().length > 0) {
          <button mat-icon-button (click)="printReport()" [tabIndex]="-1">
            <mat-icon class="text-current" svgIcon="heroicons_outline:printer"></mat-icon>
          </button>
        }
        @if (data?.key) {
          <button mat-icon-button (click)="deleteVouchers(data)" [tabIndex]="-1">
            <mat-icon class="text-current" svgIcon="heroicons_outline:trash"></mat-icon>
          </button>
        }
        <button mat-icon-button (click)="matDialogRef.close()" [tabIndex]="-1">
          <mat-icon class="text-current" svgIcon="heroicons_outline:x-circle"></mat-icon>
        </button>
      </div>

      @if (!loading()) {
        <form class="p-6 sm:p-8" [formGroup]="form">
          <div [formGroupName]="'header'" class="w-full">
            <div class="sm:flex sm:justify-between w-full sm:gap-2">
              <mat-form-field>
                <mat-label>Catalogo</mat-label>
                <input matInput disabled [value]="accountingService.currentCatalog?.name" />
              </mat-form-field>
              <mat-form-field>
                <mat-label>Tipo</mat-label>
                <input matInput disabled [value]="accountingService.currentCatalog?.name" />
              </mat-form-field>
              <mat-form-field>
                <mat-label>Fecha</mat-label>
                <input matInput [matDatepicker]="pickerFrom" formControlName="factDate" required />
                <mat-datepicker-toggle matSuffix [for]="pickerFrom"></mat-datepicker-toggle>
                <mat-datepicker #pickerFrom></mat-datepicker>
              </mat-form-field>
              <mat-form-field>
                <mat-label>Hora</mat-label>
                <input matInput type="time" required [formControl]="timeFrom" />
              </mat-form-field>
            </div>
            <mat-form-field class="w-full">
              <mat-label>Concepto</mat-label>
              <textarea matInput formControlName="concept"></textarea>
            </mat-form-field>
          </div>

          <div class="w-full flex text-primary text-xs uppercase font-bold px-2">
            <h2 class="w-full">Asientos contables</h2>
            <div class="py-2 flex">
              <label>
                <input class="p-0.5 mx-1" type="checkbox" [(ngModel)]="referencesActive" [ngModelOptions]="{standalone: true}" />
                Auxiliares
              </label>
            </div>
          </div>
          <div class="w-full p-1 max-h-[35vh] overflow-scroll">
            <div formArrayName="records">
              @for (r of recordsArray.controls; track r; let i = $index) {
                <div [formGroupName]="i">
                  <div formGroupName="line">
                    <div class="w-full sm:flex gap-1">
                      <div class="w-full sm:w-1/2">
                        <mat-form-field class="w-full">
                          <mat-label>Cuenta {{ i + 1 }}</mat-label>
                          <input matInput formControlName="accountDTO" [matAutocomplete]="auto" />
                        </mat-form-field>
                      </div>
                      <div class="flex justify-between w-full sm:w-1/2 gap-1">
                        <mat-form-field>
                          <mat-label>Débito</mat-label>
                          <input matInput formControlName="positive" placeholder="Debito" />
                        </mat-form-field>
                        <mat-form-field>
                          <mat-label>Crédito</mat-label>
                          <input matInput formControlName="negative" placeholder="Credito" />
                        </mat-form-field>
                      </div>
                    </div>
                    <div class="w-full sm:w-1/2" [style.display]="referencesActive ? 'block' : 'none'">
                      <mat-form-field class="w-full">
                        <mat-label>Notas</mat-label>
                        <textarea matInput formControlName="note"></textarea>
                      </mat-form-field>
                    </div>
                  </div>
                  <div formArrayName="references" class="w-full gap-1 justify-end" [style.display]="referencesActive ? 'block' : 'none'">
                    @for (f of auxiliares(i).controls; track f; let j = $index) {
                      <div [formGroupName]="j" class="w-full sm:w-1/2">
                        <div class="flex justify-between w-full gap-1">
                          <mat-form-field class="w-full">
                            <mat-label>{{ f.get('auxiliarType')?.value }} CODIGO</mat-label>
                            <input matInput formControlName="auxiliarCode" />
                          </mat-form-field>
                          <mat-form-field class="w-full">
                            <mat-label>{{ f.get('auxiliarType')?.value }} NOMBRE</mat-label>
                            <input matInput formControlName="auxiliarName" />
                          </mat-form-field>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
          <div class="w-full my-3 border-b"></div>
          <div class="flex">
            <div class="text-2xl font-medium tracking-tight text-secondary">TOTAL</div>
            <div class="w-full text-right text-2xl font-medium">{{ debitValue | currency }}</div>
          </div>
          @if (differenceValue !== 0) {
            <div class="flex justify-between">
              <div class="font-medium tracking-tight text-secondary">Debitos - creditos</div>
              <div class="text-right font-medium">{{ debitValue | currency }}</div> -
              <div class="text-right font-medium">{{ creditValue | currency }}</div>
              <div class="text-right font-medium">{{ differenceValue | currency }}</div>
            </div>
          }
          @if (botonAccion()) {
            <button class="order-first sm:order-last w-full" mat-flat-button color="primary" (click)="send()">{{ botonAccion() }}</button>
          }
        </form>
      } @else {
        <div class="w-full flex justify-center p-8">
          <mat-spinner></mat-spinner>
        </div>
      }

      <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayFn">
        @for (f of filteredOptions(); track f.key) {
          <mat-option [value]="f">
            <span>{{ f.code }}</span> | <small>{{ f.name }}</small>
          </mat-option>
        }
      </mat-autocomplete>
    </div>
  `,
})
export default class ManualFormComponent implements OnInit {
  private readonly _formBuilder = inject(UntypedFormBuilder);
  readonly accountingService = inject(AccountingService);
  private readonly ls = inject(LocalStoreService);
  private readonly templateService = inject(TemplateService);
  private readonly notificationCenter = inject(NotificationCenterService);
  readonly matDialogRef = inject<MatDialogRef<ManualFormComponent>>(MatDialogRef);
  readonly data = inject<any>(MAT_DIALOG_DATA);

  form!: UntypedFormGroup;
  timeFrom = new FormControl('00:00');
  readonly loading = signal(false);
  readonly botonAccion = signal('Guardar');
  readonly codigoComprobante = signal('');
  readonly reportes = signal<ReporteBaseDTO[]>([]);
  readonly filteredOptions = signal<AccountDTO[]>([]);

  debitValue = 0;
  creditValue = 0;
  differenceValue = 0;
  referencesActive = false;

  private key = '';
  private subscription: Subscription | null = null;

  ngOnInit(): void {
    this.form = this._formBuilder.group({
      header: this._formBuilder.group({
        catalog: this.accountingService.currentCatalog?.key || '',
        concept: ['', Validators.required],
        type: ['', Validators.required],
        factDate: [new Date(), Validators.required],
        value: 0,
      }),
      records: this._formBuilder.array([], Validators.required),
    });

    this.getAccounts();

    if (this.data) {
      if (this.data.catalogId) {
        this.accountingService.getCatalog(this.data.catalogId).subscribe((catalog) => {
          this.getReports();
        });
        this.botonAccion.set('Actualizar');
      } else {
        this.botonAccion.set('Guardar');
      }
      this.key = this.data.key;
      if (this.key) {
        this.loadVoucher();
      } else {
        this.recordsArray.push(this.createRecord(new VoucherLine()));
      }
    } else {
      this.recordsArray.push(this.createRecord(new VoucherLine()));
    }

    this.timeFrom.valueChanges.subscribe(() => {
      const dateFact: Date = this.form.get('header')?.get('factDate')?.value;
      if (dateFact && this.timeFrom.value) {
        dateFact.setHours(+this.timeFrom.value.substring(0, 2));
        dateFact.setMinutes(+this.timeFrom.value.substring(3, 5));
        dateFact.setSeconds(0);
        this.form.get('header')?.get('factDate')?.setValue(dateFact);
      }
    });
  }

  private loadVoucher(): void {
    this.loading.set(true);
    this.accountingService.getVoucher(this.key).subscribe((x) => {
      if (!x) return;
      this.form = this._formBuilder.group({
        header: this._formBuilder.group(x.header),
        records: this._formBuilder.array([], Validators.required),
      });
      this.timeFrom.setValue(x.header.factDate?.getHours() + ':' + x.header.factDate?.getMinutes());
      x.records.forEach((i) => {
        i.line.accountDTO = new AccountDTO();
        i.line.accountDTO.name = i.line.accountName;
        i.line.accountDTO.code = i.line.accountCode;
        i.line.accountDTO.key = i.line.account;
        this.creditValue += i.line.negative;
        this.debitValue += i.line.positive;
        this.recordsArray.push(this.createRecord(i));
      });
      this.codigoComprobante.set(x.header.code);
      this.differenceValue = this.debitValue - this.creditValue;
      if (this.data.catalogId) this.recordsArray.push(this.createRecord(new VoucherLine()));
      this.loading.set(false);
    });
  }

  getAccounts(): void {
    if (this.accountingService.currentCatalog && !this.accountingService.currentCatalog.accounts) {
      this.loading.set(true);
      this.accountingService.getAccounts(this.accountingService.currentCatalog.key).subscribe({
        next: (items) => {
          if (this.accountingService.currentCatalog) this.accountingService.currentCatalog.accounts = items;
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  displayFn(acc: AccountDTO): string {
    if (!acc || !acc.key) return '';
    return acc.code + ' | ' + acc.name;
  }

  send(): void {
    if (this.creditValue !== this.debitValue) {
      this.notificationCenter.info('', 'El valor crédito (' + this.creditValue + ') no es igual al valor debito (' + this.debitValue + ')');
      return;
    }
    if (this.creditValue === 0) {
      this.notificationCenter.info('Completa el comprobante', 'Debes colocar valores en los asientos contables');
      return;
    }
    if (!this.form.get('header')?.get('concept')?.value) {
      this.notificationCenter.info('Completa el comprobante', 'Que no se te olvide el concepto');
      return;
    }
    if (!this.form.get('header')?.get('factDate')?.value) {
      this.notificationCenter.info('Completa el comprobante', 'Que no se te olvide la fecha');
      return;
    }

    this.loading.set(true);
    if (!this.key) {
      this.create();
    } else {
      this.update();
    }
  }

  deleteVouchers(voucher: ManualDTO): void {
    Swal.fire({
      title: '¿Desea eliminar el comprobante?',
      text: voucher.code,
      icon: 'warning',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Si, eliminar',
      showCancelButton: true,
      cancelButtonColor: '#d33',
      cancelButtonText: 'No, volver',
    }).then((resultado: any) => {
      if (resultado.isConfirmed) {
        this.accountingService.deleteVoucher(voucher.key).subscribe({
          complete: () => this.matDialogRef.close(),
        });
      }
    });
  }

  private create(): void {
    this.accountingService.createManual(this.form.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.matDialogRef.close();
      },
      error: () => this.loading.set(false),
    });
  }

  private update(): void {
    this.accountingService.updateManual(this.form.value).subscribe({
      next: () => this.matDialogRef.close(),
      error: () => this.loading.set(false),
    });
  }

  createRecord(manualaccount: VoucherLine): UntypedFormGroup {
    if (!manualaccount.line) manualaccount.line = new ManualAccountDTO();
    if (!manualaccount.references) manualaccount.references = [];
    if (!manualaccount.line.accountDTO) manualaccount.line.accountDTO = new AccountDTO();
    if (!manualaccount.line.positive) manualaccount.line.positive = 0;
    if (!manualaccount.line.negative) manualaccount.line.negative = 0;
    if (!manualaccount.line.account) manualaccount.line.account = '';
    if (!manualaccount.line.accountName) manualaccount.line.accountName = '';
    if (!manualaccount.line.note) manualaccount.line.note = '';

    const group = this._formBuilder.group({
      line: this._formBuilder.group(manualaccount.line),
      references: this.createreferenceArray(manualaccount.references),
    });

    if (manualaccount.line.positive && group.get('line')?.get('negative')?.enabled) {
      group.get('line')?.get('negative')?.disable();
    }
    if (manualaccount.line.negative && group.get('line')?.get('positive')?.enabled) {
      group.get('line')?.get('positive')?.disable();
    }

    this.subscription?.unsubscribe();

    group.get('line')?.get('accountDTO')?.valueChanges.subscribe((value: any) => {
      if (!value || !value.key) {
        group.get('line')?.get('accountName')?.setValue('');
        group.get('line')?.get('account')?.setValue('');
        return;
      }
      const account = this.accountingService.currentCatalog?.accounts?.find((item) => item.key === value.key);
      if (!account) {
        group.get('line')?.get('accountName')?.setValue('');
        group.get('line')?.get('account')?.setValue('');
        if (!value.key && value.indexOf?.('|') !== -1) group.get('line')?.get('accountDTO')?.setValue('');
        return;
      }
      group.get('line')?.get('account')?.setValue(account.key);
      group.get('line')?.get('accountName')?.setValue(account.code + ' | ' + account.name);
    });

    group.get('line')?.get('positive')?.valueChanges
      .pipe(startWith(manualaccount.line.positive), pairwise())
      .subscribe(([prevValue, selectedValue]) => {
        selectedValue *= 1;
        this.debitValue -= prevValue;
        this.debitValue += selectedValue;
        this.form.get('header')?.get('value')?.setValue(this.debitValue);
        this.differenceValue = this.debitValue - this.creditValue;
        if (selectedValue !== 0) {
          group.get('line')?.get('negative')?.disable({ emitEvent: false });
        } else {
          if (!group.get('line')?.get('negative')?.enabled) {
            group.get('line')?.get('negative')?.enable({ emitEvent: false });
          }
        }
      });

    group.get('line')?.get('negative')?.valueChanges
      .pipe(startWith(manualaccount.line.negative), pairwise())
      .subscribe(([prevValue, selectedValue]) => {
        selectedValue *= 1;
        this.creditValue -= prevValue;
        this.creditValue += selectedValue;
        this.differenceValue = this.debitValue - this.creditValue;
        if (selectedValue !== 0) {
          group.get('line')?.get('positive')?.disable({ emitEvent: false });
        } else {
          if (!group.get('line')?.get('positive')?.enabled) {
            group.get('line')?.get('positive')?.enable({ emitEvent: false });
          }
        }
      });

    if (this.differenceValue !== 0) {
      if (this.differenceValue > 0) {
        group.get('line')?.get('negative')?.setValue(this.differenceValue);
      } else {
        group.get('line')?.get('positive')?.setValue(this.differenceValue * -1);
      }
    }

    this.subscription = group.valueChanges.pipe(debounceTime(1000)).subscribe((item: any) => {
      if (item && item.line && item.line.account && (item.line.positive !== 0 || item.line.negative !== 0)) {
        this.recordsArray.push(this.createRecord(new VoucherLine()));
      }
    });

    group.get('line')?.get('accountDTO')?.valueChanges
      .pipe(startWith(''))
      .subscribe((value) => {
        this.filteredOptions.set(this.filterAccount(value));
      });

    return group;
  }

  filterAccount(value: any): AccountDTO[] {
    const accounts = this.accountingService.currentCatalog?.accounts;
    if (!accounts) return [];
    if (!value) return accounts.filter((acc) => acc.type === 'O');
    if (value.key) return [];
    const filterValue = value.toLowerCase();
    return accounts.filter(
      (acc) => acc.type === 'O' && (acc.name.toLowerCase().includes(filterValue) || acc.code.toLowerCase().includes(filterValue)),
    );
  }

  get recordsArray(): FormArray {
    return this.form.get('records') as FormArray;
  }

  auxiliares(lineIndex: number): FormArray {
    return this.recordsArray.at(lineIndex).get('references') as FormArray;
  }

  createreferenceArray(pItems: ManualAccountAuxiliarDTO[]): FormArray {
    const resultList = this._formBuilder.array([], Validators.required);
    for (let i = 0; i < pItems.length; i++) {
      resultList.push(this._formBuilder.group(pItems[i]));
    }
    return resultList;
  }

  getReports(): void {
    const catalog = this.accountingService.currentCatalog;
    if (!catalog) return;
    const _template = this.templateService.getTemplate(catalog.template, null);
    if (!_template || !_template.reportes || _template.reportes.length === 0) return;
    const reports: ReporteBaseDTO[] = [];
    for (let i = 0; i < _template.reportes.length; i++) {
      reports.push(_template.reportes[i]);
    }
    this.reportes.set(reports);
  }

  printReport(): void {
    for (let r = 0; r < this.reportes().length; r++) {
      this.showReport(this.reportes()[r]);
    }
  }

  showReport(reporte: ReporteBaseDTO): void {
    if (!reporte) return;
    let stringURL = reporte.servidorUrl;
    if (!stringURL) stringURL = this.ls.getItem(LocalConstants.URL_CONF) as string;
    stringURL += '/reporte?nombre=' + reporte.llaveTabla + '&P_KEY=' + this.key + '&P_TOKEN=' + this.templateService.getTokenConnection(stringURL);
    if (reporte.variables) stringURL += '&' + reporte.variables;
    window.open(stringURL, '_blank');
  }
}
