import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'form',
    loadComponent: () => import('./features/form/form'),
  },
];

export default routes;
