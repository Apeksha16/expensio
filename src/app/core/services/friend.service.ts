import { Injectable, signal, inject, effect, untracked } from '@angular/core';
import { UserProfile, AuthService } from './auth';
import { SupabaseService } from './supabase.service';

export interface FriendRelationship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  requester?: UserProfile;
  addressee?: UserProfile;
}

export interface FriendData {
  id: string;
  status: 'pending' | 'accepted';
  isIncoming: boolean;
  profile: UserProfile;
}

@Injectable({
  providedIn: 'root'
})
export class FriendService {
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);

  // Sheet state
  readonly isSheetOpen = signal<boolean>(false);
  readonly sheetMode = signal<'add' | 'remove'>('add');
  readonly selectedFriend = signal<FriendData | null>(null);

  // Data state
  readonly isLoading = signal(false);
  readonly acceptedFriends = signal<FriendData[]>([]);
  readonly incomingRequests = signal<FriendData[]>([]);
  readonly outgoingRequests = signal<FriendData[]>([]);

  private realtimeChannel: any = null;

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        untracked(() => {
          this.fetchFriends();
          this.setupRealtime();
        });
      } else {
        this.acceptedFriends.set([]);
        this.incomingRequests.set([]);
        this.outgoingRequests.set([]);
        if (this.realtimeChannel) {
          this.supabaseService.client.removeChannel(this.realtimeChannel);
          this.realtimeChannel = null;
        }
      }
    });
  }

  private setupRealtime() {
    if (this.realtimeChannel) return;
    this.realtimeChannel = this.supabaseService.client.channel('public:friends')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, payload => {
        this.fetchFriends();
      })
      .subscribe();
  }

  async fetchFriends() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.isLoading.set(true);
    const { data, error } = await this.supabaseService.client
      .from('friends')
      .select(`
        id,
        status,
        requester_id,
        addressee_id,
        created_at,
        requester:profiles!friends_requester_id_fkey(*),
        addressee:profiles!friends_addressee_id_fkey(*)
      `)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (!error && data) {
      const allData: FriendData[] = data.map((row: any) => {
        const isIncoming = row.addressee_id === user.id;
        return {
          id: row.id,
          status: row.status,
          isIncoming,
          profile: isIncoming ? row.requester : row.addressee
        };
      });

      this.acceptedFriends.set(allData.filter(f => f.status === 'accepted'));
      this.incomingRequests.set(allData.filter(f => f.status === 'pending' && f.isIncoming));
      this.outgoingRequests.set(allData.filter(f => f.status === 'pending' && !f.isIncoming));
    }
    this.isLoading.set(false);
  }

  async searchUsers(query: string): Promise<UserProfile[]> {
    const { data, error } = await this.supabaseService.client
      .rpc('search_users_for_friendship', { search_query: query });
      
    if (!error && data) {
      return data as UserProfile[];
    }
    return [];
  }

  async sendRequest(targetUser: UserProfile) {
    const user = this.authService.currentUser();
    if (!user) return;

    await this.supabaseService.client
      .from('friends')
      .insert({
        requester_id: user.id,
        addressee_id: targetUser.id,
        status: 'pending'
      });
  }

  async acceptRequest(friendshipId: string) {
    await this.supabaseService.client
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);
  }

  async removeFriend(friendshipId: string) {
    await this.supabaseService.client
      .from('friends')
      .delete()
      .eq('id', friendshipId);
  }

  openAddSheet() {
    this.sheetMode.set('add');
    this.selectedFriend.set(null);
    this.isSheetOpen.set(true);
  }

  openRemoveSheet(friend: FriendData) {
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
