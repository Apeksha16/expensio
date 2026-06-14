import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { onboardedGuard } from './core/guards/onboarded.guard';
import { userResolver } from './core/resolvers/user.resolver';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/components/enter-email.component').then(m => m.EnterEmailComponent),
    canActivate: [guestGuard],
    data: { animationIndex: 1 }
  },
  {
    path: 'mpin',
    loadComponent: () => import('./features/auth/login/components/mpin-flow.component').then(m => m.MpinFlowComponent),
    canActivate: [guestGuard],
    data: { animationIndex: 2 }
  },
  {
    path: 'forgot',
    loadComponent: () => import('./features/auth/login/components/mpin-flow.component').then(m => m.MpinFlowComponent),
    canActivate: [guestGuard],
    data: { animationIndex: 3 }
  },
  {
    path: 'reset',
    loadComponent: () => import('./features/auth/login/components/mpin-flow.component').then(m => m.MpinFlowComponent),
    canActivate: [guestGuard],
    data: { animationIndex: 4 }
  },
  {
    path: 'set-mpin',
    loadComponent: () => import('./features/auth/login/components/mpin-flow.component').then(m => m.MpinFlowComponent),
    canActivate: [guestGuard],
    data: { animationIndex: 5 }
  },
  {
    path: 'confirm-mpin',
    loadComponent: () => import('./features/auth/login/components/mpin-flow.component').then(m => m.MpinFlowComponent),
    canActivate: [guestGuard],
    data: { animationIndex: 6 }
  },
  {
    path: 'onboarding-profile',
    loadComponent: () => import('./features/auth/login/components/onboarding-profile.component').then(m => m.OnboardingProfileComponent),
    canActivate: [guestGuard],
    data: { animationIndex: 7 }
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/layout.component').then(m => m.Layout),
    canActivate: [authGuard, onboardedGuard],
    resolve: { user: userResolver },
    data: { animationIndex: 8 },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.Dashboard),
        data: { animationIndex: 1 }
      },
      {
        path: 'expenses',
        loadComponent: () => import('./features/expenses/expenses.component').then(m => m.Expenses),
        data: { animationIndex: 2 }
      },
      {
        path: 'budgets',
        loadComponent: () => import('./features/budgets/budgets.component').then(m => m.Budgets),
        data: { animationIndex: 3 }
      },
      {
        path: 'friends',
        loadComponent: () => import('./features/friends/friends.component').then(m => m.Friends),
        data: { animationIndex: 4 }
      },
      {
        path: 'splits',
        loadComponent: () => import('./features/splits/splits.component').then(m => m.Splits),
        data: { animationIndex: 5 }
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.Profile),
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
