import { Injectable } from '@angular/core';
import { SupabaseService } from '../core/supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private supabaseService: SupabaseService) { }

  async register(email: string, password: string) {
    return this.supabaseService.client.auth.signUp({
      email,
      password
    });
  }

  async login(email: string, password: string) {
    return this.supabaseService.client.auth.signInWithPassword({
      email,
      password
    });
  }

  async logout() {
    return this.supabaseService.client.auth.signOut();
  }

  getUser() {
    return this.supabaseService.client.auth.getUser();
  }
  
}