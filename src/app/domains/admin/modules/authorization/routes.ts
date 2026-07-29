import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/dashboard/dashboard'),
  },
  {
    path: ':type',
    loadComponent: () => import('./features/dashboard/dashboard'),
  },
  {
    path: ':type/:id',
    loadComponent: () => import('./features/dashboard/dashboard'),
  },
];

export default routes;
