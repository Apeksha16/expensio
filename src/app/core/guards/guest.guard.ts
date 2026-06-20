import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isInitialized()) {
    if (!authService.isAuthenticated()) {
      return true;
    }
    return router.parseUrl('/dashboard');
  }

  return toObservable(authService.isInitialized).pipe(
    filter((isInit) => isInit),
    take(1),
    map(() => {
      if (!authService.isAuthenticated()) {
        return true;
      }
      return router.parseUrl('/dashboard');
    })
  );
};
