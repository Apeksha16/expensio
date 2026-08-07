import {
  Component,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectionStrategy,
} from '@angular/core';
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
import { AccountSheetComponent } from '../../shared/ui/account-sheet/account-sheet.component';
import { AccountTrackerService } from '../services/account-tracker.service';
import { MonthPickerService } from '../services/month-picker.service';

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
    MonthPickerComponent,
    QuickActionsSheetComponent,
    SubscriptionSheetComponent,
    GoalSheetComponent,
    AddFundsSheetComponent,
    LedgerSheetComponent,
    LedgerSubSheetComponent,
    AccountSheetComponent,
  ],
  animations: [slideInAnimation],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="h-full bg-gray-50 flex flex-col relative w-full overflow-hidden">
      <!-- Global hidden input for iOS keyboard hack -->
      <input
        #globalHiddenInput
        type="text"
        class="fixed opacity-0 pointer-events-none -z-50 -left-[9999px] -top-[9999px]"
      />

      <!-- Top Header -->
      <header
        class="fixed top-0 w-full z-30 flex items-center justify-between px-4 h-14 transition-colors duration-300"
        [ngClass]="getThemeClasses().bg + ' ' + (getThemeClasses().bg === 'bg-white' || getThemeClasses().bg === 'bg-gray-50' ? 'text-black' : 'text-white')"
      >
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span class="text-lg font-extrabold tracking-tight truncate max-w-[200px] text-center">{{ pageTitle() }}</span>
        </div>
        @if (
          isGroupExpensesPage() ||
          isBudgetExpensesPage() ||
          isGoalTransactionsPage() ||
          isLedgerDetailsPage()
        ) {
          <button
            (click)="goBack()"
            class="p-2 -ml-2 opacity-80 relative z-10 hover:opacity-100 focus:outline-none transition-opacity"
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
            class="p-2 -ml-2 opacity-80 relative z-10 hover:opacity-100 focus:outline-none transition-opacity"
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
        

        @if (isGroupExpensesPage()) {
          <button
            (click)="editGroup()"
            class="p-2 -mr-2 opacity-80 relative z-10 hover:opacity-100 focus:outline-none transition-opacity"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5z"
              />
            </svg>
          </button>
        } @else if (isBudgetExpensesPage() && !isVirtualOthersBudget()) {
          <button
            (click)="editBudget()"
            class="p-2 -mr-2 opacity-80 relative z-10 hover:opacity-100 focus:outline-none transition-opacity"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5z"
              />
            </svg>
          </button>
        } @else if (isGoalTransactionsPage()) {
          <button
            (click)="editGoal()"
            class="p-2 -mr-2 opacity-80 relative z-10 hover:opacity-100 focus:outline-none transition-opacity"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5z"
              />
            </svg>
          </button>
        } @else if (isLedgerDetailsPage()) {
          <button
            (click)="editLedger()"
            class="p-2 -mr-2 opacity-80 relative z-10 hover:opacity-100 focus:outline-none transition-opacity"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5z"
              />
            </svg>
          </button>
        } @else if (isExpensesPage() || isBudgetsPage()) {
          <button
            (click)="openMonthPicker()"
            class="p-2 -mr-2 relative z-10 hover:opacity-80 focus:outline-none transition-opacity"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
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
        class="fixed inset-y-0 left-0 z-50 w-[300px] bg-white transform transition-transform duration-300 ease-in-out flex flex-col rounded-r-[32px] shadow-2xl overflow-hidden"
        [class.-translate-x-full]="!isSidebarOpen()"
        [class.translate-x-0]="isSidebarOpen()"
      >
        <!-- Background decorative shape -->
        <div class="absolute -top-24 -left-24 w-64 h-64 bg-[#F4F2FF] rounded-full blur-[40px] pointer-events-none"></div>

        <div class="pt-6 pb-6 px-6 flex items-center gap-4 relative z-10">
          <!-- Avatar -->
          <div class="relative shrink-0">
            <div class="w-[72px] h-[72px] rounded-full p-[3px] bg-white shadow-sm border border-gray-100">
              <div class="w-full h-full rounded-full overflow-hidden bg-indigo-50">
                <img [src]="authService.getAvatarUrl(authService.userProfile().avatarId)" class="w-full h-full object-cover" />
              </div>
            </div>
          </div>
          <!-- Info -->
          <div class="flex flex-col">
            <span class="text-[20px] font-extrabold text-gray-900 leading-tight mb-0.5">{{ authService.userProfile().name || authService.userProfile().username }}</span>
            <span class="text-[13px] text-profile-primary font-medium mb-2">&#64;{{ authService.userProfile().username }}</span>
          </div>
        </div>

        <nav class="flex-1 px-4 py-2 space-y-1 overflow-y-auto overscroll-none relative z-10 custom-scrollbar">
          @for (item of navItems; track item) {
            <a
              [routerLink]="item.path"
              routerLinkActive="is-active"
              #rla="routerLinkActive"
              [routerLinkActiveOptions]="{ exact: false }"
              (click)="toggleSidebar(false)"
              class="flex items-center justify-between px-3 py-2.5 rounded-2xl font-bold transition-all"
              [ngClass]="rla.isActive ? 'bg-profile-primary/10 text-profile-primary' : 'text-gray-900 hover:bg-gray-50'"
            >
              <div class="flex items-center gap-4">
                <div 
                  class="w-[42px] h-[42px] rounded-2xl flex items-center justify-center transition-colors"
                  [ngClass]="rla.isActive ? 'bg-profile-primary text-white shadow-md shadow-profile-primary/20' : 'bg-profile-primary/10 text-profile-primary'"
                >
                  <span [innerHTML]="item.icon" class="w-5 h-5 flex items-center justify-center"></span>
                </div>
                <span class="text-[15px] font-bold">{{ item.name }}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                [ngClass]="rla.isActive ? 'text-profile-primary' : 'text-gray-400'"
              >
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </a>
          }
        </nav>

        <div class="px-6 py-5 mt-auto flex items-center justify-between relative z-10">
          <div class="absolute top-0 left-6 right-6 h-px bg-gray-100"></div>
          <span class="text-[12px] font-semibold tracking-wider text-gray-500">
            v1.0.27
          </span>
          <div class="flex gap-3">
            <button
              (click)="checkForUpdate()"
              title="Check for update"
              class="w-11 h-11 rounded-2xl flex items-center justify-center bg-profile-primary/10 text-profile-primary transition-colors hover:bg-profile-primary hover:text-white"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="M21 2v6h-6"/>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
                <path d="M3 22v-6h6"/>
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
              </svg>
            </button>
            <button
              (click)="logout()"
              title="Logout"
              class="w-11 h-11 rounded-2xl flex items-center justify-center bg-red-50 text-red-500 transition-colors hover:bg-red-500 hover:text-white"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                <line x1="12" y1="2" x2="12" y2="12" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 overflow-hidden bg-gray-50 relative pt-14">
        <div [@routeAnimations]="getAnimationData()" class="h-full w-full">
          <router-outlet #outlet="outlet"></router-outlet>
        </div>
      </main>

      <!-- Bottom Navbar -->
      @if (!isProfilePage()) {
        <nav
          class="fixed left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-30 rounded-full px-2 py-2 border border-gray-100"
          style="bottom: 1.5rem; width: max-content; min-width: 250px;"
        >
          <div class="flex justify-center items-center gap-2">
            @for (item of bottomNavItems(); track item.id) {
              <a
                [routerLink]="item.path"
                routerLinkActive="is-active"
                #rla="routerLinkActive"
                [routerLinkActiveOptions]="{ exact: false }"
                class="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 active:scale-95"
                [ngClass]="rla.isActive ? 'bg-[#059669] text-white shadow-md' : 'bg-transparent text-slate-600 hover:text-black'"
              >
                <span
                  [innerHTML]="item.icon"
                  class="w-6 h-6 flex items-center justify-center"
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
          class="fixed right-5 w-14 h-14 text-white rounded-full flex items-center justify-center z-40 shadow-xl transition-all duration-200 active:scale-90 hover:scale-105"
          [ngClass]="getThemeClasses().bg + ' shadow-' + getThemeClasses().bg + '/30'"
          style="bottom: 5.5rem;"
        >
          <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
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
      <app-account-sheet></app-account-sheet>
    </div>
  `,
})
export class Layout implements AfterViewInit {
  isSidebarOpen = signal(false);
  authService = inject(AuthService);
  private confirmService = inject(ConfirmService);
  router = inject(Router);
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
  accountTrackerService = inject(AccountTrackerService);
  monthPicker = inject(MonthPickerService);

  currentUrl = signal(this.router.url);

  isProfilePage = computed(() => this.currentUrl().includes('/profile'));
  isDashboardPage = computed(
    () => this.currentUrl().includes('/dashboard') || this.currentUrl() === '/',
  );
  isGroupExpensesPage = computed(() => this.currentUrl().includes('/splits/group/'));
  isBudgetExpensesPage = computed(() => this.currentUrl().match(/\/budgets\/.+/) !== null);
  isGoalTransactionsPage = computed(() => this.currentUrl().match(/\/goals\/.+/) !== null);
  isLedgerDetailsPage = computed(() => this.currentUrl().match(/\/ledger\/.+/) !== null);
  isReportsPage = computed(() => this.currentUrl().includes('/reports'));
  isExpensesPage = computed(() => this.currentUrl().includes('/expenses'));
  isBudgetsPage = computed(() => this.currentUrl().includes('/budgets') && !this.isBudgetExpensesPage());

  activeLedger = computed(() => {
    if (this.isLedgerDetailsPage()) {
      const match = this.currentUrl().match(/\/ledger\/(.+)/);
      const id = match ? match[1] : null;
      if (id) {
        return this.ledgerService.ledgerEntries().find((e) => e.id === id);
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
        return this.splitService.groups().find((g) => g.id === id);
      }
    }
    return null;
  });

  activeGoal = computed(() => {
    if (this.isGoalTransactionsPage()) {
      const match = this.currentUrl().match(/\/goals\/(.+)/);
      const id = match ? match[1] : null;
      if (id) {
        return this.goalService.goals().find((g) => g.id === id);
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
    if (url.includes('/tracker')) return 'Accounts Tracker';
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
      const budget = this.budgetService.budgets().find((b) => b.name === name);
      if (budget) {
        this.budgetService.openBottomSheet(budget);
      }
    }
  }

  openMonthPicker() {
    this.monthPicker.open(this.expenseService.activeMonth());
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
      .map((id) => this.quickActionsService.navItems.find((item) => item.id === id))
      .filter((item): item is NonNullable<typeof item> => item !== undefined);
  });

  get navItems() {
    return this.quickActionsService.navItems;
  }

  getActiveClasses(id: string): string {
    return 'is-active'; // Now handled in template, this can be safely ignored but kept to prevent compilation errors if called elsewhere
  }

  getThemeClasses() {
    const route = this.currentUrl().split('/')[1] || 'dashboard';
    switch (route) {
      case 'expenses':
        return { bg: 'bg-expense-primary', border: 'border-expense-primary', text: 'text-expense-primary' };
      case 'budgets':
        return { bg: 'bg-budget-primary', border: 'border-budget-primary', text: 'text-budget-primary' };
      case 'friends':
        return { bg: 'bg-friends-primary', border: 'border-friends-primary', text: 'text-friends-primary' };
      case 'splits':
        return { bg: 'bg-splits-primary', border: 'border-splits-primary', text: 'text-splits-primary' };
      case 'subscriptions':
        return { bg: 'bg-subscriptions-primary', border: 'border-subscriptions-primary', text: 'text-subscriptions-primary' };
      case 'goals':
        return { bg: 'bg-goals-primary', border: 'border-goals-primary', text: 'text-goals-primary' };
      case 'ledger':
        return { bg: 'bg-ledger-primary', border: 'border-ledger-primary', text: 'text-ledger-primary' };
      case 'reports':
        return { bg: 'bg-reports-primary', border: 'border-reports-primary', text: 'text-reports-primary' };
      case 'tracker':
        return { bg: 'bg-tracker-primary', border: 'border-tracker-primary', text: 'text-tracker-primary' };
      case 'profile':
        return { bg: 'bg-profile-primary', border: 'border-profile-primary', text: 'text-profile-primary' };
      default:
        return { bg: 'bg-white', border: 'border-white', text: 'text-black' };
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
