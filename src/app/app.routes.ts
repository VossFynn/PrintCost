import { Routes } from '@angular/router';

import { ShellComponent } from './shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'calculate',
    pathMatch: 'full'
  },
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: 'calculate',
        loadComponent: () => import('./features/calculate/calculate.component').then((m) => m.CalculateComponent)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory.component').then((m) => m.InventoryComponent)
      },
      {
        path: 'filaments',
        loadComponent: () => import('./features/filaments/filaments.component').then((m) => m.FilamentsComponent)
      },
      {
        path: 'more',
        loadComponent: () => import('./features/more/more.component').then((m) => m.MoreComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'calculate'
  }
];
