import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { GPSDispositivoDTO } from '../../domain/gps.domain';
import { GPSService } from '../../services/gps.service';

@Component({
  selector: 'app-devices-list',
  imports: [FormsModule, ReactiveFormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="flex-auto">
      <div class="flex flex-col sm:flex-row md:flex-col flex-auto justify-between border-b">
        <div class="flex items-center mx-4">
          <div class="flex-auto">
            <mat-form-field class="w-full min-w-50">
              <mat-icon class="icon-size-5" matPrefix svgIcon="heroicons_outline:magnifying-glass"></mat-icon>
              <input matInput [formControl]="searchInputControl" autocomplete="off" placeholder="Search devices" />
            </mat-form-field>
          </div>
          <button class="ml-1" (click)="searchDevices()">
            <mat-icon svgIcon="heroicons_outline:arrow-path"></mat-icon>
          </button>
        </div>
      </div>

      <div class="relative">
        @if (devices().length) {
          @for (device of devices(); track device.llaveTabla; let i = $index) {
            @if (i === 0 || device.usuarioNombre.charAt(0) !== devices()[i - 1].usuarioNombre.charAt(0)) {
              <div class="z-10 sticky top-0 -mt-px px-6 py-1 md:px-8 border-t border-b font-medium uppercase text-secondary bg-gray-50 dark:bg-gray-900">
                {{ device.usuarioNombre.charAt(0) }}
              </div>
            }
            <a class="z-20 flex items-center px-6 py-4 md:px-8 cursor-pointer border-b hover:bg-gray-100 dark:hover:bg-hover"
              (click)="emitSelect(device)">
              <div class="flex flex-0 items-center justify-center w-10 h-10 rounded-full overflow-hidden">
                <div class="flex items-center justify-center w-full h-full rounded-full text-lg uppercase bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                  {{ device.usuarioNombre.charAt(0) }}
                </div>
              </div>
              <div class="min-w-0 ml-4">
                <div class="font-medium leading-5 truncate">{{ device.usuarioNombre }}</div>
                <div class="leading-5 truncate text-secondary">{{ device.nombre }}</div>
              </div>
            </a>
          }
        } @else {
          <div class="p-8 sm:p-16 border-t text-4xl font-semibold tracking-tight text-center">There are no devices!</div>
        }
      </div>
    </div>
  `,
})
export class DevicesListComponent {
  @Output() selectDevice = new EventEmitter<GPSDispositivoDTO>();

  private readonly gpsService = inject(GPSService);

  readonly devices = this.gpsService.devices;
  readonly searchInputControl = new FormControl('');

  searchDevices() {
    this.gpsService.searchDevices(this.searchInputControl.value ?? '').subscribe();
  }

  emitSelect(device: GPSDispositivoDTO) {
    this.selectDevice.emit(device);
  }
}
