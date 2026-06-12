import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AuthService } from '../services/auth';

export const userResolver: ResolveFn<boolean> = (route, state) => {
  const authService = inject(AuthService);
  
  // Simulate network delay for fetching user profile/dashboard data
  // In a real app, this would be an HTTP call
  return of(true).pipe(delay(200));
};
