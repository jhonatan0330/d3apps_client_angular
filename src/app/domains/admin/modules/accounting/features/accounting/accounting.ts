import { Component, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from '@angular/material/tree';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';
import { AccountDTO, CatalogDTO, ManualDTO, ResultMapDTO } from '../../domain/accounting.domain';
import { AccountingService } from '../../services/accounting.service';
import { UtilsService } from '@/app/domains/admin/modules/neuron/services/utils.service';
import { LoginService } from '@/app/domains/auth/services/login.service';
import { Router } from '@angular/router';

interface AccountNode {
  account: AccountDTO;
  children?: AccountNode[];
}

interface AccountFlatNode {
  expandable: boolean;
  name: string;
  code: string;
  status: string;
  level: number;
  key: string;
}

@Component({
  selector: 'app-accounting',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatTableModule,
    MatTreeModule,
    MatProgressBarModule,
    MatSortModule,
  ],
  template: `
    <div class="absolute inset-0 flex flex-col min-w-0 overflow-hidden">
      <mat-drawer-container class="flex-auto h-full bg-card dark:bg-transparent">
        <mat-drawer class="w-72 dark:bg-gray-900" [mode]="drawerMode()" [opened]="true" [position]="'start'"
          [disableClose]="!accountingService.currentCatalog" #drawer>
          <div class="flex-auto">
            <div class="py-8 px-6 border-b">
              <div class="text-4xl font-extrabold tracking-tight leading-none pb-4">Catalogos</div>
              <div class="flex-auto">
                <mat-form-field class="w-full" subscriptSizing="dynamic">
                  <mat-icon class="icon-size-5" matPrefix>search</mat-icon>
                  <input matInput [formControl]="searchInputControl">
                </mat-form-field>
              </div>
            </div>
            <div class="relative">
              @if (isLoadingCatalog()) {
                <mat-progress-bar mode="indeterminate"></mat-progress-bar>
              }
              @if (catalogs(); as catalogs) {
                @if (catalogs.length > 0) {
                  @for (catalog of catalogs; track catalog.llaveTabla) {
                    <a class="z-20 flex items-center justify-between px-6 py-4 md:px-8 cursor-pointer border-b"
                      (click)="selectCatalog(catalog)">
                      <div class="min-w-0 ml-4">
                        <div class="font-medium leading-5 truncate">{{ catalog.name }}</div>
                        <div class="leading-5 truncate text-secondary">{{ catalog.code }}</div>
                      </div>
                    </a>
                  }
                } @else {
                  <div class="p-8 sm:p-16 border-t text-4xl font-semibold tracking-tight text-center">
                    No hay catalogos creados!
                  </div>
                }
              }
            </div>
          </div>
        </mat-drawer>

        <mat-drawer-content class="h-full">
          @if (accountingService.currentCatalog) {
            <div class="flex flex-col flex-auto w-full bg-gray-100 dark:bg-transparent p-4 md:p-6 gap-2">
              <div class="flex w-full">
                <button mat-icon-button (click)="toggleDrawer()">
                  <mat-icon>menu</mat-icon>
                </button>
                <div class="w-full text-center">
                  <h2 class="text-3xl font-semibold tracking-tight leading-8">{{ accountingService.currentCatalog.name }}</h2>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full min-w-0">
                @for (item of balance(); track item.key) {
                  <div class="sm:col-span-1 flex flex-col flex-auto p-6 bg-card shadow rounded-2xl overflow-hidden">
                    <div class="flex items-start justify-between">
                      <div class="flex flex-col">
                        <div class="text-lg font-medium tracking-tight leading-6 truncate">{{ item.accountName | uppercase }}</div>
                        <div class="text-red-600 font-medium text-sm">{{ item.timeFrameName }}</div>
                      </div>
                      <div class="ml-2 -mt-2 -mr-3">
                        <button class="h-6 min-h-6 px-2 rounded-full bg-hover" mat-icon-button [matMenuTriggerFor]="monthlyExpensesMenu">
                          <mat-icon>more_vert</mat-icon>
                        </button>
                        <mat-menu #monthlyExpensesMenu="matMenu">
                          <button mat-menu-item>Minutos</button>
                          <button mat-menu-item>Horas</button>
                          <button mat-menu-item>Dias</button>
                          <button mat-menu-item>Meses</button>
                          <button mat-menu-item>Años</button>
                        </mat-menu>
                      </div>
                    </div>
                    <div class="flex items-center pt-1">
                      <div class="flex flex-col">
                        <div class="text-3xl font-semibold tracking-tight leading-tight">{{ item.value | number }}</div>
                        <div class="flex items-center">
                          <mat-icon class="pr-1 icon-size-5 text-red-500">trending_flat</mat-icon>
                          <div class="font-medium text-sm text-secondary leading-none whitespace-nowrap">
                            <span class="text-red-500">0%</span> proyectado
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <div class="flex flex-col flex-auto bg-card shadow rounded-2xl overflow-hidden">
                <div class="p-6 flex justify-between w-full">
                  <div>
                    <div class="text-lg font-medium tracking-tight leading-6 truncate">Comprobantes contables recientes</div>
                    <div class="text-secondary font-medium">1 pending, 4 completed</div>
                  </div>
                  <div>
                    <button [matMenuTriggerFor]="actionsVoucher" mat-icon-button>
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #actionsVoucher="matMenu">
                      <button mat-menu-item (click)="getBalance()">
                        <mat-icon class="icon-size-5">refresh</mat-icon>
                        <span>Actualizar balance</span>
                      </button>
                      <button mat-menu-item (click)="openManualForm()">
                        <mat-icon class="icon-size-5">add</mat-icon>
                        <span>Comprobante Manual</span>
                      </button>
                    </mat-menu>
                  </div>
                </div>
                <div class="overflow-x-auto mx-6">
                  <table class="w-full bg-transparent" mat-table matSort [dataSource]="recentTransactionsDataSource">
                    <ng-container matColumnDef="transactionId">
                      <th mat-header-cell mat-sort-header *matHeaderCellDef>Comprobante ID</th>
                      <td mat-cell *matCellDef="let transaction">
                        <span class="pr-6 font-medium text-sm text-secondary whitespace-nowrap">{{ transaction.code }}</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="date">
                      <th mat-header-cell mat-sort-header *matHeaderCellDef>Fecha</th>
                      <td mat-cell *matCellDef="let transaction">
                        <span class="pr-6 whitespace-nowrap">{{ transaction.factDate | date:'MMM dd, y' }}</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="name">
                      <th mat-header-cell mat-sort-header *matHeaderCellDef>Nota</th>
                      <td mat-cell *matCellDef="let transaction">
                        <span class="pr-6 whitespace-nowrap">{{ transaction.concept }}</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="amount">
                      <th mat-header-cell mat-sort-header *matHeaderCellDef>Valor</th>
                      <td mat-cell *matCellDef="let transaction">
                        <span class="pr-6 font-medium whitespace-nowrap">{{ transaction.value | number }}</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="status">
                      <th mat-header-cell mat-sort-header *matHeaderCellDef>Estado</th>
                      <td mat-cell *matCellDef="let transaction">
                        <span class="inline-flex items-center font-bold text-xs px-2.5 py-0.5 rounded-full tracking-wide uppercase"
                          [class]="transaction.state === 'A' ? 'bg-green-200 text-green-800 dark:bg-green-600 dark:text-green-50' : 'bg-red-200 text-red-800 dark:bg-red-600 dark:text-red-50'">
                          <span class="leading-relaxed whitespace-nowrap">{{ transaction.state === 'A' ? 'Procesado' : 'Pendiente' }}</span>
                        </span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Acciones</th>
                      <td mat-cell *matCellDef="let row">
                        <div>
                          <button [matMenuTriggerFor]="actionsTable" mat-icon-button>
                            <mat-icon>more_vert</mat-icon>
                          </button>
                          <mat-menu #actionsTable="matMenu">
                            <button mat-menu-item (click)="editVouchers(row)">
                              <mat-icon class="icon-size-5">edit</mat-icon>
                              <span>Actualizar Comprobante</span>
                            </button>
                            <button mat-menu-item (click)="deleteVouchers(row)">
                              <mat-icon class="icon-size-5">delete</mat-icon>
                              <span>Eliminar Comprobante</span>
                            </button>
                          </mat-menu>
                        </div>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="recentOrdersTableFooter">
                      <td class="py-6 px-0 border-0" mat-footer-cell *matFooterCellDef colspan="6">
                        <button mat-stroked-button (click)="getVouchers()">Ver mas comprobantes</button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="recentTransactionsTableColumns"></tr>
                    <tr class="order-row h-16" mat-row *matRowDef="let row; columns: recentTransactionsTableColumns;"></tr>
                    <tr class="h-16 border-0" mat-footer-row *matFooterRowDef="['recentOrdersTableFooter']"></tr>
                  </table>
                </div>
              </div>

              <div class="bg-card shadow rounded-2xl overflow-hidden">
                <div class="p-6 flex justify-between w-full">
                  <div class="text-lg font-medium tracking-tight leading-6 truncate">Cuentas del catalogo</div>
                  <div>
                    <button [matMenuTriggerFor]="actionsBalance" mat-icon-button>
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #actionsBalance="matMenu">
                      <button mat-menu-item (click)="getAccounts()">
                        <mat-icon class="icon-size-5">refresh</mat-icon>
                        <span>Actualizar cuentas</span>
                      </button>
                    </mat-menu>
                  </div>
                </div>
                <div class="px-6 py-2 overflow-x-auto">
                  @if (isLoadingAccount()) {
                    <mat-progress-bar mode="indeterminate" class="w-full"></mat-progress-bar>
                  }
                  <table class="w-full bg-transparent" mat-table matSort [dataSource]="dataSource">
                    <ng-container matColumnDef="code">
                      <th mat-header-cell mat-sort-header *matHeaderCellDef>Codigo</th>
                      <td mat-cell *matCellDef="let row">
                        <div class="flex">
                          <button mat-icon-button [style.visibility]="!row.expandable ? 'hidden' : ''"
                            (click)="treeControl.toggle(row)">
                            <mat-icon class="mat-icon-rtl-mirror">{{ treeControl.isExpanded(row) ? 'expand_more' : 'chevron_right' }}</mat-icon>
                          </button>
                          <span class="pt-2 text-sm">{{ row.code }}</span>
                        </div>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="name">
                      <th mat-header-cell mat-sort-header *matHeaderCellDef>Nombre</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="whitespace-nowrap">{{ row.name }}</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="status">
                      <th mat-header-cell mat-sort-header *matHeaderCellDef>Status</th>
                      <td mat-cell *matCellDef="let transaction">
                        <span class="inline-flex items-center font-bold text-xs px-2.5 py-0.5 rounded-full tracking-wide uppercase"
                          [class]="transaction.status === 'OPERATING' ? 'bg-green-200 text-green-800 dark:bg-green-600 dark:text-green-50' : 'bg-red-200 text-red-800 dark:bg-red-600 dark:text-red-50'">
                          <span class="leading-relaxed whitespace-nowrap">{{ transaction.status }}</span>
                        </span>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                    <tr class="h-16" mat-row *matRowDef="let row; columns: displayedColumns;"
                      [class.bg-slate-100]="treeControl.isExpanded(row)"></tr>
                  </table>
                </div>
              </div>
            </div>
          } @else {
            <div class="flex flex-col flex-auto overflow-y-auto lg:overflow-hidden bg-card dark:bg-default h-full">
              <div class="flex flex-col flex-auto items-center justify-center bg-gray-100 dark:bg-transparent">
                <mat-icon class="icon-size-24" svgIcon="heroicons_outline:chat-bubble-oval-left-ellipsis"></mat-icon>
                <div class="mt-4 text-2xl font-semibold tracking-tight text-secondary">Selecciona un catalogo</div>
              </div>
            </div>
          }
        </mat-drawer-content>
      </mat-drawer-container>
    </div>
  `,
})
export default class AccountingComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer!: MatDrawer;

  private readonly _utilsService = inject(UtilsService);
  private readonly _jwt = inject(LoginService);
  private readonly _router = inject(Router);
  private readonly _breakpointObserver = inject(BreakpointObserver);
  readonly accountingService = inject(AccountingService);

  private readonly _unsubscribeAll = new Subject<void>();

  readonly drawerMode = signal<'over' | 'side'>('over');
  readonly catalogs = signal<CatalogDTO[]>([]);
  readonly balance = signal<ResultMapDTO[]>([]);
  readonly isLoadingCatalog = signal(false);
  readonly isLoadingAccount = signal(false);
  readonly isLoadingBalance = signal(false);
  readonly isLoadingVoucher = signal(false);

  searchInputControl = new FormControl();

  recentTransactionsDataSource = new MatTableDataSource<ManualDTO>();
  recentTransactionsTableColumns = ['transactionId', 'date', 'name', 'amount', 'status', 'actions'];

  displayedColumns = ['code', 'name', 'status'];

  treeControl = new FlatTreeControl<AccountFlatNode>(
    (node: AccountFlatNode) => node.level,
    (node: AccountFlatNode) => node.expandable,
  );

  private _transformer = (node: AccountNode, level: number): AccountFlatNode => ({
    expandable: !!node.children && node.children.length > 0,
    key: node.account.key,
    name: node.account.name,
    code: node.account.code,
    status: node.account.status,
    level,
  });

  treeFlattener = new MatTreeFlattener(this._transformer, (node: AccountFlatNode) => node.level, (node: AccountFlatNode) => node.expandable, (node: AccountNode) => node.children);

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  ngOnInit(): void {
    if (!this._jwt.validateAccessModule('account')) {
      this._router.navigate(['/main']);
      return;
    }

    this._breakpointObserver
      .observe([Breakpoints.Medium, Breakpoints.Large, Breakpoints.XLarge])
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((state) => {
        this.drawerMode.set(state.matches ? 'side' : 'over');
      });

    this.getCatalogs();
    this.accountingService.currentCatalog = null;
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  toggleDrawer(): void {
    this.drawer.toggle();
  }

  getVouchers(): void {
    if (!this.accountingService.currentCatalog) return;
    this.isLoadingVoucher.set(true);
    this.accountingService.getVouchers(this.accountingService.currentCatalog.key).subscribe({
      next: (data) => {
        this.recentTransactionsDataSource.data = data;
        this.isLoadingVoucher.set(false);
      },
      error: () => this.isLoadingVoucher.set(false),
    });
  }

  editVouchers(voucher: ManualDTO): void {
    this._utilsService.modalVoucher(voucher.key, voucher.catalog).then(() => this.getAccounts());
  }

  deleteVouchers(voucher: ManualDTO): void {
    const confirmed = confirm('¿Desea eliminar el comprobante? ' + voucher.code);
    if (confirmed) {
      this.accountingService.deleteVoucher(voucher.key).subscribe({
        complete: () => this.getVouchers(),
      });
    }
  }

  getCatalogs(): void {
    this.isLoadingCatalog.set(true);
    this.accountingService.getCatalogs().subscribe({
      next: (data) => {
        this.catalogs.set(data);
        this.isLoadingCatalog.set(false);
        if (data.length === 1) this.selectCatalog(data[0]);
      },
      error: () => this.isLoadingCatalog.set(false),
    });
  }

  selectCatalog(catalog: CatalogDTO): void {
    if (catalog && this.accountingService.currentCatalog && catalog.key === this.accountingService.currentCatalog.key) {
      return;
    }
    this.accountingService.currentCatalog = catalog;
    this.drawer.close();
    this.getAccounts();
    this.getBalance();
    this.getVouchers();
  }

  getBalance(): void {
    this.balance.set([]);
    if (this.accountingService.currentCatalog) {
      this.isLoadingBalance.set(true);
      this.accountingService.getBalance(this.accountingService.currentCatalog.key).subscribe({
        next: (data) => {
          this.balance.set(data);
          this.isLoadingBalance.set(false);
        },
        error: () => this.isLoadingBalance.set(false),
      });
    }
  }

  getAccounts(): void {
    if (this.accountingService.currentCatalog) {
      this.isLoadingAccount.set(true);
      this.accountingService.getAccounts(this.accountingService.currentCatalog.key).subscribe({
        next: (data) => {
          const TREE_DATA: AccountNode[] = [];
          for (let i = 0; i < data.length; i++) {
            const acc = data[i];
            if (!acc.parent) {
              TREE_DATA.push({ account: acc });
            } else {
              this.searchParentNode(acc, TREE_DATA);
            }
          }
          this.dataSource.data = TREE_DATA;
          this.isLoadingAccount.set(false);
        },
        error: () => this.isLoadingAccount.set(false),
      });
    }
  }

  private searchParentNode(_account: AccountDTO, _tree: AccountNode[]): void {
    if (!_account.parent) return;
    for (let i = _tree.length - 1; i >= 0; i--) {
      const node = _tree[i];
      if (node.account.key === _account.parent) {
        if (!node.children) node.children = [];
        node.children.push({ account: _account });
        return;
      }
      if (node.children) this.searchParentNode(_account, node.children);
    }
  }

  openManualForm(): void {
    if (!this.accountingService.currentCatalog) return;
    this._utilsService.modalVoucher(null as unknown as string, this.accountingService.currentCatalog.key).then(() => {
      this.getBalance();
      this.getVouchers();
    });
  }
}
