export interface Turno {
  id?: string;
  paciente_id: string;
  especialista_id: string;
  especialidad: string;
  fecha: string; // YYYY-MM-DD
  horario: string; // "10:30"
  estado?: 'pendiente' | 'aceptado' | 'rechazado' | 'cancelado' | 'realizado';
  comentario_paciente?: string;
  comentario_especialista?: string;
  calificacion?: number;
  encuesta?: any;
  reseña?: string;
  created_at?: string;
}
