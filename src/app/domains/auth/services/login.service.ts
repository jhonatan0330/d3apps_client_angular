import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable, of, throwError, catchError, map } from 'rxjs';
import { LocalConstants, LocalStoreService } from '@/app/shared/services/local-store.service';
import { TemplateService } from '@/app/domains/admin/modules/neuron/services/template.service';
import { NotificationsService } from '@/app/shared/services/notifications.service';
import { ApiService } from '@/app/domains/admin/modules/neuron/services/api.service';
import {
  OrganizacionDTO,
  UsuarioAutenticacionAutorizacionDTO,
  UsuarioAutenticacionDTO,
  UsuarioAutenticacionFilterDTO,
  UsuarioDTO,
  UsuarioOrganizacionDTO,
} from '@/app/domains/auth/domain/auth.domain';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';
import {
  PedidoVentaDTO,
  PedidoVentaFilterDTO,
} from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { PropiedadDTO } from '@/app/shared/domain/shared.domain';
import { environment } from '@/environments/environment';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly ls = inject(LocalStoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly domSanitizer = inject(DomSanitizer);
  private readonly templateService = inject(TemplateService);
  private readonly notificationService = inject(NotificationsService);
  private readonly apiService = inject(ApiService);
  private readonly http = inject(HttpClient);

  // Signals
  token: string | null = null;
  urlService: string | null = null;
  private _isAuthenticated = false;
  returnPath: string | undefined;

  readonly user = signal<UsuarioDTO | null>(null);
  readonly company = signal<OrganizacionDTO | null>(null);
  readonly isAdmin = signal(false);
  readonly isReader = signal(false);
  readonly slides = signal<string[]>([]);
  readonly landing = signal<SafeHtml[]>([]);
  readonly headerSection = signal<SafeHtml[]>([]);
  readonly currentDate = signal<Date | null>(null);

  // Computed
  readonly isLoggedIn = computed(() => {
    if (!this.token) this.token = this.getJwtToken() as string | null;
    if (!this.token) return false;
    if (!this.urlService) this.urlService = this.getConfUrl() as string | null;
    return !!this.urlService;
  });

  constructor() {
    this.route.queryParams.subscribe(
      (params) => (this.returnPath = params['return'] || '/'),
    );
  }

  setDate(date: Date | string | null): void {
    if (!date) {
      this.currentDate.set(null);
      return;
    }
    this.currentDate.set(date instanceof Date ? date : new Date(date));
  }

  clearDate(): void {
    this.currentDate.set(null);
  }

  signin(
    username: string | null,
    password: string | null,
    tokenAuto: string | null,
  ): Observable<UsuarioAutenticacionDTO | null> {
    const autenticacion = new UsuarioAutenticacionFilterDTO();
    autenticacion.sesion = username ?? undefined as unknown as string;
    autenticacion.clave = password ?? undefined as unknown as string;
    autenticacion.claveAnterior = environment.dateCompile;

    if (username === null && password === null) {
      if (!tokenAuto) return of(null);
      const _user = this.getUser();
      if (_user) autenticacion.usuario = (_user as UsuarioDTO).llaveTabla;
      autenticacion.securityToken = tokenAuto;
    }

    return this.http
      .post<UsuarioAutenticacionDTO>(
        this.ls.getUrlAccess('/main/autenticarUsuarioAutenticacion'),
        autenticacion,
      )
      .pipe(
        catchError((error) => {
          this.signout();
          return throwError(() => error);
        }),
      );
  }

  authenticationOK(res: UsuarioAutenticacionDTO): void {
    this._isAuthenticated = true;
    this.setUserAndToken(res, res.organizacion);
    this.setCompany(res.organizacion);
    this.getUserDataFull(res);
    if (res) {
      this.setDate(res.fechaMaxima);
    } else {
      this.clearDate();
    }
  }

  private setCompany(_company: OrganizacionDTO | null): void {
    if (_company) {
      this.getCarrousel(_company);
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

  private getCarrousel(_company: OrganizacionDTO): void {
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
        this._isAuthenticated
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
          newLanding.push(
            this.domSanitizer.bypassSecurityTrustHtml(element.valor),
          );
        });
      }

      const _iFooters = PlantillaHelper.buscarValorMultiple(
        _company.propiedades,
        PlantillaHelper.HEADER_PAGE,
      );
      if (_iFooters && _iFooters.length !== 0) {
        _iFooters.forEach((element: PropiedadDTO) => {
          newHeader.push(
            this.domSanitizer.bypassSecurityTrustHtml(element.valor),
          );
        });
      }
    }

    this.slides.set(newSlides);
    this.landing.set(newLanding);
    this.headerSection.set(newHeader);
  }

  checkTokenIsValid(): Observable<boolean> {
    const tokenLocal = this.getJwtToken();
    if (!tokenLocal) return of(false);
    if (!this.urlService) {
      this.urlService = this.getConfUrl() as string | null;
    }
    if (!this.urlService) return of(false);
    if (this._isAuthenticated) return of(true);

    const autenticacion = new UsuarioAutenticacionFilterDTO();
    autenticacion.claveAnterior = environment.dateCompile;
    autenticacion.securityToken = tokenLocal as string;

    return this.http
      .post<UsuarioAutenticacionDTO>(
        this.ls.getUrlAccess('/main/checkToken'),
        autenticacion,
      )
      .pipe(
        map((profile: UsuarioAutenticacionDTO) => {
          this.signin(null, null, tokenLocal as string).subscribe({
            next: (data) => {
              if (data) this.authenticationOK(data);
            },
          });
          return !!profile;
        }),
        catchError(() => {
          this.signout();
          return of(false);
        }),
      );
  }

  private getUserDataFull(response: UsuarioAutenticacionDTO): void {
    this.token = response.token;
    this._isAuthenticated = true;

    if (response?.mensaje) {
      this.snackBar.open(response.mensaje, 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
    }

    this.apiService.listarPlantillas('USER').subscribe((templates) => {
      this.templateService.setTemplates(templates);
    });
  }

  signout(): void {
    this.setUserAndToken(null, null);
    this.templateService.clear();
    this.notificationService.clear();
    this.router.navigate(['/auth/sign-in']);
    this.getOrganization();
  }

  changePwd(oldPwd: string, newPwd: string, autorizacion: string): Observable<UsuarioAutenticacionDTO> {
    const autenticacion = new UsuarioAutenticacionDTO();
    autenticacion.llaveTabla = autorizacion;
    autenticacion.usuario = this.user()?.llaveTabla ?? '';
    autenticacion.claveAnterior = oldPwd;
    autenticacion.clave = newPwd;
    return this.http.post<UsuarioAutenticacionDTO>(
      this.ls.getUrlAccess('/main/cambiarClave'),
      autenticacion,
    );
  }

  changePwdOther(
    user: string,
    oldPwd: string,
    newPwd: string,
    autorizacion: string,
  ): Observable<UsuarioAutenticacionDTO> {
    const autenticacion = new UsuarioAutenticacionDTO();
    autenticacion.llaveTabla = autorizacion;
    autenticacion.usuario = user;
    autenticacion.claveAnterior = oldPwd;
    autenticacion.clave = newPwd;
    return this.http.post<UsuarioAutenticacionDTO>(
      this.ls.getUrlAccess('/main/cambiarClave'),
      autenticacion,
    );
  }

  changePwdOtherSystem(
    autenticacion: UsuarioOrganizacionDTO,
  ): Observable<UsuarioOrganizacionDTO> {
    return this.http.post<UsuarioOrganizacionDTO>(
      this.ls.getUrlAccess('/main/cambiarClaveOtherSystem'),
      autenticacion,
    );
  }

  recoverPassword(
    identificacion: string,
    correo: string,
  ): Observable<UsuarioAutenticacionAutorizacionDTO> {
    const autenticacion = new UsuarioAutenticacionDTO();
    autenticacion.usuarioDTO = new UsuarioDTO();
    autenticacion.usuarioDTO.identificacion = identificacion;
    autenticacion.usuarioDTO.correo = correo;
    return this.http.post<UsuarioAutenticacionAutorizacionDTO>(
      this.ls.getUrlAccess('/main/solicitarNuevaClave'),
      autenticacion,
    );
  }

  getJwtToken(): unknown {
    return this.ls.getItem(LocalConstants.JWT_TOKEN);
  }

  getConfUrl(): unknown {
    return this.ls.getItem(LocalConstants.URL_CONF);
  }

  getUser(): unknown {
    return this.ls.getItem(LocalConstants.APP_USER);
  }

  setUserAndToken(
    authDTO: UsuarioAutenticacionDTO | null,
    _company: OrganizacionDTO | null,
  ): void {
    if (authDTO) {
      this._isAuthenticated = true;
      this.token = authDTO.token;
      this.user.set(authDTO.usuarioDTO);
    } else {
      this._isAuthenticated = false;
      this.token = null;
      this.user.set(null);
    }

    this.ls.setItem(LocalConstants.JWT_TOKEN, this.token);
    this.ls.setItem(LocalConstants.APP_USER, this.user());
  }

  setConfUrl(url: string): void {
    if (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
    this.urlService = url;
    this.ls.setItem(LocalConstants.URL_CONF, url);
  }

  obtenerPrincipalOrganizacion(): Observable<OrganizacionDTO> {
    return this.http.get<OrganizacionDTO>(
      this.ls.getUrlAccess('/main/obtenerPrincipalOrganizacion'),
    );
  }

  private getURL(): Observable<string> {
    return this.http.get('/conf.xml', { responseType: 'text' }) as Observable<string>;
  }

  changePictureUser(fileToUpload: File, _server: string): Observable<UsuarioDTO> {
    const endpoint = this.ls.getUrlAccess('/rest/changePicture', _server);
    const formData = new FormData();
    formData.append('file', fileToUpload, fileToUpload.name);
    return this.http.post<UsuarioDTO>(endpoint, formData);
  }

  getUrlServices(): void {
    if (this.company()?.llaveTabla) {
      this.configureOrganization(this.company()!);
      return;
    }
    this.getURL().subscribe({
      next: (data) => {
        if (data !== '' && data !== 'SW42') {
          if (!data.endsWith('/')) data = data + '/';
          this.setConfUrl(data);
        } else {
          this.setConfUrl(location.origin);
        }
        this.getOrganization();
      },
      error: () => {
        this.setConfUrl(location.origin);
        this.getOrganization();
      },
    });
  }

  getOrganization(): void {
    this.obtenerPrincipalOrganizacion().subscribe({
      next: (organization) => this.configureOrganization(organization),
      error: () => {},
    });
  }

  configureOrganization(organization: OrganizacionDTO): void {
    this.setCompany(organization);
    if (organization?.publicToken) {
      this.token = organization.publicToken;
      this.ls.setItem(LocalConstants.JWT_TOKEN, organization.publicToken);
      this.checkTokenIsValid().subscribe();
    }
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
