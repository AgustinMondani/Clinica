import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class TurnoService {
  constructor(private supabase: SupabaseService) {}

  async solicitarTurno(turno: any) {
    const { data, error } = await this.supabase.client.from('turnos').insert([turno]);
    if (error) throw error;
    return data;
  }

  async obtenerTurnosPorUsuario(usuarioId: string, rol: 'paciente' | 'especialista') {
    const columna = rol === 'paciente' ? 'paciente_id' : 'especialista_id';
    const { data, error } = await this.supabase.client
      .from('turnos')
      .select('*')
      .eq(columna, usuarioId)
      .order('fecha', { ascending: true });

    if (error) throw error;
    return data;
  }

  async actualizarTurno(turnoId: string, cambios: any) {
    const { data, error } = await this.supabase.client
      .from('turnos')
      .update(cambios)
      .eq('id', turnoId);

    if (error) throw error;
    return data;
  }

  async obtenerTodosLosTurnos() {
    const { data, error } = await this.supabase.client
      .from('turnos')
      .select('*')
      .order('fecha', { ascending: true });

    if (error) throw error;
    return data;
  }
}
