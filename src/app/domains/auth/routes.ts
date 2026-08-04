import { Routes } from '@angular/router';
import { redirectIfAuthenticated } from '@/app/shared/guards/redirect-if-authenticated.guard';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout'),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'sign-in',
      },
      {
        path: 'sign-in',
        loadComponent: () => import('./features/sign-in/sign-in'),
        canActivate: [redirectIfAuthenticated],
      },
      {
        path: 'sign-up',
        loadComponent: () => import('./features/sign-up/sign-up'),
        canActivate: [redirectIfAuthenticated],
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/forgot-password/forgot-password'),
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/reset-password/reset-password'),
      },
      {
        path: 'new-password/:id',
        loadComponent: () => import('./features/reset-password/reset-password'),
      },
    ],
  },
];

export default routes;
