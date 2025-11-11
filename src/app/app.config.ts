import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter,withViewTransitions } from '@angular/router';
import { withInterceptors, provideHttpClient } from '@angular/common/http'; // 👈 importante
import { routes } from './app.routes';
import { LoadingInterceptor } from './core/loading.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([LoadingInterceptor])), 
  ]
};
