import { Injectable, signal, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from './auth.service';

export interface NavItem {
  id: string;
  name: string;
  path: string;
  icon: SafeHtml;
  hideFromBottomNav?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class QuickActionsService {
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);

  readonly isSheetOpen = signal<boolean>(false);

  readonly navItems: NavItem[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      path: '/dashboard',
      icon: this.sanitizer.bypassSecurityTrustHtml(
        '<svg class="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" /><rect x="4" y="14" width="6" height="6" rx="1.5" /></svg>'
      ),
    },
    {
      id: 'expenses',
      name: 'Expenses',
      path: '/expenses',
      icon: this.sanitizer.bypassSecurityTrustHtml(
        '<svg class="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="16" cy="12" r="2" /></svg>'
      ),
    },
    {
      id: 'budgets',
      name: 'Budgets',
      path: '/budgets',
      icon: this.sanitizer.bypassSecurityTrustHtml(
        '<svg class="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.2 15.8A10 10 0 1 1 8.2 2.8" /><path d="M23 11A10 10 0 0 0 13 1v10z" /></svg>'
      ),
    },
    {
      id: 'friends',
      name: 'Friends',
      path: '/friends',
      icon: this.sanitizer.bypassSecurityTrustHtml(
        '<svg class="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>'
      ),
    },
    {
      id: 'splits',
      name: 'Splits',
      path: '/splits',
      icon: this.sanitizer.bypassSecurityTrustHtml(
        '<svg class="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>'
      ),
    },
    {
      id: 'subscriptions',
      name: 'Subscriptions',
      path: '/subscriptions',
      icon: this.sanitizer.bypassSecurityTrustHtml(
        '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>'
      ),
    },
    {
      id: 'goals',
      name: 'Goals',
      path: '/goals',
      icon: this.sanitizer.bypassSecurityTrustHtml(
        '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" /></svg>'
      ),
    },
    {
      id: 'ledger',
      name: 'Ledger',
      path: '/ledger',
      icon: this.sanitizer.bypassSecurityTrustHtml(
        '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>'
      ),
    },
    {
      id: 'reports',
      name: 'Reports',
      path: '/reports',
      icon: this.sanitizer.bypassSecurityTrustHtml(
        '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>'
      ),
    },
    {
      id: 'profile',
      name: 'Profile',
      path: '/profile',
      hideFromBottomNav: true,
      icon: this.sanitizer.bypassSecurityTrustHtml(
        '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>',
      ),
    },
  ];

  openSheet() {
    this.isSheetOpen.set(true);
  }

  closeSheet() {
    this.isSheetOpen.set(false);
  }
}
