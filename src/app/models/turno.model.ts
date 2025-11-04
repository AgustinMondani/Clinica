export interface Turno {
  id?: string;
  paciente_id: string;
  especialista_id: string;
  especialidad: string;
  fecha: string;
  horario: string;
  estado?: 'pendiente' | 'aceptado' | 'rechazado' | 'cancelado' | 'realizado';
  comentario_paciente?: string;
  comentario_especialista?: string;
  calificacion?: number;
  encuesta?: any;
  reseña?: string;
  created_at?: string;
}
