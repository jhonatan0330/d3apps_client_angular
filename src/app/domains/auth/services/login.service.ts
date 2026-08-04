import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, throwError, catchError, switchMap } from 'rxjs';
import {
  PedidoVentaFilterDTO,
} from '@/app/domains/admin/modules/neuron/domain/sw42.domain';
import { ApiService } from '@/app/domains/admin/modules/neuron/services/api.service';
import { TemplateService } from '@/app/domains/admin/modules/neuron/services/template.service';
import {
  OrganizacionDTO,
  UsuarioAutenticacionAutorizacionDTO,
  UsuarioAutenticacionDTO,
  UsuarioAutenticacionFilterDTO,
  UsuarioDTO,
  UsuarioOrganizacionDTO,
} from '@/app/domains/auth/domain/auth.domain';
import { PlantillaHelper } from '@/app/shared/domain/plantilla-helper';
import { LocalConstants, LocalStoreService } from '@/app/shared/services/local-store.service';
import { NotificationsService } from '@/app/shared/services/notifications.service';
import { TokenService } from './token.service';
import { OrganizationService } from './organization.service';
import { environment } from '@/environments/environment';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly ls = inject(LocalStoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly templateService = inject(TemplateService);
  private readonly notificationService = inject(NotificationsService);
  private readonly apiService = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly orgService = inject(OrganizationService);

  private _isAuthenticated = false;
  returnPath: string | undefined;

  readonly user = this.tokenService.user;
  readonly company = this.orgService.company;
  readonly isAdmin = this.orgService.isAdmin;
  readonly isReader = this.orgService.isReader;
  readonly slides = this.orgService.slides;
  readonly landing = this.orgService.landing;
  readonly headerSection = this.orgService.headerSection;
  readonly currentDate = signal<Date | null>(null);

  get token(): string | null {
    return this.tokenService.token;
  }

  set token(value: string | null) {
    this.tokenService.token = value;
  }

  get urlService(): string | null {
    return this.orgService.getConfUrl() as string | null;
  }

  set urlService(value: string | null) {
    if (value) this.orgService.setConfUrl(value);
  }

  readonly isLoggedIn = computed(() => {
    if (!this.tokenService.token) this.tokenService.token = this.tokenService.getJwtToken() as string | null;
    if (!this.tokenService.token) return false;
    const url = this.orgService.getConfUrl() as string | null;
    return !!url;
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
      const _user = this.tokenService.getUser();
      if (_user) autenticacion.usuario = (_user as UsuarioDTO).llaveTabla;
      autenticacion.securityToken = tokenAuto;
    }

    return this.http
      .post<UsuarioAutenticacionDTO>(
        this.orgService.getUrlAccess('/main/autenticarUsuarioAutenticacion'),
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
    this.tokenService.setTokenAndUser(res.token, res.usuarioDTO);
    this.orgService.setCompany(res.organizacion, true);
    this.getUserDataFull(res);
    if (res) {
      this.setDate(res.fechaMaxima);
    } else {
      this.clearDate();
    }
  }

  isTokenExpired(token: string): boolean {
    return this.tokenService.isTokenExpired(token);
  }

  checkTokenIsValid(): Observable<boolean> {
    const tokenLocal = this.tokenService.getJwtToken();
    if (!tokenLocal) return of(false);
    if (this.tokenService.isTokenExpired(tokenLocal as string)) {
      this.signout();
      return of(false);
    }
    const url = this.orgService.getConfUrl() as string | null;
    if (!url) return of(false);
    if (this._isAuthenticated) return of(true);

    const autenticacion = new UsuarioAutenticacionFilterDTO();
    autenticacion.claveAnterior = environment.dateCompile;
    autenticacion.securityToken = tokenLocal as string;

    return this.http
      .post<UsuarioAutenticacionDTO>(
        this.orgService.getUrlAccess('/main/checkToken'),
        autenticacion,
      )
      .pipe(
        switchMap((profile: UsuarioAutenticacionDTO) => {
          if (!profile) return of(false);
          return this.signin(null, null, tokenLocal as string).pipe(
            switchMap((data: UsuarioAutenticacionDTO | null) => {
              if (data) this.authenticationOK(data);
              return of(!!data);
            }),
          );
        }),
        catchError(() => {
          if (!this._isAuthenticated) {
            this.signout();
          }
          return of(false);
        }),
      );
  }

  private getUserDataFull(response: UsuarioAutenticacionDTO): void {
    this.tokenService.token = response.token;
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
    this._isAuthenticated = false;
    this.tokenService.clear();
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
      this.orgService.getUrlAccess('/main/cambiarClave'),
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
      this.orgService.getUrlAccess('/main/cambiarClave'),
      autenticacion,
    );
  }

  changePwdOtherSystem(
    autenticacion: UsuarioOrganizacionDTO,
  ): Observable<UsuarioOrganizacionDTO> {
    return this.http.post<UsuarioOrganizacionDTO>(
      this.orgService.getUrlAccess('/main/cambiarClaveOtherSystem'),
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
      this.orgService.getUrlAccess('/main/solicitarNuevaClave'),
      autenticacion,
    );
  }

  getJwtToken(): unknown {
    return this.tokenService.getJwtToken();
  }

  getConfUrl(): unknown {
    return this.orgService.getConfUrl();
  }

  getUser(): unknown {
    return this.tokenService.getUser();
  }

  setUserAndToken(
    authDTO: UsuarioAutenticacionDTO | null,
    _company: OrganizacionDTO | null,
  ): void {
    if (authDTO) {
      this._isAuthenticated = true;
      this.tokenService.setTokenAndUser(authDTO.token, authDTO.usuarioDTO);
    } else {
      this._isAuthenticated = false;
      this.tokenService.clear();
    }

    this.orgService.setCompany(_company, this._isAuthenticated);
  }

  setConfUrl(url: string): void {
    this.orgService.setConfUrl(url);
  }

  obtenerPrincipalOrganizacion(): Observable<OrganizacionDTO> {
    return this.orgService.obtenerPrincipalOrganizacion();
  }

  private getURL(): Observable<string> {
    return this.http.get('/conf.xml', { responseType: 'text' }) as Observable<string>;
  }

  changePictureUser(fileToUpload: File, _server: string): Observable<UsuarioDTO> {
    const endpoint = this.orgService.getUrlAccess('/rest/changePicture', _server);
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
    this.orgService.setCompany(organization, this._isAuthenticated);
    if (!this._isAuthenticated && organization?.publicToken) {
      const existingToken = this.tokenService.getJwtToken() as string | null;
      if (existingToken && !this.tokenService.isTokenExpired(existingToken)) {
        this.tokenService.token = existingToken;
        return;
      }
      this.tokenService.token = organization.publicToken;
      this.tokenService.setToken(organization.publicToken);
      this.checkTokenIsValid().subscribe();
    }
  }

  validateAccessModule(pModuleKey: string): boolean {
    return this.orgService.validateAccessModule(pModuleKey);
  }
}
