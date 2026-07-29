import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { GPSDispositivoDTO, GPSLocalizacionDTO, GPSLocalizacionFilterDTO } from '../domain/gps.domain';
import { LocalStoreService } from '@/app/shared/services/local-store.service';

@Injectable({ providedIn: 'root' })
export class GPSService {
  private readonly http = inject(HttpClient);
  private readonly ls = inject(LocalStoreService);

  readonly devices = signal<GPSDispositivoDTO[]>([]);
  readonly locations = signal<GPSLocalizacionDTO[]>([]);
  readonly device = signal<GPSDispositivoDTO | null>(null);

  dayToList = new Date();

  searchDevices(query: string) {
    let urlQuery = '/gps/get-device';
    if (query) urlQuery += '/' + query;
    return this.http.get<GPSDispositivoDTO[]>(this.ls.getUrlAccess(urlQuery)).pipe(
      tap((devices) => this.devices.set(devices)),
    );
  }

  selectDevice(_device: GPSDispositivoDTO) {
    this.device.set(_device);
    const sub = this.getLocationsFromDevice();
    if (sub) sub.subscribe();
  }

  getLocationsFromDevice() {
    const dev = this.device();
    if (!dev) return;

    const filter = new GPSLocalizacionFilterDTO();
    filter.dispositivo = dev.llaveTabla;
    filter.fechaMin = new Date(this.dayToList);
    filter.fechaMin.setHours(0, 0, 0, 0);
    filter.fechaMax = new Date(filter.fechaMin.getTime() + 1000 * 60 * 60 * 24);
    return this.http.post<GPSLocalizacionDTO[]>(this.ls.getUrlAccess('/gps/getGPSLocation'), filter).pipe(
      tap((locations) => this.locations.set(locations)),
    );
  }
}
