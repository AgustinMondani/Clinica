import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MostrarAdminDirective } from '../../directives/mostrar-admin.directive';

@Component({
  selector: 'app-solicitar-turno',
  templateUrl: './solicitar-turno.component.html',
  styleUrls: ['./solicitar-turno.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MostrarAdminDirective]
})
export class SolicitarTurnoComponent implements OnInit {
  especialidadBuscada: string = '';
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

  horariosPorDia: {
    [dia: string]: { desde: string; hasta: string }[]
  } = {};

  mensaje: string | null = null;
  tipoMensaje: 'error' | 'success' | 'info' | null = null;

  constructor(private supabase: SupabaseService) { }

  async ngOnInit() {
    const user = await this.supabase.getUsuarioActual();
    this.rolUsuario = user?.rol || '';

    if (this.rolUsuario === 'admin') {
      const { data, error } = await this.supabase.client
        .from('pacientes')
        .select('id, nombre, apellido');
      if (error) console.error('[ngOnInit] Error fetching pacientes:', error);
      this.pacientes = data || [];
    }
  }

  mostrarMensaje(texto: string, tipo: 'error' | 'success' | 'info' = 'info', duracionSegundos = 5) {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    setTimeout(() => {
      this.mensaje = null;
      this.tipoMensaje = null;
    }, duracionSegundos * 1000);
  }

  async buscarEspecialistas() {
    if (!this.especialidadBuscada.trim()) {
      this.mostrarMensaje('Ingrese una especialidad válida', 'error');
      return;
    }

    const { data, error } = await this.supabase.client
      .from('especialistas')
      .select('*, especialista_especialidad(especialidad:especialidades(nombre))');

    if (error) {
      console.error('[buscarEspecialistas] error:', error);
      return;
    }

    this.especialistas = (data || [])
      .filter((e: any) =>
        e.especialista_especialidad?.some(
          (esp: any) => esp.especialidad.nombre.toLowerCase() === this.especialidadBuscada.trim().toLowerCase()
        )
      )
      .map((e: any) => ({
        ...e,
        especialidades: e.especialista_especialidad.map((esp: any) => esp.especialidad.nombre)
      }));

    this.especialistaSeleccionado = null;
    this.especialidadSeleccionada = null;
    this.fechasDisponibles = [];
    this.fechaSeleccionada = null;
    this.horariosDisponibles = [];
    this.horarioSeleccionado = null;
    this.horariosPorDia = {};
  }

  async seleccionarEspecialista(esp: any) {
    this.especialistaSeleccionado = esp;

    if (esp.especialidades.length === 1) {
      this.especialidadSeleccionada = esp.especialidades[0];
      await this.cargarHorariosEspecialista();
      this.generarFechasDisponibles();
    } else {
      this.especialidadSeleccionada = null;
      this.fechasDisponibles = [];
      this.horariosPorDia = {};
      this.horariosDisponibles = [];
    }
  }

  async onEspecialidadChange() {
    if (this.especialidadSeleccionada) {
      await this.cargarHorariosEspecialista();
      this.generarFechasDisponibles();
    } else {
      this.fechasDisponibles = [];
      this.horariosPorDia = {};
      this.horariosDisponibles = [];
    }
  }

  async cargarHorariosEspecialista() {
    if (!this.especialistaSeleccionado || !this.especialidadSeleccionada) return;

    const { data, error } = await this.supabase.client
      .from('horarios_especialistas')
      .select('dia, desde, hasta')
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
      this.horariosPorDia[dia].push({ desde: item.desde, hasta: item.hasta });
    }

    console.log('[DEBUG] horariosPorDia:', this.horariosPorDia);
  }

  generarFechasDisponibles() {
    this.fechasDisponibles = [];
    const hoy = new Date();

    for (let i = 0; i <= 15; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);

      const diaTexto = this.getDiaTexto(fecha.getDay()).toLowerCase();

      if (this.horariosPorDia[diaTexto]) {

        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
////////////////////////
        this.fechasDisponibles.push({
          iso: `${year}-${month}-${day}`, // en formato YYYY-MM-DD, en horario local
          texto: fecha.toLocaleDateString('es-AR', {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        });
////////////////////////
        // this.fechasDisponibles.push({
        //   iso: fecha.toISOString().split('T')[0],
        //   texto: fecha.toLocaleDateString('es-AR', {
        //     weekday: 'long',
        //     year: 'numeric',
        //     month: 'short',
        //     day: 'numeric'
        //   })
        // });
      }
    }
  }

  async seleccionarFecha(fecha: string) {
    this.fechaSeleccionada = fecha;
    this.horariosDisponibles = [];
    //////////// Rompia porque me estaba tomando otra fecha horaria y me devolvia un dia antes
    const partes = fecha.split('-');
    const fechaLocal = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    const diaTexto = this.getDiaTexto(fechaLocal.getDay()).toLowerCase();
    //////////

    console.log(diaTexto);
    const horariosDelDia = this.horariosPorDia[diaTexto];

    if (!horariosDelDia || horariosDelDia.length === 0) {
      console.log("aca esta el error lpm ");
      console.log(horariosDelDia);
      console.log(this.horariosDisponibles);
      this.mostrarMensaje('No hay horarios disponibles para este día.', 'error');
      return;
    }

    const { data: turnosReservados, error } = await this.supabase.client
      .from('turnos')
      .select('horario')
      .eq('especialista_id', this.especialistaSeleccionado.id)
      .eq('fecha', fecha);

    if (error) {
      console.error('[seleccionarFecha] Error al obtener turnos reservados:', error);
      return;
    }

    const horariosOcupados = (turnosReservados || []).map(t => t.horario?.trim().substring(0, 5));

    const intervaloMinutos = 30;
    let posiblesHorarios: { hora: string; ocupado: boolean }[] = [];

    for (const rango of horariosDelDia) {
      const [desdeHora, desdeMin] = rango.desde.split(':').map(Number);
      const [hastaHora, hastaMin] = rango.hasta.split(':').map(Number);

      const desde = new Date(fecha);
      desde.setHours(desdeHora, desdeMin, 0, 0);

      const hasta = new Date(fecha);
      hasta.setHours(hastaHora, hastaMin, 0, 0);

      let actual = new Date(desde);

      while (actual < hasta) {
        const horaStr = actual.toTimeString().substring(0, 5);
        const ocupado = horariosOcupados.includes(horaStr);
        posiblesHorarios.push({
          hora: horaStr,
          ocupado
        });
        actual = new Date(actual.getTime() + intervaloMinutos * 60000);
      }
    }

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
      .eq('horario', this.horarioSeleccionado);

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
      paciente_id: pacienteId
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
    this.especialidadBuscada = '';
    this.especialistas = [];
    this.especialistaSeleccionado = null;
    this.especialidadSeleccionada = null;
    this.fechasDisponibles = [];
    this.fechaSeleccionada = null;
    this.horariosDisponibles = [];
    this.horarioSeleccionado = null;
    this.horariosPorDia = {};
    this.pacienteSeleccionado = null;
  }
}
