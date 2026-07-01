import { Component, inject, signal, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { KeyboardService } from '../services/keyboard.service';
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
import { QuickActionsService } from '../services/quick-actions.service';
import { QuickActionsSheetComponent } from '../../shared/ui/quick-actions-sheet/quick-actions-sheet.component';
import { SubscriptionService } from '../services/subscription.service';
import { SubscriptionSheetComponent } from '../../shared/ui/subscription-sheet/subscription-sheet.component';
import { GoalService } from '../services/goal.service';
import { GoalSheetComponent } from '../../shared/ui/goal-sheet/goal-sheet.component';
import { AddFundsSheetComponent } from '../../shared/ui/add-funds-sheet/add-funds-sheet.component';
import { LedgerService } from '../services/ledger.service';
import { LedgerSheetComponent } from '../../shared/ui/ledger-sheet/ledger-sheet.component';
import { LedgerSubSheetComponent } from '../../shared/ui/ledger-sub-sheet/ledger-sub-sheet.component';

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
    QuickActionsSheetComponent,
    SubscriptionSheetComponent,
    GoalSheetComponent,
    AddFundsSheetComponent,
    LedgerSheetComponent,
    LedgerSubSheetComponent
  ],
  animations: [slideInAnimation],
  template: `
    <div class="h-full bg-gray-50 flex flex-col relative w-full overflow-hidden">
      <!-- Global hidden input for iOS keyboard hack -->
      <input #globalHiddenInput type="text" class="fixed opacity-0 pointer-events-none -z-50 -left-[9999px] -top-[9999px]" />

      <!-- Top Header -->
      <header
        class="fixed top-0 w-full z-30 flex items-center justify-between px-4 h-14 transition-colors duration-300"
        [ngClass]="getThemeClasses().bg"
      >
        @if (isProfilePage() || isGroupExpensesPage() || isBudgetExpensesPage() || isGoalTransactionsPage() || isLedgerDetailsPage()) {
          <button
            (click)="goBack()"
            class="p-2 -ml-2 text-white/80 hover:text-white focus:outline-none transition-colors"
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
            class="p-2 -ml-2 text-white/80 hover:text-white focus:outline-none transition-colors"
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
        <span class="text-lg font-extrabold tracking-tight text-white truncate max-w-[200px] text-center">{{ pageTitle() }}</span>
        
        @if (isGroupExpensesPage()) {
          <button
            (click)="editGroup()"
            class="p-2 -mr-2 text-white/80 hover:text-white focus:outline-none transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5z" />
            </svg>
          </button>
        } @else if (isBudgetExpensesPage() && !isVirtualOthersBudget()) {
          <button
            (click)="editBudget()"
            class="p-2 -mr-2 text-white/80 hover:text-white focus:outline-none transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5z" />
            </svg>
          </button>
        } @else if (isGoalTransactionsPage()) {
          <button
            (click)="editGoal()"
            class="p-2 -mr-2 text-white/80 hover:text-white focus:outline-none transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5z" />
            </svg>
          </button>
        } @else if (isLedgerDetailsPage()) {
          <button
            (click)="editLedger()"
            class="p-2 -mr-2 text-white/80 hover:text-white focus:outline-none transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5z" />
            </svg>
          </button>
        } @else {
          <div class="w-8"></div>
        }
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

        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto overscroll-none">
          @for (item of navItems; track item) {
            <a
              [routerLink]="item.path"
              [routerLinkActive]="getActiveClasses(item.id)"
              [routerLinkActiveOptions]="{ exact: false }"
              (click)="toggleSidebar(false)"
              class="flex items-center gap-3 px-3 py-2.5 rounded-none font-semibold transition-colors border-l-4 border-transparent text-gray-600 hover:bg-gray-100 hover:text-black"
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

        <div class="p-4 border-t-2 border-black mt-auto flex items-center justify-between bg-white">
          <span class="text-[10px] font-extrabold tracking-widest text-gray-400 uppercase">
            v1.0.25
          </span>
          <div class="flex gap-3">
            <button
              (click)="checkForUpdate()"
              title="Check for update"
              class="p-3 text-gray-600 bg-gray-100 hover:bg-black hover:text-white transition-colors rounded-none"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              (click)="logout()"
              title="Logout"
              class="p-3 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-colors rounded-none"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
              </svg>
            </button>
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
            @for (item of bottomNavItems(); track item.id) {
              <a
                [routerLink]="item.path"
                [routerLinkActive]="getActiveClasses(item.id)"
                [routerLinkActiveOptions]="{ exact: false }"
                class="flex items-center justify-center w-full h-full text-gray-500 hover:text-black hover:bg-gray-100 transition-colors rounded-none"
              >
                <span
                  [innerHTML]="item.icon"
                  class="w-7 h-7"
                  [ngClass]="{ 'text-current': true }"
                ></span>
              </a>
            }
          </div>
        </nav>
      }

      <!-- Global Floating Action Button -->
      @if (!isProfilePage() && !isDashboardPage() && !isReportsPage()) {
        <button
          (click)="handleFabClick()"
          class="fixed right-4 w-14 h-14 text-white rounded-none flex items-center justify-center z-40 hover:bg-white transition-colors duration-300"
          [ngClass]="getThemeClasses().bg + ' hover:' + getThemeClasses().text"
          style="bottom: 6.5rem;"
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
      <app-quick-actions-sheet></app-quick-actions-sheet>
      <app-subscription-sheet></app-subscription-sheet>
      <app-goal-sheet></app-goal-sheet>
      <app-add-funds-sheet></app-add-funds-sheet>
      <app-ledger-sheet></app-ledger-sheet>
      <app-ledger-sub-sheet></app-ledger-sub-sheet>

      <!-- Global Toasts -->
      <app-toast></app-toast>
    </div>
  `,
})
export class Layout implements AfterViewInit {
  isSidebarOpen = signal(false);
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
  private keyboardService = inject(KeyboardService);
  quickActionsService = inject(QuickActionsService);
  subscriptionService = inject(SubscriptionService);
  goalService = inject(GoalService);
  ledgerService = inject(LedgerService);

  currentUrl = signal(this.router.url);

  isProfilePage = computed(() => this.currentUrl().includes('/profile'));
  isDashboardPage = computed(() => this.currentUrl().includes('/dashboard') || this.currentUrl() === '/');
  isGroupExpensesPage = computed(() => this.currentUrl().includes('/splits/group/'));
  isBudgetExpensesPage = computed(() => this.currentUrl().match(/\/budgets\/.+/) !== null);
  isGoalTransactionsPage = computed(() => this.currentUrl().match(/\/goals\/.+/) !== null);
  isLedgerDetailsPage = computed(() => this.currentUrl().match(/\/ledger\/.+/) !== null);
  isReportsPage = computed(() => this.currentUrl().includes('/reports'));

  activeLedger = computed(() => {
    if (this.isLedgerDetailsPage()) {
      const match = this.currentUrl().match(/\/ledger\/(.+)/);
      const id = match ? match[1] : null;
      if (id) {
        return this.ledgerService.ledgerEntries().find(e => e.id === id);
      }
    }
    return null;
  });

  isVirtualOthersBudget = computed(() => {
    if (!this.isBudgetExpensesPage()) return false;
    const match = this.currentUrl().match(/\/budgets\/(.+)/);
    const name = match ? decodeURIComponent(match[1]) : null;
    if (name) {
      const budget = this.budgetService.budgets().find((b) => b.name === name);
      return budget ? budget.id === 'virtual-others' : false;
    }
    return false;
  });

  activeGroup = computed(() => {
    if (this.isGroupExpensesPage()) {
      const match = this.currentUrl().match(/\/splits\/group\/(.+)/);
      const id = match ? match[1] : null;
      if (id) {
        return this.splitService.groups().find(g => g.id === id);
      }
    }
    return null;
  });

  activeGoal = computed(() => {
    if (this.isGoalTransactionsPage()) {
      const match = this.currentUrl().match(/\/goals\/(.+)/);
      const id = match ? match[1] : null;
      if (id) {
        return this.goalService.goals().find(g => g.id === id);
      }
    }
    return null;
  });

  pageTitle = computed(() => {
    const url = this.currentUrl();
    if (this.isBudgetExpensesPage()) {
      const match = url.match(/\/budgets\/(.+)/);
      return match ? decodeURIComponent(match[1]) : 'Budget Details';
    }
    if (url.includes('/expenses')) return 'Expenses';
    if (url.includes('/budgets')) return 'Budgets';
    if (url.includes('/friends')) return 'Friends';
    if (this.isGroupExpensesPage()) {
       return this.activeGroup()?.name || 'Loading...';
    }
    if (this.isGoalTransactionsPage()) {
       return this.activeGoal()?.name || 'Loading...';
    }
    if (this.isLedgerDetailsPage()) {
       return this.activeLedger()?.person_name || 'Loading...';
    }
    if (url.includes('/splits')) return 'Splits';
    if (url.includes('/subscriptions')) return 'Subscriptions';
    if (url.includes('/goals')) return 'Goals';
    if (url.includes('/ledger')) return 'Private Ledger';
    if (url.includes('/reports')) return 'Reports';
    if (url.includes('/profile')) return 'Profile';
    return 'Dashboard';
  });

  @ViewChild('globalHiddenInput') globalHiddenInput!: ElementRef<HTMLInputElement>;

  ngAfterViewInit() {
    if (this.globalHiddenInput) {
      this.keyboardService.registerInput(this.globalHiddenInput.nativeElement);
    }
  }

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects);
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
    let shouldOpenKeyboard = true;

    if (this.currentUrl().includes('/splits') || this.isGroupExpensesPage()) {
      if (this.friendService.acceptedFriends().length === 0) {
        shouldOpenKeyboard = false;
      }
    }

    if (shouldOpenKeyboard) {
      this.keyboardService.openKeyboardSync();
    }
    
    if (this.currentUrl().includes('/budgets')) {
      this.budgetService.openBottomSheet();
    } else if (this.currentUrl().includes('/friends')) {
      this.friendService.openAddSheet();
    } else if (this.isGroupExpensesPage()) {
      const match = this.currentUrl().match(/\/splits\/group\/(.+)/);
      const groupId = match ? match[1] : null;
      this.splitService.openAddSplitSheet({ group_id: groupId } as any);
    } else if (this.currentUrl().includes('/splits')) {
      if (this.splitService.activeTab() === 'groups') {
        this.splitService.openGroupSheet();
      } else {
        this.splitService.openAddSplitSheet();
      }
    } else if (this.currentUrl().includes('/subscriptions')) {
      this.subscriptionService.openBottomSheet();
    } else if (this.isLedgerDetailsPage()) {
      const ledger = this.activeLedger();
      if (ledger) {
        this.ledgerService.openSubBottomSheet(ledger);
      }
    } else if (this.isGoalTransactionsPage()) {
      const goal = this.activeGoal();
      if (goal) {
        this.goalService.openAddFundsSheet(goal);
      }
    } else if (this.currentUrl().includes('/goals')) {
      this.goalService.openBottomSheet();
    } else if (this.currentUrl().includes('/ledger')) {
      this.ledgerService.openBottomSheet();
    } else {
      this.expenseService.openBottomSheet();
    }
  }

  goBack() {
    this.location.back();
  }

  editGroup() {
    const group = this.activeGroup();
    if (group) {
      this.splitService.openGroupSheet(group);
    }
  }

  editBudget() {
    const match = this.currentUrl().match(/\/budgets\/(.+)/);
    const name = match ? decodeURIComponent(match[1]) : null;
    if (name) {
      const budget = this.budgetService.budgets().find(b => b.name === name);
      if (budget) {
        this.budgetService.openBottomSheet(budget);
      }
    }
  }

  editGoal() {
    const goal = this.activeGoal();
    if (goal) {
      this.goalService.openBottomSheet(goal);
    }
  }

  editLedger() {
    const ledger = this.activeLedger();
    if (ledger) {
      this.ledgerService.openBottomSheet(ledger);
    }
  }

  bottomNavItems = computed(() => {
    const sequence = ['dashboard', 'expenses', 'budgets', 'friends', 'splits'];
    return sequence
      .map(id => this.quickActionsService.navItems.find(item => item.id === id))
      .filter((item): item is NonNullable<typeof item> => item !== undefined);
  });

  get navItems() {
    return this.quickActionsService.navItems;
  }

  getActiveClasses(id: string): string {
    switch (id) {
      case 'dashboard': return 'bg-black text-white border-black';
      case 'expenses': return 'bg-expense-primary text-white border-expense-primary';
      case 'budgets': return 'bg-budget-primary text-white border-budget-primary';
      case 'friends': return 'bg-friends-primary text-white border-friends-primary';
      case 'splits': return 'bg-splits-primary text-white border-splits-primary';
      case 'subscriptions': return 'bg-subscriptions-primary text-white border-subscriptions-primary';
      case 'goals': return 'bg-goals-primary text-white border-goals-primary';
      case 'ledger': return 'bg-ledger-primary text-white border-ledger-primary';
      case 'reports': return 'bg-reports-primary text-white border-reports-primary';
      case 'profile': return 'bg-black text-white border-black';
      default: return 'bg-black text-white border-black';
    }
  }

  getThemeClasses() {
    const route = this.currentUrl().split('/')[1] || 'dashboard';
    switch (route) {
      case 'expenses': return { bg: 'bg-expense-primary', border: 'border-expense-dark', text: 'text-expense-primary' };
      case 'budgets': return { bg: 'bg-budget-primary', border: 'border-budget-dark', text: 'text-budget-primary' };
      case 'friends': return { bg: 'bg-friends-primary', border: 'border-friends-dark', text: 'text-friends-primary' };
      case 'splits': return { bg: 'bg-splits-primary', border: 'border-splits-dark', text: 'text-splits-primary' };
      case 'subscriptions': return { bg: 'bg-subscriptions-primary', border: 'border-subscriptions-dark', text: 'text-subscriptions-primary' };
      case 'goals': return { bg: 'bg-goals-primary', border: 'border-goals-dark', text: 'text-goals-primary' };
      case 'ledger': return { bg: 'bg-ledger-primary', border: 'border-ledger-dark', text: 'text-ledger-primary' };
      case 'reports': return { bg: 'bg-reports-primary', border: 'border-reports-dark', text: 'text-reports-primary' };
      case 'profile': return { bg: 'bg-black', border: 'border-black', text: 'text-black' };
      case 'dashboard': return { bg: 'bg-black', border: 'border-black', text: 'text-black' };
      default: return { bg: 'bg-black', border: 'border-black', text: 'text-black' };
    }
  }

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
