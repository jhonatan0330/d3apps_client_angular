import { Injectable, inject, signal } from '@angular/core';
import { DocumentoPlantillaDTO, RelacionInternaDTO } from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';
import { PropiedadDTO } from '@/app/shared/domain/shared.domain';
import { LocalConstants, LocalStoreService } from '@/app/shared/services/local-store.service';
import { OrganizacionDTO } from '@/app/domains/auth/domain/auth.domain';
import { NavigationService } from '@/app/domains/admin/modules/authorization/navigation/navigation.service';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly ls = inject(LocalStoreService);
  private readonly navigationService = inject(NavigationService);

  template: DocumentoPlantillaDTO[] = [];
  private readonly _templates = signal<DocumentoPlantillaDTO[]>([]);
  private readonly _modules = signal<PropiedadDTO[] | null>(null);

  readonly templates = this._templates.asReadonly();
  readonly modules = this._modules.asReadonly();

  private colores: PropiedadDTO[] = [];
  private coloresOthers: PropiedadDTO[] = [];
  conectionTemplates: OrganizacionDTO[] = [];
  private propiedadesConRelaciones: RelacionInternaDTO[] = [];

  getTemplate(id: string, urlServer: string | null): DocumentoPlantillaDTO | null {
    if (!this.template) return null;
    if (!urlServer) {
      return this.template.find((item) => id === item.llaveTabla) ?? null;
    }
    if (this.conectionTemplates) {
      const org = this.conectionTemplates.find((itemOrg) => urlServer === itemOrg.llaveTabla);
      if (org && org.plantillas) {
        return org.plantillas.find((itemExternal) => id === itemExternal.llaveTabla) ?? null;
      }
    }
    return null;
  }

  setOtherSystems(value: OrganizacionDTO[]): void {
    this.conectionTemplates = value;
    this.ls.setItem(LocalConstants.SERVERS, value);
  }

  getTemplateOfProcess(processId: string): DocumentoPlantillaDTO[] | null {
    if (!this.template) return null;
    return this.template.filter(
      (item) => item.proceso && item.proceso.toLowerCase().indexOf(processId.toLowerCase()) > -1,
    );
  }

  setTemplates(value: DocumentoPlantillaDTO[]): void {
    this.template = value;
    this.colores = [];
    this.getColor('');
    this._templates.set(value);
    const processToMenu = value.filter((x) => x.estado === 'T' || (!x.llaveTabla && x.proceso));
    this.navigationService.generate(processToMenu, this._modules(), value);
  }

  addTemplatesFromOtherSystems(): void {
    if (!this.conectionTemplates) return;
    const allTemplates = [...this.template];
    for (const org of this.conectionTemplates) {
      if (org.plantillas) {
        allTemplates.push(...org.plantillas);
      }
    }
    this._templates.set(allTemplates);
  }

  getColor(stateId: string): string | null {
    if (!stateId || !this.template) return null;
    if (this.colores.length === 0) {
      for (const element of this.template) {
        this.exploreTemplateColor(element, this.colores);
      }
    }
    const prop = this.colores.find((item) => item.campo === stateId);
    if (prop) return prop.valor;
    if (this.coloresOthers.length === 0 && this.conectionTemplates) {
      this.coloresOthers = [];
      for (const org of this.conectionTemplates) {
        if (org.plantillas) {
          for (const tpl of org.plantillas) {
            this.exploreTemplateColor(tpl, this.coloresOthers);
          }
        }
      }
    }
    const prop2 = this.coloresOthers.find((item) => item.campo === stateId);
    return prop2 ? prop2.valor : null;
  }

  getColorFont(stateId: string): string {
    const white = '#ffffff';
    const black = '#000000';
    const bgColor = this.getColor(stateId);
    if (!bgColor || bgColor.length !== 7) return black;
    const bgRgb = this.hexToRgb(bgColor);
    if (!bgRgb) return black;
    const whiteLum = this.luminance(255, 255, 255);
    const bgLum = this.luminance(bgRgb.r, bgRgb.g, bgRgb.b);
    const ratio = whiteLum > bgLum
      ? (bgLum + 0.05) / (whiteLum + 0.05)
      : (whiteLum + 0.05) / (bgLum + 0.05);
    return ratio < 1 / 3 ? white : black;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : null;
  }

  private luminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return rs * 0.2126 + gs * 0.7152 + bs * 0.0722;
  }

  private exploreTemplateColor(element: DocumentoPlantillaDTO, array: PropiedadDTO[]): void {
    if (element.estados) {
      for (const estado of element.estados) {
        if (estado.propiedades) {
          const pColor = PlantillaHelper.buscarPropiedad(estado.propiedades, PlantillaHelper.COLOR);
          if (pColor) array.push(pColor);
        }
      }
    }
  }

  clear(): void {
    this.colores = [];
    this.coloresOthers = [];
    this.setTemplates([]);
    this._modules.set(null);
  }

  setModules(value: PropiedadDTO[] | null): void {
    this._modules.set(value);
  }

  getProceso(id: string): DocumentoPlantillaDTO | undefined {
    if (this.template && this.template.length !== 0) {
      return this.template.find((x) => !x.llaveTabla && (x.proceso === id || x.codigo === id));
    }
    return undefined;
  }

  addRelations(relations: RelacionInternaDTO[]): void {
    if (!this.propiedadesConRelaciones) this.propiedadesConRelaciones = [];
    this.propiedadesConRelaciones = this.propiedadesConRelaciones.concat(relations);
  }

  getPropertyRelation(propiedad: string): RelacionInternaDTO[] | undefined {
    if (!this.propiedadesConRelaciones) return undefined;
    return this.propiedadesConRelaciones.filter((x) => x.propiedad === propiedad);
  }

  getTokenConnection(urlServer: string): string | null {
    if (this.conectionTemplates && urlServer) {
      for (const element of this.conectionTemplates) {
        if (element.servidor && urlServer.indexOf(element.servidor) !== -1) {
          return element.token;
        }
      }
    }
    return this.ls.getItem(LocalConstants.JWT_TOKEN) as string | null;
  }
}
