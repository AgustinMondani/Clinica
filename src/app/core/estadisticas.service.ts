import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  constructor(private supabase: SupabaseService) {}

  async getTurnosPorEspecialidad() {
    const { data, error } = await this.supabase.client.from('turnos').select('especialidad');
    if (error) throw error;

    const agrupado = data.reduce((acc, item) => {
      acc[item.especialidad] = (acc[item.especialidad] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(agrupado).map(([especialidad, count]) => ({ especialidad, count }));
  }

  async getTurnosPorDia() {
    const { data, error } = await this.supabase.client.from('turnos').select('fecha');
    if (error) throw error;

    const agrupado = data.reduce((acc, item) => {
      acc[item.fecha] = (acc[item.fecha] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(agrupado).map(([fecha, count]) => ({ fecha, count }));
  }

 async getTurnosPorMedicoProximos15Dias() {
  const hoy = new Date();
  const en15 = new Date();
  en15.setDate(hoy.getDate() + 15);

  const desde = hoy.toISOString().split('T')[0];
  const hasta = en15.toISOString().split('T')[0];

  const { data: turnos, error } = await this.supabase.client
    .from('turnos')
    .select('especialista_id')
    .gte('fecha', desde)
    .lte('fecha', hasta);

  if (error || !turnos) return [];

  const conteo: { [id: string]: number } = {};
  turnos.forEach(t => {
    if (t.especialista_id) {
      conteo[t.especialista_id] = (conteo[t.especialista_id] || 0) + 1;
    }
  });

  const ids = Object.keys(conteo);

  if (ids.length === 0) return [];

  const { data: especialistas, error: errorEsp } = await this.supabase.client
    .from('especialistas')
    .select('id, nombre, apellido')
    .in('id', ids);

  if (errorEsp || !especialistas) return [];

  return especialistas.map(e => ({
    nombre_completo: `${e.nombre} ${e.apellido}`,
    count: conteo[e.id] || 0
  }));
}

  async getLogIngresos() {
    const { data, error } = await this.supabase.client
      .from('logs_ingresos')
      .select('usuario, fecha_hora')
      .order('fecha_hora', { ascending: false });

    if (error) throw error;
    return data;
  }
}
