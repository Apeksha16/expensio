import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';
import { onboardedGuard } from './core/guards/onboarded-guard';
import { userResolver } from './core/resolvers/user.resolver';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login),
    canActivate: [guestGuard],
    data: { animationIndex: 1 }
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./features/onboarding/onboarding').then(m => m.Onboarding),
    canActivate: [authGuard],
    resolve: { user: userResolver },
    data: { animationIndex: 2 }
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/layout').then(m => m.Layout),
    canActivate: [authGuard, onboardedGuard],
    resolve: { user: userResolver },
    data: { animationIndex: 3 },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard),
        data: { animationIndex: 1 }
      },
      {
        path: 'expenses',
        loadComponent: () => import('./features/expenses/expenses').then(m => m.Expenses),
        data: { animationIndex: 2 }
      },
      {
        path: 'budgets',
        loadComponent: () => import('./features/budgets/budgets').then(m => m.Budgets),
        data: { animationIndex: 3 }
      },
      {
        path: 'friends',
        loadComponent: () => import('./features/friends/friends').then(m => m.Friends),
        data: { animationIndex: 4 }
      },
      {
        path: 'splits',
        loadComponent: () => import('./features/splits/splits').then(m => m.Splits),
        data: { animationIndex: 5 }
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then(m => m.Profile),
        data: { animationIndex: 6 }
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
