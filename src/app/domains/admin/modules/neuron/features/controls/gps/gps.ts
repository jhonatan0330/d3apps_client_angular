import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseComponent } from '../base/base';

@Component({
  selector: 'neuron-control-gps',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <div [style.display]="(isInvisible || isSectionInvisible) ? 'none': 'block'" class="py-2">
      <mat-form-field class="w-full">
        <mat-label>{{ structure.nombre }}</mat-label>
        <input matInput [formControl]="fControl" [readonly]="!isEnabled" autocomplete="off" />
      </mat-form-field>
      @if (isEnabled) {
        <button mat-stroked-button (click)="getCurrentLocation()">
          <mat-icon>my_location</mat-icon> Obtener ubicacion
        </button>
      }
      @if (latitude && longitude) {
        <div class="text-xs text-gray-500 mt-1">Lat: {{ latitude }} | Lng: {{ longitude }}</div>
      }
    </div>
  `,
})
export default class GpsControl extends BaseComponent implements OnInit {
  fControl = new FormControl('');
  latitude: number | null = null;
  longitude: number | null = null;

  override ngOnInit(): void {
    super.ngOnInit();
    if (this.data?.valorText) {
      this.fControl.setValue(this.data.valorText);
      this.parseCoordinates(this.data.valorText);
    }
    this.fControl.valueChanges.subscribe(() => this.actualizar());
  }

  parseCoordinates(text: string): void {
    if (!text) return;
    const parts = text.split(',');
    if (parts.length >= 2) {
      this.latitude = parseFloat(parts[0].trim());
      this.longitude = parseFloat(parts[1].trim());
    }
  }

  getCurrentLocation(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      this.latitude = position.coords.latitude;
      this.longitude = position.coords.longitude;
      const coords = `${this.latitude}, ${this.longitude}`;
      this.fControl.setValue(coords);
    });
  }

  override actualizar(): void {
    const nuevoValor = this.fControl.value;
    if (this.data.valorText !== nuevoValor) {
      this.data.valorText = nuevoValor;
      this.parseCoordinates(nuevoValor || '');
      this.avisarModificacion();
    }
  }

  override send2Server(): boolean {
    this.errorMessage = null;
    if (this.required && !this.data.valorText && !this.isInvisible) {
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
