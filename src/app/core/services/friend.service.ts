import { Injectable, signal, inject, effect, untracked } from '@angular/core';
import { UserProfile, AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';



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

  private fetchTimeout: any;

  fetchFriends() {
    if (this.fetchTimeout) clearTimeout(this.fetchTimeout);
    this.fetchTimeout = setTimeout(() => {
      this._fetchFriends();
    }, 50);
  }

  private async _fetchFriends() {
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
        requester:profiles!requester_id(*),
        addressee:profiles!addressee_id(*)
      `)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (!error && data) {
      const allData: FriendData[] = data.map((row: any) => {
        const isIncoming = row.addressee_id === user.id;
        const p = isIncoming ? row.requester : row.addressee;
        return {
          id: row.id,
          status: row.status,
          isIncoming,
          profile: {
            ...p,
            avatarId: p.avatar_id,
            isGuest: p.is_guest,
            createdBy: p.created_by
          }
        };
      });

      this.acceptedFriends.set(allData.filter(f => f.status === 'accepted'));
      this.incomingRequests.set(allData.filter(f => f.status === 'pending' && f.isIncoming));
      this.outgoingRequests.set(allData.filter(f => f.status === 'pending' && !f.isIncoming));
    } else if (error) {
      console.error('Error fetching friends:', error);
    }
    this.isLoading.set(false);
  }

  async searchUsers(query: string): Promise<UserProfile[]> {
    const { data, error } = await this.supabaseService.client
      .rpc('search_users_for_friendship', { search_query: query });
      
    if (!error && data) {
      const currentUserId = this.authService.currentUser()?.id;
      return (data as any[]).filter(user => user.id !== currentUserId).map(p => ({
        ...p,
        avatarId: p.avatar_id,
        isGuest: p.is_guest,
        createdBy: p.created_by
      } as UserProfile));
    }
    return [];
  }

  async createGuestFriend(name: string, username: string): Promise<boolean> {
    const user = this.authService.currentUser();
    if (!user) return false;

    const { error } = await this.supabaseService.client
      .rpc('create_guest_user', { p_name: name, p_username: username });

    if (error) {
      console.error('Error creating guest user:', error);
      return false;
    } else {
      this.fetchFriends();
      return true;
    }
  }

  async updateGuestAvatar(guestId: string, avatarId: number): Promise<boolean> {
    const { error } = await this.supabaseService.client
      .from('profiles')
      .update({ avatar_id: avatarId })
      .eq('id', guestId);
    
    if (error) {
      console.error('Error updating guest avatar:', error);
      return false;
    } else {
      this.fetchFriends();
      return true;
    }
  }

  async sendRequest(targetUser: UserProfile) {
    const user = this.authService.currentUser();
    if (!user) return;
    
    if (user.id === targetUser.id) {
      console.warn('Cannot send a friend request to yourself');
      return;
    }

    const { error } = await this.supabaseService.client
      .from('friends')
      .insert({
        requester_id: user.id,
        addressee_id: targetUser.id,
        status: 'pending'
      });
      
    if (error) console.error('Error sending friend request:', error);
    else this.fetchFriends();
  }

  async acceptRequest(friendshipId: string) {
    const { data, error } = await this.supabaseService.client
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
      .select();
      
    if (error) {
      console.error('Error accepting friend request:', error);
    } else if (!data || data.length === 0) {
      console.error('No friend request updated. It may not exist or you lack permission.');
    } else {
      this.fetchFriends();
    }
  }

  async removeFriend(friendshipId: string) {
    const { error } = await this.supabaseService.client
      .from('friends')
      .delete()
      .eq('id', friendshipId);
      
    if (error) console.error('Error removing friend:', error);
    else this.fetchFriends();
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
