import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/accounting/accounting'),
  },
];

export default routes;
