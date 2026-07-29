import { provideServiceWorker } from '@angular/service-worker';
import { TranslocoHttpLoader } from '@/app/core/transloco/transloco-http-loader';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  ApplicationConfig,
  ErrorHandler,
  isDevMode,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import {
  provideClientHydration,
  withIncrementalHydration,
} from '@angular/platform-browser';
import {
  PreloadAllModules,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
} from '@angular/router';
import { provideIcons } from '@/app/core/icons/provider';
import { provideTheming } from '@/app/core/theming';
import { provideTransloco } from '@jsverse/transloco';
import { tokenInterceptor } from '@/app/shared/interceptors/token.interceptor';
import { errorInterceptor } from '@/app/shared/interceptors/error.interceptor';
import { ErrorHandlerService } from '@/app/shared/services/error-handler.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withFetch(),
      withInterceptors([tokenInterceptor, errorInterceptor]),
    ),
    provideClientHydration(withIncrementalHydration()),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withPreloading(PreloadAllModules),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),

    // Material
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline', subscriptSizing: 'dynamic' },
    },
    { provide: MAT_DATE_LOCALE, useValue: 'en-ZA' },
    provideNativeDateAdapter(),

    // Error handler
    { provide: ErrorHandler, useClass: ErrorHandlerService },

    // Core
    provideIcons(),
    provideTheming({
      scheme: 'system',
      primary: '#1565C0',
      error: '#dc2626',
    }),

    // Third-party
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),

    provideTransloco({
      config: {
        availableLangs: [
          { id: 'en', label: 'English' },
          { id: 'es', label: 'Español' },
        ],
        defaultLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
