import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LocalStoreService } from '@/app/shared/services/local-store.service';
import {
  PropiedadDTO,
  PropiedadValorDefinidoDTO,
} from '@/app/shared/domain/shared.domain';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PropertyService {
  private readonly http = inject(HttpClient);
  private readonly ls = inject(LocalStoreService);

  selectedProperty: PropiedadDTO | null = null;
  selectedType: PropiedadValorDefinidoDTO | null = null;

  getProperties(type: string, field: string): Observable<PropiedadDTO[]> {
    return this.http.get<PropiedadDTO[]>(
      this.ls.getUrlAccess(`/property/${type}/${field}`),
    );
  }

  getTypes(type: string, filter: string): Observable<PropiedadValorDefinidoDTO[]> {
    return this.http.get<PropiedadValorDefinidoDTO[]>(
      this.ls.getUrlAccess(`/property/type/${type}/${filter}`),
    );
  }

  createProperty(property: PropiedadDTO): Observable<PropiedadDTO> {
    return this.http.post<PropiedadDTO>(
      this.ls.getUrlAccess('/property/'),
      property,
    );
  }

  getProperty(key: string): Observable<PropiedadDTO> {
    return this.http.get<PropiedadDTO>(
      this.ls.getUrlAccess(`/property/${key}`),
    );
  }
}
