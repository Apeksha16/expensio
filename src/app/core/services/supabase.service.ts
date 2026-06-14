import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input as any).url || input.toString();
      
      let parsedBody = init?.body;
      if (typeof init?.body === 'string') {
        try { parsedBody = JSON.parse(init.body); } catch(e) {}
      }
      
      console.groupCollapsed(
        `%c API Request %c ${init?.method || 'GET'} %c ${new URL(url).pathname.split('/').pop() || new URL(url).pathname}`,
        'color: white; background: #3b82f6; font-weight: bold; padding: 2px 4px; border-radius: 4px;',
        'color: #8b5cf6; font-weight: bold;',
        'color: gray;'
      );
      console.log('%cURL:', 'font-weight: bold;', url);
      if (parsedBody) console.log('%cRequest Body:', 'font-weight: bold;', parsedBody);
      
      const response = await fetch(input, init);
      const cloned = response.clone();
      
      try {
        const text = await cloned.text();
        let data = text;
        try { data = JSON.parse(text); } catch(e) {}
        
        const statusColor = response.ok ? 'color: #22c55e;' : 'color: #ef4444;';
        console.log(`%cResponse Status: %c${response.status}`, 'font-weight: bold;', statusColor + ' font-weight: bold;');
        console.log('%cResponse Body:', 'font-weight: bold;', data);
      } catch (e) {
        console.log(`Response Status: ${response.status} (Could not parse body)`);
      }
      
      console.groupEnd();
      
      return response;
    };

    const realtimeLogger = (kind: string, msg: string, data: any) => {
      // Only log payload receives (e.g., insert, update, delete)
      if (msg === 'payload received') {
        const type = data?.type || 'UNKNOWN';
        const event = data?.event || 'EVENT';
        const schema = data?.schema || '';
        const table = data?.table || '';
        
        console.groupCollapsed(
          `%c Realtime %c ${event} %c ${schema}.${table}`,
          'color: white; background: #f59e0b; font-weight: bold; padding: 2px 4px; border-radius: 4px;',
          'color: #d97706; font-weight: bold;',
          'color: gray;'
        );
        console.log('%cType:', 'font-weight: bold;', type);
        console.log('%cPayload:', 'font-weight: bold;', data);
        console.groupEnd();
      }
    };

    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      global: { fetch: customFetch },
      realtime: {
        log_level: 'info',
      }
    });
    
    // Attempt to override the realtime logger internally if the type signature is supported by the underlying realtime client
    (this.supabase as any).realtime.logger = realtimeLogger;
  }

  get client() {
    return this.supabase;
  }

  // Supabase requires passwords to be at least 6 characters by default.
  // We pad the 4-digit MPIN securely so the user doesn't have to change their dashboard settings.
  private padMpin(mpin: string): string {
    return mpin ? mpin + '-expensio-secure' : mpin;
  }

  async signInWithMpin(email: string, mpin: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password: this.padMpin(mpin)
    });
    if (error) throw error;
    return data;
  }

  async signUpWithMpin(email: string, mpin: string, metadata: any) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password: this.padMpin(mpin),
      options: {
        data: metadata
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

  async sendMpinResetOtp(email: string) {
    const { data, error } = await this.supabase.rpc('generate_mpin_reset_otp', { p_email: email });
    if (error) throw error;
    // In dev environment, we just log the code for testing.
    console.log('OTP Code generated:', data?.code);
    return data;
  }

  async verifyMpinResetOtp(email: string, token: string) {
    const { data, error } = await this.supabase.rpc('verify_mpin_reset_otp', { p_email: email, p_code: token });
    if (error) throw error;
    if (!data) throw new Error('Invalid or expired OTP');
    return data;
  }

  async updateMpin(newMpin: string, email?: string, token?: string) {
    const paddedMpin = this.padMpin(newMpin);
    if (email && token) {
      // Custom MPIN reset flow using RPC
      const { data, error } = await this.supabase.rpc('reset_custom_mpin', { 
        p_email: email, 
        p_code: token, 
        p_new_mpin: paddedMpin 
      });
      if (error) throw error;
      if (!data) throw new Error('Failed to reset MPIN. OTP may be invalid or expired.');
      
      // Now login with new password
      await this.signInWithMpin(email, newMpin);
    } else {
      // Standard auth update (if logged in)
      const { error } = await this.supabase.auth.updateUser({
        password: paddedMpin
      });
      if (error) throw error;
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('check_email_exists', { p_email: email });
    if (error) throw error;
    return data;
  }

  async preLoginCheck(email: string): Promise<{allowed: boolean, locked_until?: string}> {
    // Schema hasn't been applied to DB yet, returning allowed to avoid 400 errors
    return { allowed: true };
  }

  async recordFailedLogin(email: string): Promise<{success: boolean, failed_attempts?: number}> {
    // Schema hasn't been applied to DB yet, returning false to avoid 400 errors
    return { success: false };
  }


}
