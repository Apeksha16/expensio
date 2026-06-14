import { Component, inject, signal } from '@angular/core';
import {
  Router,
  RouterModule,
  ChildrenOutletContexts,
  NavigationEnd,
  RouterOutlet,
} from '@angular/router';
import { CommonModule, DOCUMENT, Location } from '@angular/common';
import { slideInAnimation } from '../animations/route-animations';
import { AuthService } from '../services/auth.service';
import { PwaService } from '../services/pwa.service';
import { DomSanitizer } from '@angular/platform-browser';
import { BottomSheetComponent } from '../../shared/ui/bottom-sheet/bottom-sheet.component';
import { ConfirmSheetComponent } from '../../shared/ui/confirm-sheet/confirm-sheet.component';
import { BudgetSheetComponent } from '../../shared/ui/budget-sheet/budget-sheet.component';
import { FriendSheetComponent } from '../../shared/ui/friend-sheet/friend-sheet.component';
import { SplitSheetComponent } from '../../shared/ui/split-sheet/split-sheet.component';
import { GroupSheetComponent } from '../../shared/ui/group-sheet/group-sheet.component';
import { ExpenseService } from '../services/expense.service';
import { BudgetService } from '../services/budget.service';
import { ConfirmService } from '../services/confirm.service';
import { FriendService } from '../services/friend.service';
import { SplitService } from '../services/split.service';
import { ToastComponent } from '../../shared/ui/toast/toast.component';
import { MonthPickerComponent } from '../../shared/ui/month-picker/month-picker.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BottomSheetComponent,
    ConfirmSheetComponent,
    BudgetSheetComponent,
    FriendSheetComponent,
    SplitSheetComponent,
    GroupSheetComponent,
    ToastComponent,
    MonthPickerComponent,
  ],
  animations: [slideInAnimation],
  template: `
    <div class="h-full bg-gray-50 flex flex-col relative w-full overflow-hidden">
      <!-- Top Header -->
      <header
        class="fixed top-0 w-full bg-black z-30 flex items-center justify-between px-4 border-b-2 border-black h-14"
      >
        @if (isProfilePage()) {
          <button
            (click)="goBack()"
            class="p-2 -ml-2 text-gray-400 hover:text-white focus:outline-none transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        } @else {
          <button
            (click)="toggleSidebar(true)"
            class="p-2 -ml-2 text-gray-400 hover:text-white focus:outline-none transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        }
        <span class="text-lg font-extrabold tracking-tight text-white">{{ pageTitle() }}</span>
        <div class="w-8"></div>
        <!-- Spacer for centering -->
      </header>

      <!-- Sidebar Overlay -->
      @if (isSidebarOpen()) {
        <div
          (click)="toggleSidebar(false)"
          class="fixed inset-0 bg-black/40 z-40 transition-opacity"
        ></div>
      }

      <!-- Sidebar Drawer -->
      <aside
        class="fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out flex flex-col"
        [class.-translate-x-full]="!isSidebarOpen()"
        [class.translate-x-0]="isSidebarOpen()"
      >
        <div class="h-14 flex items-center px-6 border-b-2 border-black bg-gray-100">
          <span class="text-xl font-extrabold tracking-tight text-black">{{
            authService.userProfile().username
          }}</span>
        </div>

        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto overscroll-contain">
          @for (item of navItems; track item) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-black text-white"
              [routerLinkActiveOptions]="{ exact: false }"
              (click)="toggleSidebar(false)"
              class="flex items-center gap-3 px-3 py-2.5 rounded-none font-semibold transition-colors
                    text-gray-600 hover:bg-gray-50 hover:text-black"
            >
              <span
                [innerHTML]="item.icon"
                class="w-5 h-5"
                [ngClass]="{ 'text-current': true }"
              ></span>
              {{ item.name }}
            </a>
          }
        </nav>

        <div class="p-4 border-t-2 border-black">
          <button
            (click)="checkForUpdate()"
            class="flex items-center justify-center gap-2 w-full p-3 mb-3 font-extrabold text-black bg-white border-2 border-black hover:bg-black hover:text-white transition-colors rounded-none"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            CHECK FOR UPDATE
          </button>
          <button
            (click)="logout()"
            class="flex items-center justify-center gap-2 w-full p-3 font-extrabold text-white bg-red-600 border-2 border-red-600 hover:bg-red-700 hover:border-red-700 transition-colors rounded-none"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5.636 5.636a9 9 0 1012.728 0M12 3v9"
              />
            </svg>
            LOGOUT
          </button>
          <div class="mt-4 text-center">
            <span class="text-[10px] font-bold tracking-widest text-gray-400 uppercase"
              >Version 1.0.5</span
            >
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 relative pt-14 pb-16">
        <div [@routeAnimations]="getAnimationData()" class="h-full w-full">
          <router-outlet #outlet="outlet"></router-outlet>
        </div>
      </main>

      <!-- Bottom Navbar -->
      @if (!isProfilePage()) {
        <nav
          class="fixed left-4 right-4 bg-white border-2 border-black z-30 rounded-none overflow-hidden"
          style="bottom: 1.5rem;"
        >
          <div class="flex justify-between items-center h-16 w-full p-1.5 gap-1.5">
            @for (item of bottomNavItems; track item) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-black text-white"
                [routerLinkActiveOptions]="{ exact: false }"
                class="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-black hover:bg-gray-100 transition-colors rounded-none"
              >
                <span
                  [innerHTML]="item.icon"
                  class="w-6 h-6 mb-1"
                  [ngClass]="{ 'text-current': true }"
                ></span>
                <span class="text-[10px] font-bold">{{ item.name }}</span>
              </a>
            }
          </div>
        </nav>
      }

      <!-- Global Floating Action Button -->
      @if (!isProfilePage()) {
        <button
          (click)="handleFabClick()"
          class="fixed right-4 w-14 h-14 bg-black text-white border-2 border-black rounded-none flex items-center justify-center z-40 hover:bg-white hover:text-black transition-colors"
          style="bottom: 6rem;"
        >
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>
      }

      <!-- Global Sheets -->
      <app-bottom-sheet></app-bottom-sheet>
      <app-budget-sheet></app-budget-sheet>
      <app-confirm-sheet></app-confirm-sheet>
      <app-friend-sheet></app-friend-sheet>
      <app-split-sheet></app-split-sheet>
      <app-group-sheet></app-group-sheet>
      <app-month-picker></app-month-picker>

      <!-- Global Toasts -->
      <app-toast></app-toast>
    </div>
  `,
})
export class Layout {
  isSidebarOpen = signal(false);
  pageTitle = signal('Dashboard');
  authService = inject(AuthService);
  private confirmService = inject(ConfirmService);
  private router = inject(Router);
  private location = inject(Location);
  private sanitizer = inject(DomSanitizer);
  expenseService = inject(ExpenseService);
  budgetService = inject(BudgetService);
  friendService = inject(FriendService);
  splitService = inject(SplitService);
  pwaService = inject(PwaService);
  private document = inject(DOCUMENT);
  private contexts = inject(ChildrenOutletContexts);

  constructor() {
    this.updateTitle(this.router.url);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateTitle(event.urlAfterRedirects);
      }
    });
  }

  toggleSidebar(open: boolean) {
    this.isSidebarOpen.set(open);
    if (open) {
      this.document.body.classList.add('overflow-hidden');
    } else {
      this.document.body.classList.remove('overflow-hidden');
    }
  }

  checkForUpdate() {
    this.toggleSidebar(false);
    this.pwaService.checkForManualUpdate();
  }

  handleFabClick() {
    if (this.router.url.includes('/budgets')) {
      this.budgetService.openBottomSheet();
    } else if (this.router.url.includes('/friends')) {
      this.friendService.openAddSheet();
    } else if (this.router.url.includes('/splits')) {
      if (this.splitService.activeTab() === 'groups') {
        this.splitService.openGroupSheet();
      } else {
        this.splitService.openAddSplitSheet();
      }
    } else {
      this.expenseService.openBottomSheet();
    }
  }

  goBack() {
    this.location.back();
  }

  private updateTitle(url: string) {
    if (url.includes('/expenses')) this.pageTitle.set('Expenses');
    else if (url.includes('/budgets')) this.pageTitle.set('Budgets');
    else if (url.includes('/friends')) this.pageTitle.set('Friends');
    else if (url.includes('/splits')) this.pageTitle.set('Splits');
    else if (url.includes('/profile')) this.pageTitle.set('Profile');
    else this.pageTitle.set('Dashboard');
  }

  isProfilePage(): boolean {
    return this.router.url.includes('/profile');
  }

  get bottomNavItems() {
    return this.navItems.filter((item) => !item.hideFromBottomNav);
  }

  navItems: { name: string; path: string; icon: any; hideFromBottomNav?: boolean }[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: this.sanitizer.bypassSecurityTrustHtml(
        '<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>',
      ),
    },
    {
      name: 'Expenses',
      path: '/expenses',
      icon: this.sanitizer.bypassSecurityTrustHtml(
        '<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',
      ),
    },
    {
      name: 'Budgets',
      path: '/budgets',
      icon: this.sanitizer.bypassSecurityTrustHtml(
        '<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>',
      ),
    },
    {
      name: 'Friends',
      path: '/friends',
      icon: this.sanitizer.bypassSecurityTrustHtml(
        '<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>',
      ),
    },
    {
      name: 'Splits',
      path: '/splits',
      icon: this.sanitizer.bypassSecurityTrustHtml(
        '<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>',
      ),
    },
    {
      name: 'Profile',
      path: '/profile',
      hideFromBottomNav: true,
      icon: this.sanitizer.bypassSecurityTrustHtml(
        '<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>',
      ),
    },
  ];
  getAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animationIndex'];
  }

  logout() {
    this.confirmService.open({
      title: 'Logout',
      message: 'Are you sure you want to log out?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      onConfirm: () => {
        this.toggleSidebar(false);
        this.authService.logout();
        this.router.navigate(['/login']);
      },
    });
  }
}
