import { Component, OnDestroy, inject, signal, effect } from '@angular/core';
import { LoginService } from '@/app/domains/auth/services/login.service';
import { UtilsService } from '@/app/domains/admin/modules/neuron/services/utils.service';
import { UsuarioDTO, OrganizacionDTO } from '@/app/domains/auth/domain/auth.domain';
import AnalyticsDashboard from '../../../dashboards/features/analytics/analytics';
import FinanceDashboard from '../../../dashboards/features/finance/finance';
import ProjectDashboard from '../../../dashboards/features/project/project';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [
    AnalyticsDashboard,
    FinanceDashboard,
    ProjectDashboard,
  ],
  template: `
    <div class="flex flex-col flex-auto min-w-0">
      @if (user(); as u) {
        <div class="flex flex-col shadow-sm bg-white dark:bg-neutral-800">
          <div class="flex flex-row flex-0 items-center max-w-5xl w-full mx-auto px-8 lg:h-[4.5rem] bg-white dark:bg-neutral-800">
            <div class="max-w-32 z-0">
              <img
                class="w-full h-full rounded-full ring-4 ring-white dark:ring-neutral-800 bg-white"
                [src]="company()?.imagen"
                alt="Logo"
              />
            </div>
            <div class="flex flex-col items-center lg:items-start mt-4 mb-4 lg:mt-0 lg:mb-0">
              <div class="text-lg font-bold leading-none">{{ company()?.nombre }}</div>
              <div class="text-neutral-500 dark:text-neutral-400 p-1">{{ company()?.slogan }}</div>
            </div>
          </div>
        </div>
      }
      <div class="flex flex-col w-full items-center justify-center h-40 lg:h-[12.5rem] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        @if (slides().length > 0) {
          <img
            class="w-full h-full object-cover"
            [src]="slides()[currentSlide()]"
            alt="Slide"
          />
          <div class="flex gap-2 -mt-6 z-10">
            @for (slide of slides(); track slide; let i = $index) {
              <button
                class="w-2 h-2 rounded-full border border-white transition-colors cursor-pointer"
                [class.bg-white]="i === currentSlide()"
                [class.bg-transparent]="i !== currentSlide()"
                (click)="currentSlide.set(i)"
              ></button>
            }
          </div>
        }
      </div>
      <analytics-dashboard />
      <finance-dashboard />
      <project-dashboard />
    </div>
  `,
})
export default class DashboardComponent implements OnDestroy {
  private readonly utilsService = inject(UtilsService);
  private readonly loginservice = inject(LoginService);

  protected readonly currentSlide = signal(0);
  protected readonly slides = signal<string[]>([]);
  protected readonly user = signal<UsuarioDTO | null>(null);
  protected readonly company = signal<OrganizacionDTO | null>(null);

  private readonly userWatcher = effect(() => {
    const u = this.loginservice.user();
    this.user.set(u);
  });

  private readonly companyWatcher = effect(() => {
    const c = this.loginservice.company();
    this.company.set(c);
  });

  private readonly slidesWatcher = effect(() => {
    this.slides.set(this.loginservice.slides());
  });

  private readonly dateWatcher = effect(() => {
    const date = this.loginservice.currentDate();
    if (!date) return;
    const received = date instanceof Date ? date : new Date(date);
    if (received < new Date()) {
      this.utilsService.modalUserChangePass().then();
    }
  });

  ngOnDestroy() {
    this.userWatcher.destroy();
    this.companyWatcher.destroy();
    this.slidesWatcher.destroy();
    this.dateWatcher.destroy();
  }
}
