import { Component, OnInit } from '@angular/core';
import { TurnoService } from '../../core/turno.service';
import { SupabaseService } from '../../core/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstadoTurnoPipe } from '../../pipes/estado-turno.pipe';
import { FormatoFechaPipe } from '../../pipes/formato-fecha.pipe';
import { FiltroTurnosPipe } from '../../pipes/filtro-turnos.pipe';

@Component({
  selector: 'app-mis-turnos-paciente',
  templateUrl: './mis-turnos-paciente.component.html',
  styleUrls: ['./mis-turnos-paciente.component.scss'],
  imports: [FormsModule, CommonModule, EstadoTurnoPipe, FormatoFechaPipe, FiltroTurnosPipe],
  standalone: true
})
export class MisTurnosPacienteComponent implements OnInit {
  turnos: any[] = [];
  turnosFiltrados: any[] = [];
  filtro: string = '';
  filtroFecha: string = '';
  filtroEstado: string = '';
  fechasUnicas: string[] = [];

  especialistasMap: Record<string, { nombre: string; apellido: string }> = {};

  mensaje: string | null = null;
  tipoMensaje: 'error' | 'success' | 'info' | null = null;
  comentariosCancelacion: Record<string, string> = {};
  comentariosCalificacion: Record<string, string> = {};
  calificaciones: Record<string, number> = {};

  constructor(
    private turnoService: TurnoService,
    private supabase: SupabaseService
  ) {}

  async ngOnInit() {
    const userId = await this.supabase.getUserId();
    const data = await this.turnoService.obtenerTurnosPorUsuario(userId!, 'paciente');
    this.turnos = data || [];
    this.turnosFiltrados = [...this.turnos];

    this.especialistasMap = await this.supabase.cargarEspecialistas();

    this.fechasUnicas = [...new Set(this.turnos.map(t => t.fecha))];
  }

  mostrarMensaje(texto: string, tipo: 'error' | 'success' | 'info' = 'info', duracionSegundos = 5) {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    setTimeout(() => {
      this.mensaje = null;
      this.tipoMensaje = null;
    }, duracionSegundos * 1000);
  }

  actualizarTurnosFiltrados() {
    this.turnosFiltrados = this.turnos.filter(t => {
      const coincideFecha = this.filtroFecha ? t.fecha === this.filtroFecha : true;
      const coincideEstado = this.filtroEstado ? t.estado === this.filtroEstado : true;
      const filtroTexto = this.filtro.trim().toLowerCase();
      const especialidad = t.especialidad?.toLowerCase() ?? '';
      const nombreCompleto = `${this.especialistasMap[t.especialista_id]?.nombre ?? ''} ${this.especialistasMap[t.especialista_id]?.apellido ?? ''}`.toLowerCase();
      const coincideFiltroUnico = filtroTexto ? especialidad.includes(filtroTexto) || nombreCompleto.includes(filtroTexto) : true;
      return coincideFecha && coincideEstado && coincideFiltroUnico;
    });
  }

  limpiarFiltros() {
    this.filtro = '';
    this.filtroFecha = '';
    this.filtroEstado = '';
    this.turnosFiltrados = [...this.turnos];
  }

  async cancelarTurno(turno: any) {
  if (turno.estado !== 'pendiente') {
    this.mostrarMensaje('No puede cancelar un turno que ya fue realizado o cancelado', 'error');
    return;
  }

  const comentario = this.comentariosCancelacion[turno.id];
  if (!comentario || comentario.trim() === '') {
    this.mostrarMensaje('Debe ingresar un comentario para cancelar el turno', 'error');
    return;
  }

  await this.turnoService.actualizarTurno(turno.id, {
    estado: 'cancelado',
    comentario_paciente: comentario.trim()
  });

  this.mostrarMensaje('Turno cancelado correctamente', 'success');
  this.comentariosCancelacion[turno.id] = '';
  this.ngOnInit();
}


  async calificarTurno(turno: any) {
  if (turno.estado !== 'realizado') {
    this.mostrarMensaje('Solo puede calificar turnos realizados', 'error');
    return;
  }

  const comentario = this.comentariosCalificacion[turno.id];
  const calificacion = this.calificaciones[turno.id];
  if (!comentario || comentario.trim() === '' || !calificacion || calificacion < 1 || calificacion > 5) {
    this.mostrarMensaje('Debe ingresar comentario y calificación válida (1 a 5)', 'error');
    return;
  }

  await this.turnoService.actualizarTurno(turno.id, {
    comentario_paciente: comentario.trim(),
    calificacion
  });

  this.mostrarMensaje('Gracias por calificar el turno', 'success');
  this.comentariosCalificacion[turno.id] = '';
  this.calificaciones[turno.id] = 0;
  this.ngOnInit();
}

  completarEncuesta(turno: any) {
  if (turno.estado !== 'realizado' || !turno.resena) {
    this.mostrarMensaje('No puede completar la encuesta aún', 'error');
    return;
  }
  this.mostrarMensaje('Componente Encuesta pendiente. Pronto se cargará aquí.', 'info');
}

  verResena(turno: any) {
  this.mostrarMensaje(`Reseña del especialista:\n${turno.resena}`, 'info', 10);
}
}
