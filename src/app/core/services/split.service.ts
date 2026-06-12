import { Injectable, signal, PLATFORM_ID, inject, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth';

export interface SplitParticipant {
  username: string;
  amountOwed: number;
}

export interface SplitExpense {
  id: string;
  title: string;
  totalAmount: number;
  payerUsername: string;
  participants: SplitParticipant[];
  groupId?: string;
  date: string;
}

export interface SplitGroup {
  id: string;
  name: string;
  members: string[]; // usernames
}

@Injectable({
  providedIn: 'root'
})
export class SplitService {
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);

  private readonly STORAGE_SPLITS = 'expensio_splits';
  private readonly STORAGE_GROUPS = 'expensio_groups';

  // Sheet state
  readonly isSheetOpen = signal<boolean>(false);
  readonly isGroupSheetOpen = signal<boolean>(false);
  readonly editingGroup = signal<SplitGroup | null>(null);
  
  // Navigation state
  readonly activeTab = signal<'friends' | 'groups'>('friends');

  // Data state
  readonly splits = signal<SplitExpense[]>(this.loadData<SplitExpense[]>(this.STORAGE_SPLITS, []));
  readonly groups = signal<SplitGroup[]>(this.loadData<SplitGroup[]>(this.STORAGE_GROUPS, []));

  private loadData<T>(key: string, defaultVal: T): T {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    }
    return defaultVal;
  }

  private saveData(key: string, data: any) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  // --- Actions ---

  addSplit(split: SplitExpense) {
    this.splits.update(curr => [split, ...curr]);
    this.saveData(this.STORAGE_SPLITS, this.splits());
  }

  createGroup(group: SplitGroup) {
    this.groups.update(curr => [group, ...curr]);
    this.saveData(this.STORAGE_GROUPS, this.groups());
  }

  updateGroup(group: SplitGroup) {
    this.groups.update(curr => curr.map(g => g.id === group.id ? group : g));
    this.saveData(this.STORAGE_GROUPS, this.groups());
  }

  deleteGroup(id: string) {
    this.groups.update(curr => curr.filter(g => g.id !== id));
    this.saveData(this.STORAGE_GROUPS, this.groups());
  }

  // --- Computations ---

  // Calculate balances. Positive = they owe you. Negative = you owe them.
  balances = computed(() => {
    const currentUser = this.authService.userProfile()?.username;
    if (!currentUser) return {};

    const balanceMap: Record<string, number> = {};

    this.splits().forEach(split => {
      const isPayer = split.payerUsername === currentUser;

      if (isPayer) {
        // You paid. Others owe you.
        split.participants.forEach(p => {
          if (p.username !== currentUser) {
            balanceMap[p.username] = (balanceMap[p.username] || 0) + p.amountOwed;
          }
        });
      } else {
        // Someone else paid.
        // Did you participate?
        const myParticipant = split.participants.find(p => p.username === currentUser);
        if (myParticipant) {
          // You owe the payer
          balanceMap[split.payerUsername] = (balanceMap[split.payerUsername] || 0) - myParticipant.amountOwed;
        }
      }
    });

    return balanceMap;
  });

  totalOwedToYou = computed(() => {
    return Object.values(this.balances()).filter(val => val > 0).reduce((sum, val) => sum + val, 0);
  });

  totalYouOwe = computed(() => {
    return Object.values(this.balances()).filter(val => val < 0).reduce((sum, val) => sum + Math.abs(val), 0);
  });

  // --- Sheet Controls ---

  openAddSplitSheet() {
    this.isSheetOpen.set(true);
  }

  openGroupSheet(group?: SplitGroup) {
    this.editingGroup.set(group || null);
    this.isGroupSheetOpen.set(true);
  }

  closeSheet() {
    this.isSheetOpen.set(false);
  }

  closeGroupSheet() {
    this.isGroupSheetOpen.set(false);
    this.editingGroup.set(null);
  }
}
