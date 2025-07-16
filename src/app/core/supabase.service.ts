import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.apiUrl, environment.publicAnonKey);
  }

  get client() {
    return this.supabase;
  }

  async getUserId(): Promise<string | null> {
    const { data, error } = await this.client.auth.getUser();
    return data?.user?.id || null;
  }

  async getUsuarioActual(): Promise<any> {
    const { data: { user }, error } = await this.client.auth.getUser();
    if (error || !user) return null;

    const id = user.id;

    const { data: especialista } = await this.client
      .from('especialistas')
      .select('*')
      .eq('id', id)
      .single();

    if (especialista) return { ...especialista, rol: 'especialista' };

    const { data: paciente } = await this.client
      .from('pacientes')
      .select('*')
      .eq('id', id)
      .single();

    if (paciente) return { ...paciente, rol: 'paciente' };

    const { data: admin } = await this.client
      .from('administradores')
      .select('*')
      .eq('id', id)
      .single();

    if (admin) return { ...admin, rol: 'admin' };

    return null;
  }

  async cargarEspecialistas() {
    const especialistasMap: { [id: string]: any } = {};
    
    const { data, error } = await this.supabase
      .from('especialistas')
      .select('id, nombre, apellido');

    if (!error && data) {
      for (let esp of data) {
        especialistasMap[esp.id] = esp;
      }
    }

    return especialistasMap;
  }

  async cargarPacientes() {
    const pacientesMap: { [id: string]: any } = {};
    
    const { data, error } = await this.supabase
      .from('pacientes')
      .select('id, nombre, apellido');

    if (!error && data) {
      for (let esp of data) {
        pacientesMap[esp.id] = esp;
      }
    }

    return pacientesMap;
  }

}
