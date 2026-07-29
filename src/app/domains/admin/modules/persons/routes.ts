import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/persons-list/persons-list'),
  },
  {
    path: ':id',
    loadComponent: () => import('./features/persons-list/persons-list'),
  },
];

export default routes;
