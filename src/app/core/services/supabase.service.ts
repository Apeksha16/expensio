import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  get client() {
    return this.supabase;
  }

  async signInWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard' // or logic to handle redirect
      }
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async checkUsernameExists(username: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();
      
    if (error) {
      console.error('Error checking username', error);
      return false; // Fail safe
    }
    
    return !!data;
  }

  async saveUserProfile(userId: string, profileData: any) {
    const { error } = await this.supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date()
      });
      
    if (error) throw error;
  }
}
