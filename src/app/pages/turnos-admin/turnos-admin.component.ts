import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import { LoadingService } from '../../core/loading.service';

@Component({
  selector: 'app-turnos-admin',
  templateUrl: './turnos-admin.component.html',
  styleUrls: ['./turnos-admin.component.scss'],
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class TurnosAdminComponent implements OnInit {
  turnos: any[] = [];
  filtroTexto: string = '';

  mensaje: string | null = null;
  tipoMensaje: 'error' | 'success' | 'info' | null = null;

  private filtroSubject = new Subject<void>();

  constructor(private supabase: SupabaseService, private loading: LoadingService) {}

  ngOnInit() {
    this.loading.show();
    this.cargarTurnos()
      .finally(() => this.loading.hide());
    this.filtroSubject.pipe(debounceTime(300)).subscribe(() => this.cargarTurnos());
  }

  mostrarMensaje(texto: string, tipo: 'error' | 'success' | 'info' = 'info', duracionSegundos = 5) {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    setTimeout(() => {
      this.mensaje = null;
      this.tipoMensaje = null;
    }, duracionSegundos * 1000);
  }

  async cargarTurnos() {
    try {
      const filtro = this.filtroTexto.trim().toLowerCase();

      const { data, error } = await this.supabase.client
        .from('turnos')
        .select(`
          *,
          pacientes (nombre, apellido),
          especialistas (nombre, apellido)
        `)
        .order('fecha', { ascending: true })
        .order('horario', { ascending: true });

      if (error) {
        console.error(error);
        this.mostrarMensaje('Error al cargar turnos.', 'error');
        this.turnos = [];
        return;
      }

      if (!data) {
        this.turnos = [];
        return;
      }


      const turnosConFecha = data.map(t => {
        let fechaCompleta: Date | null = null;
        if (t.fecha && t.horario) {

          fechaCompleta = new Date(`${t.fecha}T${t.horario}`);
        }
        return { ...t, fechaCompleta };
      });

  
      this.turnos = filtro
        ? turnosConFecha.filter(t => {
            const especialidad = t.especialidad?.toLowerCase() ?? '';
            const nombreCompleto = `${t.especialistas?.nombre ?? ''} ${t.especialistas?.apellido ?? ''}`.toLowerCase();
            return especialidad.includes(filtro) || nombreCompleto.includes(filtro);
          })
        : turnosConFecha;

    } catch (e) {
      console.error(e);
      this.mostrarMensaje('Error inesperado al cargar los turnos.', 'error');
    }
  }

  onFiltroChange() {
    this.filtroSubject.next();
  }

  puedeCancelar(estado: string): boolean {
    return !['aceptado', 'realizado', 'rechazado', 'cancelado'].includes(estado?.toLowerCase());
  }

  async cancelarTurno(id: string, motivo: string) {
    if (!motivo || motivo.trim() === '') {
      this.mostrarMensaje('Debe ingresar un motivo para cancelar el turno.', 'error');
      return;
    }

    try {
      const { data: turno, error: errorGet } = await this.supabase.client
        .from('turnos')
        .select('estado')
        .eq('id', id)
        .single();

      if (errorGet || !turno) {
        console.error(errorGet);
        this.mostrarMensaje('No se pudo obtener el estado del turno.', 'error');
        return;
      }

      if (['cancelado', 'realizado', 'rechazado'].includes(turno.estado.toLowerCase())) {
        this.mostrarMensaje('Este turno ya no puede ser cancelado.', 'error');
        return;
      }

      const { error } = await this.supabase.client
        .from('turnos')
        .update({
          estado: 'cancelado',
          comentario_cancelacion: motivo.trim()
        })
        .eq('id', id);

      if (error) {
        console.error(error);
        this.mostrarMensaje('Error al cancelar turno.', 'error');
        return;
      }

      this.mostrarMensaje('Turno cancelado correctamente.', 'success');
      this.cargarTurnos();
    } catch (e) {
      console.error(e);
      this.mostrarMensaje('Error inesperado al cancelar el turno.', 'error');
    }
  }
}
