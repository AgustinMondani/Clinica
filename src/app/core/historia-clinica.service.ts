// src/app/core/historia-clinica.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class HistoriaClinicaService {

  constructor(private supabase: SupabaseService) {}

  async crearHistoria(data: any) {
    const { error } = await this.supabase.client.from('historia_clinica').insert([data]);
    if (error) throw error;
    return true;
  }

  async obtenerHistoriasPorPaciente(pacienteId: string) {
    const { data, error } = await this.supabase.client
      .from('historia_clinica')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async obtenerHistoriasPorEspecialista(especialistaId: string) {
    const { data, error } = await this.supabase.client
      .from('historia_clinica')
      .select('*')
      .eq('especialista_id', especialistaId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async obtenerHistoriaPorTurno(turnoId: string) {
    const { data, error } = await this.supabase.client
      .from('historia_clinica')
      .select('*')
      .eq('turno_id', turnoId)
      .single();
    if (error) throw error;
    return data;
  }
}
