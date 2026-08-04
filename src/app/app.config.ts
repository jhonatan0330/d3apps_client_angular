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
  APP_INITIALIZER,
} from '@angular/core';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import {
  provideClientHydration,
  withIncrementalHydration,
} from '@angular/platform-browser';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideTransloco } from '@jsverse/transloco';
import { provideIcons } from '@/app/core/icons/provider';
import { provideTheming } from '@/app/core/theming';
import { TranslocoHttpLoader } from '@/app/core/transloco/transloco-http-loader';
import { errorInterceptor } from '@/app/shared/interceptors/error.interceptor';
import { tokenInterceptor } from '@/app/shared/interceptors/token.interceptor';
import { dateConversionInterceptor } from '@/app/shared/interceptors/date-conversion.interceptor';
import { ErrorHandlerService } from '@/app/shared/services/error-handler.service';
import { initializeApp } from './app.initializer';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true,
    },
    provideHttpClient(
      withFetch(),
      withInterceptors([tokenInterceptor, dateConversionInterceptor, errorInterceptor]),
    ),
    provideClientHydration(withIncrementalHydration()),
    provideRouter(
      routes,
      withComponentInputBinding(),
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
