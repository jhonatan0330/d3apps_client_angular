import { Component, input } from '@angular/core';
import { MatCard, MatCardHeader } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'dashboard-card',
  imports: [MatCard, MatCardHeader, MatIcon],
  template: `
    <mat-card [appearance]="appearance()" [class]="cardClass()">
      @if (title() || icon()) {
        <mat-card-header>
          <div class="flex flex-auto items-center gap-x-2">
            @if (icon()) {
              <mat-icon class="size-4" [svgIcon]="icon()!" />
            }
            <div class="font-medium tracking-tight">{{ title() }}</div>
            <ng-content select="[card-menu]" />
          </div>
        </mat-card-header>
      }
      <ng-content />
    </mat-card>
  `,
})
export class DashboardCard {
  title = input<string>('');
  icon = input<string>('');
  appearance = input<'outlined' | 'filled'>('filled');
  cardClass = input<string>('');
}
