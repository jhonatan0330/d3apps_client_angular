import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { PermisosDTO, RolAccesoFilterDTO, UsuarioDTO } from '@/app/domains/auth/domain/auth.domain';
import { LocalStoreService } from '@/app/shared/services/local-store.service';

@Injectable({ providedIn: 'root' })
export class PersonsService {
  private readonly http = inject(HttpClient);
  private readonly ls = inject(LocalStoreService);

  private readonly _contacts = signal<UsuarioDTO[]>([]);
  readonly contacts = this._contacts.asReadonly();

  searchTags(): Observable<RolAccesoFilterDTO[]> {
    return this.http.get<RolAccesoFilterDTO[]>(this.ls.getUrlAccess('/user/getRole'));
  }

  searchTagsById(query: string): Observable<RolAccesoFilterDTO[]> {
    return this.http.get<RolAccesoFilterDTO[]>(this.ls.getUrlAccess('/user/roles/' + query));
  }

  searchPermisosById(query: string): Observable<PermisosDTO[]> {
    return this.http.get<PermisosDTO[]>(this.ls.getUrlAccess('/user/properties/' + query));
  }

  getContacts(): Observable<UsuarioDTO[]> {
    return this.http.post<UsuarioDTO[]>(this.ls.getUrlAccess('/user/getUsers'), { estado: 'A' }).pipe(
      tap((contacts) => this._contacts.set(contacts)),
    );
  }

  clearContacts(): void {
    this._contacts.set([]);
  }

  searchContacts(query: string): Observable<UsuarioDTO[]> {
    return this.http
      .post<UsuarioDTO[]>(this.ls.getUrlAccess('/user/getUsers'), { estado: 'A', identificacion: query })
      .pipe(
        tap((contacts) => {
          if (contacts.length > 0) {
            this._contacts.set(contacts);
          }
        }),
      );
  }

  getContactByTag(query: string): Observable<UsuarioDTO[]> {
    return this.http
      .post<UsuarioDTO[]>(this.ls.getUrlAccess('/user/getUsers'), { estado: 'A', rol: query, filtroParametro: 'A' })
      .pipe(tap((contacts) => this._contacts.set(contacts)));
  }

  getContactById(query: string): Observable<UsuarioDTO> {
    return this.http.get<UsuarioDTO>(this.ls.getUrlAccess('/user/' + query));
  }
}
