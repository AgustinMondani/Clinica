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

    // Generar lista única de fechas
    this.fechasUnicas = [...new Set(this.turnos.map(t => t.fecha))];
  }

  actualizarTurnosFiltrados() {
    this.turnosFiltrados = this.turnos.filter(t => {
      const coincideFecha = this.filtroFecha ? t.fecha === this.filtroFecha : true;
      const coincideEstado = this.filtroEstado ? t.estado === this.filtroEstado : true;
      return coincideFecha && coincideEstado;
    });
  }

  limpiarFiltros() {
    this.filtro = '';
    this.filtroFecha = '';
    this.filtroEstado = '';
    this.turnosFiltrados = [...this.turnos];
  }

  async cancelarTurno(turno: any) {
    if (turno.estado === 'realizado') {
      alert('No puede cancelar un turno ya realizado');
      return;
    }
    const comentario = prompt('¿Por qué desea cancelar el turno?');
    if (comentario) {
      await this.turnoService.actualizarTurno(turno.id, {
        estado: 'cancelado',
        comentario_paciente: comentario
      });
      alert('Turno cancelado');
      this.ngOnInit();
    }
  }

  async calificarTurno(turno: any) {
    if (turno.estado !== 'realizado') {
      alert('Solo puede calificar turnos realizados');
      return;
    }
    const comentario = prompt('¿Cómo fue la atención?');
    const calificacion = prompt('Puntualo del 1 al 5');
    if (comentario && calificacion) {
      await this.turnoService.actualizarTurno(turno.id, {
        comentario_paciente: comentario,
        calificacion: parseInt(calificacion, 10)
      });
      alert('Gracias por calificar');
      this.ngOnInit();
    }
  }

  completarEncuesta(turno: any) {
    if (turno.estado !== 'realizado' || !turno.resena) {
      alert('No puede completar la encuesta aún.');
      return;
    }
    alert('Componente Encuesta pendiente. Pronto se cargará aquí.');
  }

  verResena(turno: any) {
    alert(`Reseña del especialista:\n${turno.resena}`);
  }
}
