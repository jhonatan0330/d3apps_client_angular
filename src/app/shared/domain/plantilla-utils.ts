import { PropiedadDTO } from '@/app/shared/domain/shared.domain';

export function buscarPropiedad(
  propiedades: PropiedadDTO[],
  key: string,
): PropiedadDTO | null {
  if (propiedades) {
    return propiedades.find((property: PropiedadDTO) => property.key === key) ?? null;
  }
  return null;
}

export function buscarValor(propiedades: PropiedadDTO[], key: string): string {
  const p = buscarPropiedad(propiedades, key);
  return p ? p.valor : '';
}

export function buscarValorMultipleFromManyKeys(
  propiedades: PropiedadDTO[],
  keys: string[],
): PropiedadDTO[] | null {
  if (!propiedades || propiedades.length === 0) {
    return null;
  }
  if (!keys || keys.length === 0) {
    return null;
  }
  const result: PropiedadDTO[] = [];
  keys.forEach((key) => {
    propiedades.forEach((element) => {
      if (element.key === key) {
        result.push(element);
      }
    });
  });
  return result.length === 0 ? null : result;
}

export function buscarValorMultiple(
  propiedades: PropiedadDTO[],
  key: string,
): PropiedadDTO[] | null {
  if (key == null) {
    return null;
  }
  return buscarValorMultipleFromManyKeys(propiedades, [key]);
}

export function agregarPropiedad(
  propiedades: PropiedadDTO[],
  key: string,
  value: string,
): PropiedadDTO[] {
  if (propiedades == null) {
    propiedades = [];
  }
  const newParam = new PropiedadDTO();
  newParam.key = key;
  newParam.valor = value;
  propiedades.push(newParam);
  return propiedades;
}

export function isEmpty(propiedades: PropiedadDTO[], key: string): boolean {
  return !buscarPropiedad(propiedades, key);
}
