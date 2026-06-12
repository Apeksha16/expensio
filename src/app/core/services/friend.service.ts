import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UserProfile } from './auth';

@Injectable({
  providedIn: 'root'
})
export class FriendService {
  private platformId = inject(PLATFORM_ID);

  private readonly STORAGE_KEY = 'expensio_friends';

  // Sheet state
  readonly isSheetOpen = signal<boolean>(false);
  readonly sheetMode = signal<'add' | 'remove'>('add');
  readonly selectedFriend = signal<UserProfile | null>(null);

  // Mock Database of other users for search
  private readonly MOCK_USERS: UserProfile[] = [
    { name: 'Alice Smith', username: 'alice99', email: 'alice@example.com', salary: 60000, avatarId: 2 },
    { name: 'Bob Jones', username: 'bobj', email: 'bob.j@example.com', salary: 75000, avatarId: 3 },
    { name: 'Charlie Brown', username: 'charlieb', email: 'charlie@example.com', salary: 50000, avatarId: 4 },
    { name: 'Diana Prince', username: 'wonderd', email: 'diana@example.com', salary: 120000, avatarId: 5 },
    { name: 'Ethan Hunt', username: 'ethanh', email: 'ethan@example.com', salary: 90000, avatarId: 6 },
    { name: 'Fiona Gallagher', username: 'fionag', email: 'fiona@example.com', salary: 45000, avatarId: 7 },
    { name: 'George Miller', username: 'georgem', email: 'george@example.com', salary: 55000, avatarId: 8 },
    { name: 'Hannah Abbott', username: 'hannah_a', email: 'hannah@example.com', salary: 65000, avatarId: 9 },
    { name: 'Ian Wright', username: 'ianw', email: 'ian@example.com', salary: 70000, avatarId: 10 },
  ];

  // Data state
  readonly friends = signal<UserProfile[]>(this.loadFriends());

  private loadFriends(): UserProfile[] {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    }
    // Start with one mock friend for demonstration
    return [
      this.MOCK_USERS[0]
    ];
  }

  private saveFriends() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.friends()));
    }
  }

  searchUsers(query: string): UserProfile[] {
    if (!query || query.trim().length === 0) return [];
    
    const lowerQuery = query.toLowerCase().trim();
    return this.MOCK_USERS.filter(u => 
      u.username.toLowerCase().includes(lowerQuery) || 
      u.email.toLowerCase().includes(lowerQuery)
    ).filter(u => !this.friends().some(f => f.username === u.username)); // Exclude already added friends
  }

  addFriend(user: UserProfile) {
    if (!this.friends().some(f => f.username === user.username)) {
      this.friends.update(curr => [...curr, user]);
      this.saveFriends();
    }
  }

  removeFriend(username: string) {
    this.friends.update(curr => curr.filter(f => f.username !== username));
    this.saveFriends();
  }

  openAddSheet() {
    this.sheetMode.set('add');
    this.selectedFriend.set(null);
    this.isSheetOpen.set(true);
  }

  openRemoveSheet(friend: UserProfile) {
    this.sheetMode.set('remove');
    this.selectedFriend.set(friend);
    this.isSheetOpen.set(true);
  }

  closeSheet() {
    this.isSheetOpen.set(false);
    setTimeout(() => {
      this.selectedFriend.set(null);
    }, 300); // clear after animation
  }
}
