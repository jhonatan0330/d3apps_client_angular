import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSliderModule } from '@angular/material/slider';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GPSDispositivoDTO } from '../../domain/gps.domain';
import { GPSService } from '../../services/gps.service';
import { DevicesListComponent } from '../list/list';
import { MapComponent } from '../map/map';

@Component({
  selector: 'app-gps',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSliderModule,
    DevicesListComponent,
    MapComponent,
  ],
  template: `
    <div class="flex flex-col w-full min-w-0 sm:absolute sm:inset-0 sm:overflow-hidden">
      <mat-drawer-container class="flex-auto sm:h-full">
        <mat-drawer class="sm:w-96 dark:bg-gray-900" [autoFocus]="false" [mode]="drawerMode()" [opened]="drawerOpened()" #drawer>
          <div class="flex items-center justify-between m-4">
            <div class="text-4xl font-extrabold tracking-tight leading-none">Dispositivos GPS</div>
            <div class="lg:hidden">
              <button (click)="drawer.close()">
                <mat-icon svgIcon="heroicons_outline:x-mark"></mat-icon>
              </button>
            </div>
          </div>
          <app-devices-list (selectDevice)="onSelectDevice($event)"></app-devices-list>
        </mat-drawer>

        <mat-drawer-content class="flex flex-col">
          <div class="flex-auto">
            <div class="flex items-center m-4">
              <button class="lg:hidden -ml-2" mat-icon-button (click)="drawer.toggle()">
                <mat-icon svgIcon="heroicons_outline:bars-3"></mat-icon>
              </button>
              @if (device(); as d) {
                <div class="text-4xl font-extrabold tracking-tight leading-none w-full">{{ d.usuarioNombre }}</div>
              } @else {
                <div class="text-4xl font-extrabold tracking-tight leading-none w-full">Select a device!</div>
              }
              <button class="ml-1" (click)="refresh()">
                <mat-icon svgIcon="heroicons_outline:arrow-path"></mat-icon>
              </button>
            </div>

            <div class="flex items-center mx-4">
              <mat-form-field appearance="fill" class="w-4/12">
                <input matInput [matDatepicker]="picker" [formControl]="dateFilter" />
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>
              <div class="px-2 w-4/12">
                <div>{{ hourOfDay() }}</div>
                <div>No point</div>
              </div>
              <mat-slider class="w-full" min="0" step="1" tickInterval="60" max="1440">
                <input matSliderThumb [formControl]="sliderControl" />
              </mat-slider>
            </div>
            <div>
              <app-map width="100%"></app-map>
            </div>
          </div>
        </mat-drawer-content>
      </mat-drawer-container>
    </div>
  `,
})
export default class GPSComponent implements OnInit {
  private readonly gpsService = inject(GPSService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  @ViewChild('drawer') drawer!: MatDrawer;

  readonly drawerMode = signal<'over' | 'side'>('side');
  readonly drawerOpened = signal(true);
  readonly hourOfDay = signal('00:00');
  readonly device = this.gpsService.device;

  dateFilter = new FormControl(this.gpsService.dayToList);
  sliderControl = new FormControl(0);

  constructor() {
    this.breakpointObserver
      .observe([Breakpoints.Large, Breakpoints.XLarge])
      .pipe(takeUntilDestroyed())
      .subscribe((state) => {
        this.drawerMode.set(state.matches ? 'side' : 'over');
      });

    this.sliderControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => this.calculeHourOfDay(value ?? 0));
    this.dateFilter.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.refresh());
  }

  ngOnInit() {
    this.calculeHourOfDay(0);
  }

  onSelectDevice(device: GPSDispositivoDTO) {
    this.gpsService.selectDevice(device);
  }

  calculeHourOfDay(value: number) {
    const dateCalculate = new Date();
    dateCalculate.setMinutes(value % 60);
    dateCalculate.setHours(value / 60);
    dateCalculate.setSeconds(0);
    this.hourOfDay.set(dateCalculate.toLocaleTimeString());
  }

  refresh() {
    this.gpsService.dayToList = this.dateFilter.value ?? new Date();
    const sub = this.gpsService.getLocationsFromDevice();
    if (sub) sub.subscribe();
  }
}
