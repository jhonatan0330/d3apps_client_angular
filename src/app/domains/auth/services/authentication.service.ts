import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LocalStoreService } from '@/app/shared/services/local-store.service';
import { OrganizacionDTO } from '@/app/domains/auth/domain/auth.domain';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly http = inject(HttpClient);
  private readonly ls = inject(LocalStoreService);

  getOrganization(): Observable<OrganizacionDTO> {
    return this.http.get<OrganizacionDTO>(
      this.ls.getUrlAccess('/authentication/obtenerPrincipalOrganizacion'),
    );
  }
}
