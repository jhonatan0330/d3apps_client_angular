import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: ':type/:id',
    loadComponent: () => import('./features/crud-list/crud-list'),
  },
  {
    path: ':type/:id/:server_id',
    loadComponent: () => import('./features/crud-list/crud-list'),
  },
];

export default routes;
