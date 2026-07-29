import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DocumentoPlantillaDTO,
  PedidoVentaDTO,
  RelacionInternaDTO,
  DocumentoPlantillaCaracteristicaDTO,
  PedidoVentaAjusteDTO,
  ProductoInventarioDTO,
  PedidoVentaFilterDTO,
  RelacionInternaFilterDTO,
  PedidoVentaCaracteristicaFilterDTO,
  PedidoVentaCaracteristicaDTO,
} from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { ApiErrorResponse, IdResponse } from '@/app/domains/admin/modules/neuron/domain/sw42.utils';
import { LocalConstants, LocalStoreService } from '@/app/shared/services/local-store.service';
import { UsuarioAutenticacionDTO, UsuarioDTO } from '@/app/domains/auth/domain/auth.domain';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly ls = inject(LocalStoreService);

  listarPlantillas(
    pProfile: string,
    pServer: string | null = null,
  ): Observable<DocumentoPlantillaDTO[]> {
    return this.http.get<DocumentoPlantillaDTO[]>(
      this.ls.getUrlAccess(`/template/getTemplates/${pProfile}`, pServer),
    );
  }

  relacionesPropiedad(
    filter: RelacionInternaFilterDTO,
    _server: string,
  ): Observable<RelacionInternaDTO[]> {
    return this.http.post<RelacionInternaDTO[]>(
      this.ls.getUrlAccess('/template/getPropertyRelations', _server),
      filter,
    );
  }

  validarTipoProcesoCarga(
    filter: DocumentoPlantillaCaracteristicaDTO,
    _server: string,
  ): Observable<DocumentoPlantillaCaracteristicaDTO> {
    return this.http.post<DocumentoPlantillaCaracteristicaDTO>(
      this.ls.getUrlAccess('/template/validateLoad', _server),
      filter,
    );
  }

  listarDocumentos(
    filtro: PedidoVentaFilterDTO,
    _server: string | null,
  ): Observable<PedidoVentaDTO[]> {
    return this.http.post<PedidoVentaDTO[]>(
      this.ls.getUrlAccess('/document/getDocuments', _server),
      filtro,
    );
  }

  obtenerCampos(
    plantillaId: string,
    _server: string,
  ): Observable<DocumentoPlantillaDTO> {
    const dpFilter = new DocumentoPlantillaDTO();
    dpFilter.llaveTabla = plantillaId;
    return this.http.post<DocumentoPlantillaDTO>(
      this.ls.getUrlAccess('/rest/obtenerCampos', _server),
      dpFilter,
    );
  }

  consultarDocumento(
    documentoFiltro: PedidoVentaFilterDTO,
    _server: string,
  ): Observable<PedidoVentaDTO> {
    return this.http.post<PedidoVentaDTO>(
      this.ls.getUrlAccess('/rest/consultarDocumento', _server),
      documentoFiltro,
    );
  }

  validateBeforeNew(
    documentoFiltro: PedidoVentaFilterDTO,
    _server: string,
  ): Observable<PedidoVentaDTO> {
    return this.http.post<PedidoVentaDTO>(
      this.ls.getUrlAccess('/rest/validateBeforeNew', _server),
      documentoFiltro,
    );
  }

  guardarDocumento(
    documento: PedidoVentaDTO,
    _server: string,
    session: string,
  ): Observable<PedidoVentaDTO> {
    const headers = { 'non-duplicate': session };
    return this.http.post<PedidoVentaDTO>(
      this.ls.getUrlAccess('/rest/guardarDocumento', _server),
      documento,
      { headers },
    );
  }

  saveByMassive(
    documento: PedidoVentaDTO,
    _server: string,
    session: string,
  ): Observable<PedidoVentaDTO> {
    const headers = { 'non-duplicate': session };
    return this.http.post<PedidoVentaDTO>(
      this.ls.getUrlAccess('/rest/saveByMassive', _server),
      documento,
      { headers },
    );
  }

  verificarToken(
    usuario: UsuarioAutenticacionDTO,
  ): Observable<UsuarioAutenticacionDTO> {
    return this.http.post<UsuarioAutenticacionDTO>(
      this.ls.getUrlAccess('/user/dfa', null),
      usuario,
    );
  }

  consultarDatosBase(
    campo: PedidoVentaCaracteristicaFilterDTO,
    _server: string,
  ): Observable<PedidoVentaCaracteristicaFilterDTO> {
    const filter = new PedidoVentaCaracteristicaFilterDTO();
    filter.campo = campo.campo;
    filter.securityToken = campo.securityToken;
    filter.llaveTabla = campo.llaveTabla;
    filter.filtroParametro = campo.filtroParametro;
    filter.documento = campo.documento;
    filter.valorOpcion = campo.valorOpcion;
    filter.valorText = campo.valorText;
    filter.paginacionRegistroFinal = campo.paginacionRegistroFinal;
    filter.paginacionRegistroInicial = campo.paginacionRegistroInicial;
    filter.valorAuxiliar = campo.valorAuxiliar;
    filter.valorFechaMax = campo.valorFechaMax;
    filter.valorFechaMin = campo.valorFechaMin;
    filter.valorNumeroMax = campo.valorNumeroMax;
    filter.valorNumeroMin = campo.valorNumeroMin;

    if (campo.dependientes) {
      filter.dependientes = [];
      for (const element of campo.dependientes) {
        const newElement = new PedidoVentaCaracteristicaDTO();
        newElement.valorOpcion = element.valorOpcion;
        newElement.valorNumero = element.valorNumero;
        newElement.valorFecha = element.valorFecha;
        newElement.valorText = element.valorText;
        newElement.campo = element.campo;
        newElement.expedientes = element.expedientes;
        filter.dependientes.push(newElement);
      }
    }

    return this.http.post<PedidoVentaCaracteristicaFilterDTO>(
      this.ls.getUrlAccess('/rest/consultarDatosBase', _server),
      filter,
    );
  }

  ajustarEstado(
    ajuste: PedidoVentaAjusteDTO,
    _server: string,
  ): Observable<PedidoVentaAjusteDTO> {
    return this.http.post<PedidoVentaAjusteDTO>(
      this.ls.getUrlAccess('/rest/changeState', _server),
      ajuste,
    );
  }

  getTemplates(): DocumentoPlantillaDTO[] {
    return this.ls.getItem(LocalConstants.TEMPLATES) as DocumentoPlantillaDTO[];
  }

  getImage(imageUrl: string): Observable<Blob> {
    return this.http.get(imageUrl, { responseType: 'blob' });
  }

  uploadFile(
    fileToUpload: File,
    _server: string,
  ): Observable<ApiErrorResponse> {
    const endpoint = this.ls.getUrlAccess('/rest/upload', _server);
    const formData = new FormData();
    formData.append('file', fileToUpload, fileToUpload.name);
    return this.http.post<ApiErrorResponse>(endpoint, formData);
  }

  consultarInventario(
    productoId: string,
    _server: string,
  ): Observable<ProductoInventarioDTO[]> {
    return this.http.get<ProductoInventarioDTO[]>(
      this.ls.getUrlAccess(`/document/getInventory/${productoId}`, _server),
    );
  }

  getMessageInFiledProccess(
    property: string,
    value: string,
    _server: string | null = null,
  ): Observable<IdResponse> {
    return this.http.get<IdResponse>(
      this.ls.getUrlAccess(
        `/rest/getMessageToProcessField/${property}/${value}`,
        _server,
      ),
    );
  }

  searchUserByRol(query: string): Observable<UsuarioDTO> {
    return this.http.get<UsuarioDTO>(
      this.ls.getUrlAccess(`/user/document/${query}`),
    );
  }
}
