import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { PersonsService } from '../../services/persons.service';
import { LoginService } from '@/app/domains/auth/services/login.service';
import { UtilsService } from '@/app/domains/admin/modules/neuron/services/utils.service';
import { PedidoVentaDTO } from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { PermisosDTO, RolAccesoFilterDTO, UsuarioDTO } from '@/app/domains/auth/domain/auth.domain';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-persons-detail',
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  template: `
    <div class="flex w-full flex-col">
      <div class="relative h-40 w-full bg-accent-100 px-1 dark:bg-accent-700 sm:h-48">
        @if (contact().imagen) {
          <img class="absolute inset-0 h-full w-full object-cover" [src]="contact().imagen" />
        }
        <div class="flex w-full items-center justify-end">
          <button mat-icon-button (click)="cerrar()">
            <mat-icon class="text-white" svgIcon="heroicons_outline:x-mark"></mat-icon>
          </button>
        </div>
      </div>

      <div class="relative flex flex-auto flex-col items-center p-6 pt-0 sm:p-12 sm:pt-0">
        <div class="w-full max-w-3xl">
          @if (isSameUser()) {
            <div class="-mt-16 flex flex-auto items-end">
              <div class="ring-bg-card flex h-32 w-32 items-center justify-center overflow-hidden">
                <img class="h-full w-full object-cover" [src]="contact().imagen || '/assets/default-user.png'" />
              </div>
            </div>
          } @else {
            <div class="-mt-16 flex flex-auto items-end">
              <div class="ring-bg-card flex h-32 w-32 items-center justify-center overflow-hidden rounded-full ring-4">
                @if (contact().imagen) {
                  <img class="h-full w-full object-cover" [src]="contact().imagen" />
                } @else {
                  <div
                    class="flex h-full w-full items-center justify-center overflow-hidden rounded bg-gray-200 text-8xl font-bold uppercase leading-none text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                    {{ contact().nombre.charAt(0) }}
                  </div>
                }
              </div>
            </div>
          }

          <div class="mt-3 truncate text-4xl font-bold">{{ contact().nombre }}</div>
          <div class="mt-1 text-lg text-gray-600 dark:text-gray-300">ID: {{ contact().identificacion }}</div>

          <div class="mt-4 flex flex-col space-y-4 border-t pt-6">
            <div class="flex items-center">
              <mat-icon svgIcon="heroicons_outline:envelope"></mat-icon>
              <div class="ml-6 leading-6">
                <a class="text-primary-500 hover:underline" [href]="'mailto:' + contact().correo">{{ contact().correo }}</a>
              </div>
            </div>

            <div class="flex items-center">
              <mat-icon svgIcon="heroicons_outline:phone"></mat-icon>
              <div class="ml-6 leading-6">{{ contact().telefono }}</div>
            </div>

            <div class="mt-3 truncate text-4xl font-bold flex items-center gap-2">
              Roles
              <mat-icon svgIcon="heroicons_outline:briefcase" class="cursor-pointer" (click)="buscartags()"></mat-icon>
            </div>

            <div class="overflow-x-auto whitespace-nowrap">
              <div class="block pr-[10px] gap-2">
                @for (tag of userTags(); track tag.id) {
                  <button (click)="abrirRol(tag)" class="px-3">
                    @if (tag.imagen) {
                      <img class="h-[30px] w-[30px] object-cover rounded-full" [src]="tag.imagen" alt="tag.nombre" />
                    }
                    {{ tag.nombre }}
                  </button>
                }
              </div>
            </div>

            <div class="mt-3 truncate text-4xl font-bold flex items-center gap-2">
              Permisos
              <mat-icon svgIcon="heroicons_outline:briefcase" class="cursor-pointer" (click)="buscarPermisos()"></mat-icon>
            </div>

            @if (permisos().length) {
              <div class="flex flex-wrap gap-2 mb-4">
                @for (tipo of tiposFiltrados(); track tipo) {
                  <button class="px-3 py-1 rounded-full text-sm font-semibold shadow-md transition hover:opacity-80"
                    [class]="permisoColors[tipo] + (filtroActivo() === tipo ? ' ring-2 ring-offset-2 ring-black dark:ring-white' : '')"
                    (click)="toggleFiltro(tipo)">
                    {{ permisoNames[tipo] }}
                    <span class="ml-1 text-xs bg-white bg-opacity-20 rounded-full px-2 py-0.5">{{ contarPermisosPorTipo(tipo) }}</span>
                  </button>
                }
                @if (filtroActivo()) {
                  <button class="text-sm px-2 py-1 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400"
                    (click)="filtroActivo.set(null)">
                    Quitar filtro ✖
                  </button>
                }
              </div>
            }

            <div class="overflow-x-auto">
              <div class="grid grid-cols-2 gap-3 pr-[10px]">
                @for (permiso of permisosFiltrados(); track permiso.id) {
                  <button class="w-full px-3 py-2 rounded-md shadow-md text-left transition hover:scale-[1.02]"
                    [class]="permisoColors[permiso.tipo]">
                    {{ permisoNames[permiso.tipo] }}: {{ permiso.nombre }}
                    <div class="text-xs opacity-80">{{ permiso.key }}: {{ permiso.valor }}</div>
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export default class PersonsDetailComponent implements OnInit {
  private readonly _personsService = inject(PersonsService);
  private readonly _jwt = inject(LoginService);
  private readonly _utilsService = inject(UtilsService);
  private readonly _dialogRef = inject<MatDialogRef<PersonsDetailComponent>>(MatDialogRef);
  private readonly _data = inject<{ key: string }>(MAT_DIALOG_DATA);

  readonly contact = signal<UsuarioDTO>(new UsuarioDTO());
  readonly isSameUser = signal(false);
  readonly userTags = signal<RolAccesoFilterDTO[]>([]);
  readonly permisos = signal<PermisosDTO[]>([]);
  readonly filtroActivo = signal<string | null>(null);

  readonly permisoColors: Record<string, string> = {
    P: 'bg-blue-500 text-white',
    A: 'bg-green-500 text-white',
    T: 'bg-yellow-500 text-black',
    L: 'bg-purple-500 text-white',
    C: 'bg-pink-500 text-white',
    E: 'bg-orange-500 text-white',
    R: 'bg-teal-500 text-white',
    O: 'bg-red-500 text-white',
    W: 'bg-gray-700 text-white',
    S: 'bg-gray-500 text-white',
    G: 'bg-indigo-500 text-white',
    K: 'bg-lime-500 text-black',
  };

  readonly permisoNames: Record<string, string> = {
    P: 'Proceso',
    A: 'Estado',
    T: 'Transición',
    L: 'Plantilla',
    C: 'Campo',
    E: 'Reporte',
    R: 'Rol',
    O: 'Organización',
    W: 'API Service',
    S: 'Servidor',
    G: 'Catálogo',
    K: 'Account',
  };

  ngOnInit(): void {
    this._personsService.getContactById(this._data.key).subscribe((contact: UsuarioDTO) => {
      this.contact.set(contact);
      const currentUser = this._jwt.getUser() as UsuarioDTO | null;
      this.isSameUser.set((currentUser?.llaveTabla ?? '') === contact.llaveTabla);
    });
  }

  cerrar(): void {
    this._dialogRef.close();
  }

  abrirRol(tag: RolAccesoFilterDTO): void {
    const componente = new PedidoVentaDTO();
    componente.llaveTabla = tag.codigo;
    componente.plantilla = tag.plantilla;
    componente.server = '';
    this._utilsService.modalWithParams(componente);
  }

  buscartags(): void {
    this._personsService.searchTagsById(this._data.key).subscribe((value) => this.userTags.set(value));
  }

  buscarPermisos(): void {
    this._personsService.searchPermisosById(this._data.key).subscribe((value) => {
      this.permisos.set(value);
      this.filtroActivo.set(null);
    });
  }

  get tiposFiltrados(): () => string[] {
    return () => [...new Set(this.permisos().map((p) => p.tipo))];
  }

  get permisosFiltrados(): () => PermisosDTO[] {
    return () => {
      const f = this.filtroActivo();
      if (!f) return this.permisos();
      return this.permisos().filter((p) => p.tipo === f);
    };
  }

  toggleFiltro(tipo: string): void {
    this.filtroActivo.set(this.filtroActivo() === tipo ? null : tipo);
  }

  contarPermisosPorTipo(tipo: string): number {
    return this.permisos().filter((p) => p.tipo === tipo).length;
  }
}
