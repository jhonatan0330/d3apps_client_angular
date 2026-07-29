import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { PersonsService } from '../../services/persons.service';
import { LoginService } from '@/app/domains/auth/services/login.service';
import { UtilsService } from '@/app/domains/admin/modules/neuron/services/utils.service';
import { RolAccesoFilterDTO, UsuarioDTO } from '@/app/domains/auth/domain/auth.domain';
import { NotificationCenterService } from '@/app/shared/services/notification-center.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-persons-list',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSidenavModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatButtonModule,
  ],
  template: `
    <div class="absolute inset-0 flex min-w-0 flex-col overflow-hidden">
      <div class="flex-auto h-screen overflow-y-auto">
        <div
          class="flex flex-auto flex-col justify-between border-b px-6 py-8 sm:flex-row md:flex-col md:px-8 sticky top-0 z-50 shadow">
          <div>
            <div class="text-4xl font-extrabold leading-none tracking-tight">Usuarios</div>
            <div class="text-secondary ml-0.5 font-medium">
              @if (contactsCount() > 0) {
                <span>{{ contactsCount() }} </span>
              }
              @if (contactsCount() === 0) {
                No hay
              } @else if (contactsCount() === 1) {
                persona
              } @else {
                personas
              }
            </div>
          </div>
          <div class="mt-4 flex items-center sm:mt-0 md:mt-4">
            <div class="flex-auto">
              <mat-form-field class="w-full min-w-50" subscriptSizing="dynamic">
                <mat-icon class="icon-size-5" matPrefix svgIcon="heroicons_outline:magnifying-glass"></mat-icon>
                <input matInput [formControl]="searchInputControl" [autocomplete]="'off'" placeholder="Buscar usuarios" />
              </mat-form-field>
            </div>
          </div>
          <div class="mt-4 flex items-center sm:mt-0 md:mt-4">
            @if (tags(); as tags) {
              <div class="overflow-x-auto whitespace-nowrap">
                <div class="flex pr-[10px] gap-2">
                  @for (tag of tags; track tag.id) {
                    <button (click)="filtrarPorTag(tag)"
                      class="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-500 dark:text-green-50 overflow-hidden w-[200px] flex items-center gap-2">
                      @if (tag.imagen) {
                        <img class="h-[50px] w-[50px] object-cover rounded-full" [src]="tag.imagen" alt="tag.nombre" />
                      }
                      {{ limpiarNombre(tag.nombre) }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <div class="relative">
          @if (contacts(); as contacts) {
            @if (contacts.length > 0) {
              @for (contact of contacts; track contact.llaveTabla; let i = $index) {
                @if (i === 0 || contact.nombre.charAt(0) !== contacts[i - 1].nombre.charAt(0)) {
                  <div
                    class="text-secondary sticky top-0 z-10 -mt-px border-b border-t bg-gray-50 px-6 py-1 font-medium uppercase dark:bg-gray-900 md:px-8">
                    {{ contact.nombre.charAt(0) }}
                  </div>
                }
                <a class="z-20 flex cursor-pointer items-center border-b px-6 py-4 md:px-8">
                  <div class="flex h-10 w-10 flex-0 items-center justify-center overflow-hidden rounded-full">
                    @if (contact.imagen) {
                      <img class="h-full w-full object-cover" [src]="contact.imagen" alt="Contact imagen" />
                    } @else {
                      <div
                        class="flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-lg uppercase text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                        {{ contact.nombre.charAt(0) }}
                      </div>
                    }
                  </div>
                  <div class="ml-4 min-w-0" (click)="onUsuarioClick(contact)">
                    <div class="truncate font-medium leading-5">{{ contact.nombre }}</div>
                    <div class="text-secondary truncate leading-5">{{ contact.telefono }}</div>
                  </div>
                  <div class="ml-auto leading-6">
                    <button mat-icon-button [matMenuTriggerFor]="menu">
                      <mat-icon svgIcon="heroicons_outline:ellipsis-vertical"></mat-icon>
                    </button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item (click)="cambiar_clave(contact)">
                        <mat-icon svgIcon="heroicons_outline:key"></mat-icon>
                        Cambiar Clave
                      </button>
                    </mat-menu>
                  </div>
                </a>
              }
            } @else {
              <div class="border-t p-8 text-center text-4xl font-semibold tracking-tight sm:p-16">No hay!</div>
            }
          } @else {
            <div class="border-t p-8 text-center text-4xl font-semibold tracking-tight sm:p-16">
              Por favor filtre por rol o nombre...
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export default class PersonsListComponent implements OnInit, OnDestroy {
  private readonly _personsService = inject(PersonsService);
  private readonly _jwt = inject(LoginService);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _utilsService = inject(UtilsService);

  private readonly _unsubscribeAll = new Subject<void>();

  readonly contacts = this._personsService.contacts;
  readonly contactsCount = signal(0);
  readonly tags = signal<RolAccesoFilterDTO[]>([]);

  searchInputControl = new FormControl('');

  ngOnInit(): void {
    if (!this._jwt.validateAccessModule('persons')) {
      this._router.navigate(['/main']);
      return;
    }

    this._personsService.contacts().length;

    this._personsService.searchTags().subscribe((tags) => this.tags.set(tags));
    this._personsService.clearContacts();

    this.searchInputControl.valueChanges.pipe(debounceTime(500), takeUntil(this._unsubscribeAll)).subscribe((query) => {
      if (query) this._personsService.searchContacts(query).subscribe();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  limpiarNombre(nombre: string): string {
    return nombre.replace(/^rol\s+/i, '');
  }

  filtrarPorTag(tag: RolAccesoFilterDTO): void {
    this._personsService.getContactByTag(tag.llaveTabla).subscribe();
  }

  onUsuarioClick(pUsuario: UsuarioDTO): void {
    this._utilsService.modalUser(pUsuario.llaveTabla);
  }

  cambiar_clave(pUsuario: UsuarioDTO): void {
    this._jwt.recoverPassword(pUsuario.identificacion, pUsuario.correo).subscribe(() => {
      const notificationCenter = new NotificationCenterService();
      notificationCenter.success('Correo Enviado', 'Revisa el correo ' + pUsuario.correo + '.');
    });
  }
}
