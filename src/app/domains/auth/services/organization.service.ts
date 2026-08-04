import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import {
  OrganizacionDTO,
} from '@/app/domains/auth/domain/auth.domain';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';
import { PropiedadDTO } from '@/app/shared/domain/shared.domain';
import { LocalConstants, LocalStoreService } from '@/app/shared/services/local-store.service';
import { TemplateService } from '@/app/domains/admin/modules/neuron/services/template.service';
import { ApiService } from '@/app/domains/admin/modules/neuron/services/api.service';
import {
  PedidoVentaFilterDTO,
} from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { HtmlSanitizerService } from '@/app/shared/utils/html-sanitizer';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly ls = inject(LocalStoreService);
  private readonly http = inject(HttpClient);
  private readonly htmlSanitizer = inject(HtmlSanitizerService);
  private readonly templateService = inject(TemplateService);
  private readonly apiService = inject(ApiService);

  readonly company = signal<OrganizacionDTO | null>(null);
  readonly isAdmin = signal(false);
  readonly isReader = signal(false);
  readonly slides = signal<string[]>([]);
  readonly landing = signal<SafeHtml[]>([]);
  readonly headerSection = signal<SafeHtml[]>([]);

  getConfUrl(): unknown {
    return this.ls.getItem(LocalConstants.URL_CONF);
  }

  setConfUrl(url: string): void {
    if (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
    this.ls.setItem(LocalConstants.URL_CONF, url);
  }

  getUrlAccess(endpoint: string, server: string | null = null): string {
    return this.ls.getUrlAccess(endpoint, server);
  }

  setCompany(_company: OrganizacionDTO | null, isAuthenticated: boolean): void {
    if (_company) {
      this.getCarrousel(_company, isAuthenticated);
      if (_company.propiedades) {
        this.isAdmin.set(
          !PlantillaHelper.isEmpty(_company.propiedades, PlantillaHelper.APP_ADMIN),
        );
        this.isReader.set(
          !PlantillaHelper.isEmpty(_company.propiedades, PlantillaHelper.APP_READER),
        );
        this.templateService.setModules(
          PlantillaHelper.buscarValorMultiple(
            _company.propiedades,
            PlantillaHelper.APP_MODULES,
          ),
        );
      }
    }

    const current = this.company();
    if (current && current.llaveTabla === _company?.llaveTabla) {
      if (_company) {
        current.propiedades = _company.propiedades;
        this.company.set({ ...current });
      }
      return;
    }

    this.company.set(_company);
  }

  private getCarrousel(_company: OrganizacionDTO, isAuthenticated: boolean): void {
    const newSlides: string[] = [];
    const newLanding: SafeHtml[] = [];
    const newHeader: SafeHtml[] = [];

    if (_company.propiedades) {
      const backImages = PlantillaHelper.buscarValorMultiple(
        _company.propiedades,
        PlantillaHelper.COVERAGE_IMAGE,
      );
      if (backImages) {
        backImages.forEach((element) => newSlides.push(element.valor));
      }

      if (
        PlantillaHelper.buscarValor(
          _company.propiedades,
          PlantillaHelper.COVERAGE_TEMPLATE,
        ) &&
        isAuthenticated
      ) {
        const entity = new PedidoVentaFilterDTO();
        entity.plantilla = PlantillaHelper.buscarValor(
          _company.propiedades,
          PlantillaHelper.COVERAGE_TEMPLATE,
        );
        this.apiService.listarDocumentos(entity, null).subscribe({
          next: (dataResult) => {
            if (dataResult) {
              const updated = [...this.slides()];
              dataResult.forEach((element) => updated.push(element.imagen));
              this.slides.set(updated);
            }
          },
          error: () => {},
        });
      }

      const _iHeaders = PlantillaHelper.buscarValorMultiple(
        _company.propiedades,
        PlantillaHelper.LANDING_PAGE,
      );
      if (_iHeaders && _iHeaders.length !== 0) {
        _iHeaders.forEach((element: PropiedadDTO) => {
          newLanding.push(this.htmlSanitizer.sanitize(element.valor));
        });
      }

      const _iFooters = PlantillaHelper.buscarValorMultiple(
        _company.propiedades,
        PlantillaHelper.HEADER_PAGE,
      );
      if (_iFooters && _iFooters.length !== 0) {
        _iFooters.forEach((element: PropiedadDTO) => {
          newHeader.push(this.htmlSanitizer.sanitize(element.valor));
        });
      }
    }

    this.slides.set(newSlides);
    this.landing.set(newLanding);
    this.headerSection.set(newHeader);
  }

  obtenerPrincipalOrganizacion(): Observable<OrganizacionDTO> {
    return this.http.get<OrganizacionDTO>(
      this.getUrlAccess('/main/obtenerPrincipalOrganizacion'),
    );
  }

  validateAccessModule(pModuleKey: string): boolean {
    const currentCompany = this.company();
    if (currentCompany) {
      const _modules = PlantillaHelper.buscarValorMultiple(
        currentCompany.propiedades,
        PlantillaHelper.APP_MODULES,
      );
      if (_modules) {
        for (const element of _modules) {
          if (element.valor === pModuleKey) return true;
        }
      }
    }
    return false;
  }
}
