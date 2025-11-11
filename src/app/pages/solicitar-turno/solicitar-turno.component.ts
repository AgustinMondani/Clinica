import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MostrarAdminDirective } from '../../directives/mostrar-admin.directive';
import { LoadingService } from '../../core/loading.service';

@Component({
  selector: 'app-solicitar-turno',
  templateUrl: './solicitar-turno.component.html',
  styleUrls: ['./solicitar-turno.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MostrarAdminDirective]
})
export class SolicitarTurnoComponent implements OnInit {
  especialidades: any[] = [];
  especialistas: any[] = [];
  especialistaSeleccionado: any = null;
  especialidadSeleccionada: string | null = null;

  fechasDisponibles: { iso: string; texto: string }[] = [];
  horariosDisponibles: { hora: string; ocupado: boolean }[] = [];
  fechaSeleccionada: string | null = null;
  horarioSeleccionado: string | null = null;

  rolUsuario: string = '';
  pacientes: any[] = [];
  pacienteSeleccionado: string | null = null;

  horariosPorDia: { [dia: string]: { desde: string; hasta: string; duracion: number }[] } = {};

  mensaje: string | null = null;
  tipoMensaje: 'error' | 'success' | 'info' | null = null;

  constructor(private supabase: SupabaseService, private loading: LoadingService) {}

  async ngOnInit() {
    this.loading.show();
    const user = await this.supabase.getUsuarioActual();
    this.rolUsuario = user?.rol || '';
    const { data: espData, error: espError } = await this.supabase.client
      .from('especialidades')
      .select('nombre, imagen');
    if (espError) console.error('Error fetching especialidades:', espError);
    this.especialidades = espData || [];

    const { data: especData, error: especError } = await this.supabase.client
      .from('especialistas')
      .select('*, especialista_especialidad(especialidad:especialidades(nombre))');
    if (especError) console.error('Error fetching especialistas:', especError);
    this.especialistas = (especData || []).map((e: any) => ({
      ...e,
      especialidades: e.especialista_especialidad.map((esp: any) => esp.especialidad.nombre)
    }));

    if (this.rolUsuario === 'admin') {
      const { data, error } = await this.supabase.client
        .from('pacientes')
        .select('id, nombre, apellido');
      if (error) console.error('[ngOnInit] Error fetching pacientes:', error);
      this.pacientes = data || [];
    }
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

  especialistasFiltrados() {
    if (!this.especialidadSeleccionada) return [];
    return this.especialistas.filter((esp: any) =>
      esp.especialidades.includes(this.especialidadSeleccionada!)
    );
  }

  seleccionarEspecialidad(nombre: string) {
    this.especialidadSeleccionada = nombre;
    this.especialistaSeleccionado = null;
    this.fechasDisponibles = [];
    this.horariosDisponibles = [];
  }

  async seleccionarEspecialista(esp: any) {
    this.especialistaSeleccionado = esp;
    await this.cargarHorariosEspecialista();
    this.generarFechasDisponibles();
    this.fechaSeleccionada = null;
    this.horarioSeleccionado = null;
  }

  async onEspecialidadChange() {
    if (this.especialidadSeleccionada) {
      this.especialistaSeleccionado = null;
      this.fechasDisponibles = [];
      this.horariosDisponibles = [];
    }
  }

  private timeStringToDate(fecha: Date, timeStr: string) {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(fecha);
    d.setHours(h, m, 0, 0);
    return d;
  }

  private minDate(a: Date, b: Date) {
    return a.getTime() <= b.getTime() ? a : b;
  }

  async cargarHorariosEspecialista() {
    if (!this.especialistaSeleccionado || !this.especialidadSeleccionada) return;

    const { data, error } = await this.supabase.client
      .from('horarios_especialistas')
      .select('dia, desde, hasta, duracion')
      .eq('especialista_id', this.especialistaSeleccionado.id)
      .eq('especialidad', this.especialidadSeleccionada.toLowerCase());

    if (error) {
      console.error('[cargarHorariosEspecialista] error:', error);
      return;
    }

    this.horariosPorDia = {};
    for (const item of data || []) {
      const dia = item.dia.toLowerCase();
      if (!this.horariosPorDia[dia]) this.horariosPorDia[dia] = [];
      const duracionMin = item.duracion != null ? Number(item.duracion) : 30;
      const desde = (item.desde || '').toString().substring(0,5);
      const hasta = (item.hasta || '').toString().substring(0,5);
      this.horariosPorDia[dia].push({ desde, hasta, duracion: duracionMin });
    }
  }

  generarFechasDisponibles() {
    this.fechasDisponibles = [];
    const hoy = new Date();

    for (let i = 0; i <= 15; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);

      const diaTexto = this.getDiaTexto(fecha.getDay()).toLowerCase();

      if (this.horariosPorDia[diaTexto] && this.horariosPorDia[diaTexto].length > 0) {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');

        this.fechasDisponibles.push({
          iso: `${year}-${month}-${day}`,
          texto: fecha.toLocaleDateString('es-AR', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })
        });
      }
    }
  }

  async seleccionarFecha(fecha: string) {
    this.fechaSeleccionada = fecha;
    this.horariosDisponibles = [];

    const partes = fecha.split('-');
    const fechaLocal = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    const diaTexto = this.getDiaTexto(fechaLocal.getDay()).toLowerCase();

    const horariosDelDia = this.horariosPorDia[diaTexto];
    if (!horariosDelDia || horariosDelDia.length === 0) {
      this.mostrarMensaje('No hay horarios disponibles para este día.', 'error');
      return;
    }

 
    const { data: turnosReservados, error } = await this.supabase.client
      .from('turnos')
      .select('horario, estado')
      .eq('especialista_id', this.especialistaSeleccionado.id)
      .eq('fecha', fecha)
      .neq('estado', 'cancelado'); 

    if (error) {
      console.error('[seleccionarFecha] Error al obtener turnos reservados:', error);
      return;
    }

    const horariosOcupados = (turnosReservados || []).map((t: any) => t.horario?.trim().substring(0, 5));

    const dayNum = fechaLocal.getDay();
    let cierreClinicaStr = '19:00';
    if (dayNum === 6) cierreClinicaStr = '14:00';
    else if (dayNum === 0) cierreClinicaStr = '19:00';

    const cierreClinicaDate = this.timeStringToDate(fechaLocal, cierreClinicaStr);

    let posiblesHorarios: { hora: string; ocupado: boolean }[] = [];

    for (const rango of horariosDelDia) {
      const desdeDate = this.timeStringToDate(fechaLocal, rango.desde);
      const hastaDate = this.timeStringToDate(fechaLocal, rango.hasta);
      const limiteFinal = this.minDate(hastaDate, cierreClinicaDate);
      if (limiteFinal.getTime() <= desdeDate.getTime()) continue;

      let actual = new Date(desdeDate);
      const duracionMs = rango.duracion * 60 * 1000;

      while ((actual.getTime() + duracionMs) <= limiteFinal.getTime()) {
        const horaStr = actual.toTimeString().substring(0, 5);
        if (!posiblesHorarios.some(h => h.hora === horaStr)) {
          posiblesHorarios.push({ hora: horaStr, ocupado: horariosOcupados.includes(horaStr) });
        }
        actual = new Date(actual.getTime() + duracionMs);
      }
    }

    posiblesHorarios.sort((a, b) => a.hora.localeCompare(b.hora));
    this.horariosDisponibles = posiblesHorarios;
  }

  getDiaTexto(numero: number): string {
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sabado'];
    return dias[numero];
  }

  async confirmarTurno() {
    const pacienteId = this.rolUsuario === 'admin' ? this.pacienteSeleccionado : (await this.supabase.getUsuarioActual())?.id;

    if (!this.fechaSeleccionada || !this.horarioSeleccionado) {
      this.mostrarMensaje('Debe seleccionar fecha y horario.', 'error');
      return;
    }

    const horarioSeleccionadoOcupado = this.horariosDisponibles.find(h => h.hora === this.horarioSeleccionado)?.ocupado;
    if (horarioSeleccionadoOcupado) {
      this.mostrarMensaje('Ese horario ya está ocupado. Por favor, elija otro.', 'error');
      return;
    }

    if (this.rolUsuario === 'admin' && !this.pacienteSeleccionado) {
      this.mostrarMensaje('Debe seleccionar un paciente.', 'error');
      return;
    }

    const { data: turnosExistentes, error: errorVerificacion } = await this.supabase.client
      .from('turnos')
      .select('*')
      .eq('especialista_id', this.especialistaSeleccionado.id)
      .eq('fecha', this.fechaSeleccionada)
      .eq('horario', this.horarioSeleccionado)
      .neq('estado', 'cancelado');

    if (errorVerificacion) {
      console.error('[confirmarTurno] Error al verificar duplicados:', errorVerificacion);
      this.mostrarMensaje('Error al verificar disponibilidad del turno', 'error');
      return;
    }

    if (turnosExistentes && turnosExistentes.length > 0) {
      this.mostrarMensaje('Este turno ya fue reservado. Por favor, elija otro horario.', 'error');
      return;
    }

    const { error } = await this.supabase.client.from('turnos').insert({
      especialista_id: this.especialistaSeleccionado.id,
      especialidad: this.especialidadSeleccionada,
      fecha: this.fechaSeleccionada,
      horario: this.horarioSeleccionado,
      paciente_id: pacienteId,
      estado: 'pendiente' 
    });

    if (error) {
      this.mostrarMensaje('Error al confirmar turno', 'error');
      console.error(error);
    } else {
      this.mostrarMensaje('Turno confirmado con éxito', 'success');
      this.resetForm();
    }
  }

  private resetForm() {
    this.especialidadSeleccionada = null;
    this.especialistaSeleccionado = null;
    this.fechasDisponibles = [];
    this.fechaSeleccionada = null;
    this.horariosDisponibles = [];
    this.horarioSeleccionado = null;
    this.horariosPorDia = {};
    this.pacienteSeleccionado = null;
  }
  
}
