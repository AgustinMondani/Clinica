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

  private async registrarLogIngreso(usuario: string) {
    const { error } = await this.supabaseService.client
      .from('logs_ingresos')
      .insert([{ usuario }]);

    if (error) {
      console.error('Error registrando log de ingreso:', error);
    }
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
      email,
      password
    });

    if (!error && data.user) {
      await this.registrarLogIngreso(data.user.email ?? 'Usuario desconocido');
    }

    return { data, error };
  }

  async logout() {
    return this.supabaseService.client.auth.signOut();
  }

  getUser() {
    return this.supabaseService.client.auth.getUser();
  }
}
