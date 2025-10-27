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
    this.cargarTurnos();
    this.filtroSubject.pipe(debounceTime(300)).subscribe(() => this.cargarTurnos());
    this.loading.hide();
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
    let query = this.supabase.client.from('turnos').select(`
      *,
      pacientes(nombre, apellido),
      especialistas(nombre, apellido)
    `);

    const filtro = this.filtroTexto.trim().toLowerCase();

    const { data, error } = await query.order('fecha', { ascending: true });
    if (error) {
      this.turnos = [];
      this.mostrarMensaje('Error al cargar turnos.', 'error');
      console.error(error);
      return;
    }

    if (!filtro) {
      this.turnos = data;
      return;
    }

    this.turnos = data.filter(t => {
      const especialidad = t.especialidad?.toLowerCase() ?? '';
      const nombreCompleto = `${t.especialistas?.nombre ?? ''} ${t.especialistas?.apellido ?? ''}`.toLowerCase();
      return especialidad.includes(filtro) || nombreCompleto.includes(filtro);
    });
  }

  onFiltroChange() {
    this.filtroSubject.next();
  }

  puedeCancelar(estado: string): boolean {
    return !['aceptado', 'realizado', 'rechazado', 'cancelado'].includes(estado.toLowerCase());
  }

  async cancelarTurno(id: string, motivo: string) {
    if (!motivo || motivo.trim() === '') {
      this.mostrarMensaje('Debe ingresar un motivo para cancelar el turno.', 'error');
      return;
    }

    const { data: turno, error: errorGet } = await this.supabase.client
      .from('turnos')
      .select('estado')
      .eq('id', id)
      .single();

    if (errorGet || !turno) {
      this.mostrarMensaje('No se pudo obtener el estado del turno.', 'error');
      console.error(errorGet);
      return;
    }

    if (['cancelado', 'realizado', 'rechazado'].includes(turno.estado.toLowerCase())) {
      this.mostrarMensaje('Este turno ya no puede ser cancelado.', 'error');
      return;
    }

    const { error } = await this.supabase.client
      .from('turnos')
      .update({ estado: 'cancelado', comentario_cancelacion: motivo.trim() })
      .eq('id', id);

    if (!error) {
      this.mostrarMensaje('Turno cancelado correctamente.', 'success');
      this.cargarTurnos();
    } else {
      this.mostrarMensaje('Error al cancelar turno.', 'error');
      console.error(error);
    }
  }
}
