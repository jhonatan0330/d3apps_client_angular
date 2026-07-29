import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { timer } from 'rxjs';
import { PedidoVentaCaracteristicaFilterDTO } from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';
import { BaseComponent } from '../base/base';

@Component({
  selector: 'neuron-control-fecha',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule],
  template: `
    @if (timerBackCount) {
      <div class="time-countdown" [style.display]="(isInvisible || isSectionInvisible) ? 'none': 'block'">
        <ul class="flex gap-2 list-none p-0 m-0">
          <li><span class="font-bold">{{ day }}</span> Dias</li>
          <li><span class="font-bold">{{ hours }}</span> Hrs</li>
          <li><span class="font-bold">{{ minutes }}</span> Min</li>
          <li><span class="font-bold">{{ seconds }}</span> Seg</li>
        </ul>
      </div>
    }
    @if (!isRango && !sinCalendar) {
      <mat-form-field [style.display]="(isInvisible || isSectionInvisible) ? 'none': 'block'" class="w-full">
        @if (errorMessage) {
          <label class="items-center font-medium tracking-wide text-red-500 text-xs mt-1 ml-1">{{ errorMessage }}</label>
        }
        <mat-label>{{ structure.nombre }}</mat-label>
        <input matInput [matDatepicker]="pickerFrom" [required]="required" [formControl]="dateFrom" [readonly]="!isEnabled" autocomplete="off" />
        @if (isEnabled) {
          <mat-datepicker-toggle matSuffix [for]="pickerFrom"></mat-datepicker-toggle>
        }
        <mat-datepicker #pickerFrom></mat-datepicker>
      </mat-form-field>
      @if (conHora && data?.valorFecha) {
        <div class="relative left-24 -top-10 h-0" [style.display]="isInvisible ? 'none': 'block'">
          <input matInput type="time" [readonly]="!isEnabled" [required]="required" [formControl]="timeFrom" />
        </div>
      }
    }
    @if (!isRango && sinCalendar) {
      <mat-form-field [style.display]="(isInvisible || isSectionInvisible) ? 'none': 'block'" class="w-full">
        <mat-label>{{ structure.nombre }}</mat-label>
        <input matInput type="time" [formControl]="ftimeFromMinutesAndHours" [required]="required" autocomplete="off" />
      </mat-form-field>
    }
    @if (isRango) {
      <mat-form-field [style.display]="(isInvisible || isSectionInvisible) ? 'none': 'block'" class="w-full">
        <mat-label>{{ structure.nombre }} {{ required ? '*' : '' }}</mat-label>
        <mat-date-range-input [rangePicker]="picker">
          <input matStartDate placeholder="Fecha inicial" [formControl]="fControlDateStart" (dateInput)="datesUpdated()" (dateChange)="datesUpdated()" autocomplete="off" [required]="required" />
          <input matEndDate placeholder="Fecha final" [formControl]="fControlDateEnd" (dateInput)="datesUpdated()" (dateChange)="datesUpdated()" autocomplete="off" [required]="required" />
        </mat-date-range-input>
        <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-date-range-picker #picker></mat-date-range-picker>
      </mat-form-field>
    }
  `,
})
export default class FechaControl extends BaseComponent implements OnInit {
  conHora = false;
  sinCalendar = false;
  dateFrom = new FormControl();
  timeFrom = new FormControl('00:00');
  timerBackCount = false;
  isRango = false;
  fControlDateStart = new FormControl();
  fControlDateEnd = new FormControl();
  ftimeFromMinutesAndHours = new FormControl('00:00');
  day = 0;
  hours = 0;
  minutes = 0;
  seconds = 0;
  source = timer(0, 1000);
  clock: any;
  funcion = '';

  override ngOnInit() {
    super.ngOnInit();
    const opcionesRango = this.obtenerValor(PlantillaHelper.FECHA_RANGO);
    this.isRango = !this.isEmpty(opcionesRango);
    this.conHora = !this.isEmpty(this.obtenerValor(PlantillaHelper.FECHA_CON_HORA));
    this.funcion = this.obtenerValor(PlantillaHelper.FECHA_FUNCION);
    this.sinCalendar = !this.isEmpty(this.obtenerValor(PlantillaHelper.FECHA_SIN_CALENDAR));
    this.timerBackCount = !this.isEmpty(this.obtenerValor(PlantillaHelper.FECHA_TIMER_BACK));

    if (this.data?.valorFecha) {
      this.dateFrom.setValue(new Date(this.data.valorFecha));
      this.timeFrom.setValue(('0' + this.data.valorFecha.getHours()).slice(-2) + ':' + ('0' + this.data.valorFecha.getMinutes()).slice(-2));
      this.data.valorFecha = this.dateFrom.value;
      if (this.data.valorNumero) {
        this.ftimeFromMinutesAndHours.setValue(
          ('0' + Math.floor(this.data.valorNumero / 3600000)).slice(-2) + ':' + ('0' + ((this.data.valorNumero / 1000) % 3600) / 60).slice(-2)
        );
      }
      if (this.data.valorAuxiliar === 'R') {
        this.fControlDateStart.setValue(this.data.valorFecha);
        const endDate = new Date(this.data.valorFecha!);
        endDate.setHours(endDate.getHours() + Math.floor(this.data.valorNumero! / 3600000));
        endDate.setMinutes(endDate.getMinutes() + ((this.data.valorNumero! / 1000) % 3600) / 60);
        this.fControlDateEnd.setValue(endDate);
      }
    } else {
      if (this.required) {
        if (!this.data.documento && !this.isEmpty(this.funcion)) {
          this.procesarCampo(this.transformPVCtoFilter(this.data));
        } else {
          const initialDate = new Date();
          if (!this.conHora) {
            initialDate.setHours(0, 0, 0, 0);
          }
          this.dateFrom.setValue(initialDate);
          this.timeFrom.setValue(('0' + initialDate.getHours()).slice(-2) + ':' + ('0' + initialDate.getMinutes()).slice(-2));
          this.data.valorFecha = initialDate;
        }
      }
    }
    if (this.required) {
      this.dateFrom.setValidators(new Function('return null')());
      this.dateFrom.updateValueAndValidity();
    }
    if (this.isEnabled) {
      this.fControlDateStart.enable();
      this.fControlDateEnd.enable();
    } else {
      this.fControlDateStart.disable();
      this.fControlDateEnd.disable();
    }
    this.dateFrom.valueChanges.subscribe(() => this.actualizar());
    this.timeFrom.valueChanges.subscribe(() => this.actualizar());
    if (this.timerBackCount) {
      this.clock = this.source.subscribe(() => this.showTimer());
    }
  }

  override actualizar() {
    let fecha: Date | null = null;
    if (this.dateFrom.value && this.dateFrom.value.length !== 0) fecha = new Date(this.dateFrom.value);
    let hour = 0;
    let minute = 0;
    if (this.timeFrom?.value) {
      hour = Number(this.timeFrom.value.substring(0, 2));
      minute = Number(this.timeFrom.value.substring(3, 5));
    }
    if (!fecha) {
      if (this.data.valorFecha) {
        this.data.valorFecha = null;
        this.data.valorText = null;
        this.avisarModificacion();
      }
    } else {
      fecha.setHours(hour, minute, 0, 0);
      if (!this.data.valorFecha || fecha !== this.data.valorFecha) {
        this.data.valorFecha = fecha;
        this.data.valorText = fecha.toLocaleString('en-ZA');
        this.avisarModificacion();
      }
    }
  }

  datesUpdated() {
    if (this.fControlDateStart.value && this.fControlDateEnd.value) {
      const startDate = new Date(this.fControlDateStart.value);
      const endDate = new Date(this.fControlDateEnd.value);
      endDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() + 1);
      this.data.valorFecha = startDate;
      this.data.valorNumero = endDate.getTime() - startDate.getTime();
      if (this.data.valorNumero === 0) this.data.valorNumero = 86399999;
      this.data.valorAuxiliar = this.data.valorNumero === 86399999 ? 'D' : 'R';
    } else {
      this.data.valorFecha = null;
      this.data.valorNumero = null;
      this.data.valorAuxiliar = null;
    }
  }

  showTimer() {
    if (this.data.valorFecha) {
      const distance = this.data.valorFecha.getTime() - new Date().getTime();
      this.day = Math.floor(distance / (1000 * 60 * 60 * 24));
      if (this.day < 0) this.day += 1;
      this.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      this.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      this.seconds = Math.floor((distance % (1000 * 60)) / 1000);
    }
  }

  override procesarCampo(_campoFiltro: PedidoVentaCaracteristicaFilterDTO) {
    console.warn('FechaControl.procesarCampo: server-side date calculation not yet connected');
  }

  override send2Server(): boolean {
    this.errorMessage = null;
    if (this.data.modificado && this.data?.valorFecha) {
      const fechaActual = new Date();
      if (!this.conHora) fechaActual.setHours(0, 0, 0, 0);
      const maxTime = this.obtenerValor(PlantillaHelper.FECHA_MAXIMA);
      if (!this.isEmpty(maxTime)) {
        const fechaMaxima = new Date(fechaActual.getTime() + Number(maxTime));
        if (this.data.valorFecha > fechaMaxima) {
          this.errorMessage = `La fecha no puede ser mayor a ${fechaMaxima.toLocaleString('en-ZA')}`;
        }
      }
      const minTime = this.obtenerValor(PlantillaHelper.FECHA_MINIMA);
      if (!this.isEmpty(minTime)) {
        const fechaMinima = new Date(fechaActual.getTime() - Number(minTime));
        if (this.data.valorFecha < fechaMinima) {
          this.errorMessage = `La fecha no puede ser menor a ${fechaMinima.toLocaleString('en-ZA')}`;
        }
      }
    }
    if (!this.errorMessage && this.required && !this.isInvisible && !this.data.valorFecha) {
      this.errorMessage = `En la plantilla ${this._structure.plantillaNombre} es obligatorio registrar el campo ${this._structure.nombre})`;
    }
    if (this.errorMessage) {
      const input = document.getElementById(this.idField!) as HTMLInputElement;
      if (input) input.focus();
      return false;
    }
    return true;
  }
}
