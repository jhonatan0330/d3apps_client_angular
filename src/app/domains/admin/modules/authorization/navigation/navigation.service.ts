import { Injectable, signal } from '@angular/core';
import { DocumentoPlantillaDTO } from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';
import { PropiedadDTO } from '@/app/shared/domain/shared.domain';

export interface NavItem {
  id: string;
  title: string;
  type: 'basic' | 'group' | 'aside';
  icon?: string;
  link?: string;
  image?: string;
  children?: NavItem[];
}

export interface Navigation {
  default: NavItem[];
  compact: NavItem[];
  futuristic: NavItem[];
  horizontal: NavItem[];
}

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly _navigation = signal<Navigation>({
    default: [],
    compact: [],
    futuristic: [],
    horizontal: [],
  });

  readonly navigation = this._navigation.asReadonly();

  generate(process: DocumentoPlantillaDTO[] | null, modules: PropiedadDTO[] | null, templates: DocumentoPlantillaDTO[] | null) {
    const localNav: NavItem[] = [
      { id: 'apps.main', title: 'Inicio', type: 'basic', icon: 'heroicons_outline:home', link: '/admin/main' },
    ];

    const compactNav: NavItem[] = [
      { id: 'apps.main', title: 'Inicio', type: 'basic', icon: 'heroicons_outline:home', link: '/admin/main' },
    ];

    if (!templates) {
      this._navigation.set({ default: localNav, compact: compactNav, futuristic: localNav, horizontal: localNav });
      return;
    }

    if (process && process.length > 0) {
      const processItems: NavItem[] = process.map((p) => {
        const idProcess = p.proceso ?? p.codigo;
        return {
          id: idProcess,
          title: p.nombre[0].toUpperCase() + p.nombre.substring(1).toLowerCase(),
          type: 'basic' as const,
          image: p.imagen,
          link: '/admin/list/process_crud/' + idProcess,
        };
      });
      localNav.push({ id: 'process', title: 'Procesos de Negocio', type: 'group', icon: 'heroicons_outline:squares-plus', children: processItems });
      compactNav.push({ id: 'process', title: 'Procesos de Negocio', type: 'aside', icon: 'heroicons_outline:squares-plus', children: processItems });
    }

    if (modules && modules.length > 0) {
      const moduleItems: NavItem[] = modules.map((m) => {
        const name = m.texto ? m.texto[0].toUpperCase() + m.texto.substring(1).toLowerCase() : m.valor;
        const item: NavItem = {
          id: m.llaveTabla,
          title: name,
          type: 'basic',
          link: '/' + m.valor,
        };
        if (m.motivo) item.image = m.motivo;
        else item.icon = 'heroicons_outline:check-circle';
        return item;
      });
      localNav.push({ id: 'apps', title: 'Apps', type: 'group', icon: 'heroicons_outline:squares-2x2', children: moduleItems });
      compactNav.push({ id: 'apps', title: 'Apps', type: 'aside', icon: 'heroicons_outline:squares-2x2', children: moduleItems });
    }

    const templateItems: NavItem[] = [];
    const reportItems: NavItem[] = [];

    templates.forEach((element) => {
      if (PlantillaHelper.buscarPropiedad(element.propiedades, PlantillaHelper.PERMISO_PLANTILLA_LISTAR_MENU)) {
        templateItems.push({
          id: element.llaveTabla,
          title: element.nombre[0].toUpperCase() + element.nombre.substring(1).toLowerCase(),
          type: 'basic',
          link: '/admin/list/list/' + element.llaveTabla,
          image: element.imagen,
        });
      }
      if (PlantillaHelper.buscarPropiedad(element.propiedades, PlantillaHelper.PLANTILLA_TIPO_REPORTE)
        && PlantillaHelper.buscarPropiedad(element.propiedades, PlantillaHelper.PERMISO_PLANTILLA_CREAR)) {
        reportItems.push({
          id: element.llaveTabla,
          title: element.nombre[0].toUpperCase() + element.nombre.substring(1).toLowerCase(),
          type: 'basic',
          link: '/admin/main/' + element.llaveTabla,
          image: element.imagen,
        });
      }
    });

    if (templateItems.length > 0) {
      localNav.push({ id: 'modulos', title: 'Modulos', type: 'group', icon: 'heroicons_outline:table-cells', children: templateItems });
      compactNav.push({ id: 'modulos', title: 'Modulos', type: 'aside', icon: 'heroicons_outline:table-cells', children: templateItems });
    }
    if (reportItems.length > 0) {
      localNav.push({ id: 'report', title: 'Reportes', type: 'group', icon: 'heroicons_outline:newspaper', children: reportItems });
      compactNav.push({ id: 'report', title: 'Reportes', type: 'aside', icon: 'heroicons_outline:newspaper', children: reportItems });
    }

    this._navigation.set({ default: localNav, compact: compactNav, futuristic: localNav, horizontal: localNav });
  }
}
