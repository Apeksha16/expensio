import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // User is authenticated, check where to send them
  if (authService.isOnboarded()) {
    return router.parseUrl('/dashboard');
  } else {
    return router.parseUrl('/onboarding');
  }
};
