import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-turnos-admin',
  templateUrl: './turnos-admin.component.html',
  styleUrls: ['./turnos-admin.component.scss'],
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class TurnosAdminComponent implements OnInit {
  turnos: any[] = [];
  especialidades: string[] = [];
  especialistas: any[] = [];

  filtro = {
    especialidad: '',
    especialistaTexto: ''
  };

  private filtroSubject = new Subject<void>();

  constructor(private supabase: SupabaseService) {}

  ngOnInit() {
    this.cargarEspecialidades();
    this.cargarEspecialistas();
    this.cargarTurnos();

    this.filtroSubject.pipe(debounceTime(300)).subscribe(() => this.cargarTurnos());
  }

  async cargarEspecialidades() {
    const { data } = await this.supabase.client.from('especialidades').select('nombre');
    this.especialidades = data ? data.map((e: any) => e.nombre) : [];
  }

  async cargarEspecialistas() {
    const { data } = await this.supabase.client.from('especialistas').select('id, nombre, apellido');
    this.especialistas = data || [];
  }

  async cargarTurnos() {
    let query = this.supabase.client.from('turnos').select(`
      *,
      pacientes(nombre, apellido),
      especialistas(nombre, apellido)
    `);

    if (this.filtro.especialidad.trim()) {
      query = query.ilike('especialidad', `%${this.filtro.especialidad.trim()}%`);
    }

    if (this.filtro.especialistaTexto.trim()) {
      const { data, error } = await query.order('fecha', { ascending: true });
      if (!error && data) {
        this.turnos = data.filter(t => {
          const nombreCompleto = `${t.especialistas?.nombre ?? ''} ${t.especialistas?.apellido ?? ''}`.toLowerCase();
          return nombreCompleto.includes(this.filtro.especialistaTexto.trim().toLowerCase());
        });
      } else {
        this.turnos = [];
      }
      return;
    }

    const { data, error } = await query.order('fecha', { ascending: true });
    this.turnos = !error && data ? data : [];
  }

  onFiltroChange() {
    this.filtroSubject.next();
  }

  puedeCancelar(estado: string): boolean {
    return !['aceptado', 'realizado', 'rechazado', 'cancelado'].includes(estado);
  }

  async cancelarTurno(id: string) {
  const { data: turno, error: errorGet } = await this.supabase.client
    .from('turnos')
    .select('estado')
    .eq('id', id)
    .single();

  if (errorGet || !turno) {
    alert('No se pudo obtener el estado del turno.');
    return;
  }

  if (['cancelado', 'realizado', 'rechazado'].includes(turno.estado)) {
    alert('Este turno ya no puede ser cancelado.');
    return;
  }

  const motivo = prompt('Motivo de la cancelación:');
  if (!motivo || motivo.trim() === '') {
    alert('Debe ingresar un motivo.');
    return;
  }

  const { error } = await this.supabase.client
    .from('turnos')
    .update({ estado: 'cancelado', comentario_cancelacion: motivo.trim() })
    .eq('id', id);

  if (!error) {
    alert('Turno cancelado correctamente.');
    this.cargarTurnos();
  } else {
    console.error(error);
    alert('Error al cancelar turno: ' + error.message);
  }
}

}
