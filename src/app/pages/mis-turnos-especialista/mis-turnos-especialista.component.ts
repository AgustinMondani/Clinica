import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/supabase.service';
import { TurnoService } from '../../core/turno.service';
import { HistoriaClinicaService } from '../../core/historia-clinica.service';
import { ResaltarDirective } from '../../directives/resaltar.directive';
import { LoadingService } from '../../core/loading.service';

@Component({
  selector: 'app-mis-turnos-especialista',
  templateUrl: './mis-turnos-especialista.component.html',
  styleUrls: ['./mis-turnos-especialista.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ResaltarDirective]
})
export class MisTurnosEspecialistaComponent implements OnInit {
  turnos: any[] = [];
  filtrados: any[] = [];
  filtro: string = '';
  fechasUnicas: string[] = [];

  pacientesMap: Record<string, { nombre: string; apellido: string }> = {};

  mensaje: string = '';
  tipoMensaje: 'error' | 'success' | 'info' = 'info';

  motivosRechazo: Record<string, string> = {};
  motivosCancelacion: Record<string, string> = {};

  modalVisible: boolean = false;
  turnoSeleccionado: any = null;

  modalResenaVisible: boolean = false;
  resenaTurno: any = null;
  encuestaPretty: string = '';
  comentarioPaciente: string = '';

  altura: string = '';
  peso: string = '';
  temperatura: string = '';
  presion: string = '';
  resena: string = '';
  datosDinamicos: { clave: string; valor: string }[] = [{ clave: '', valor: '' }];

  constructor(
    private supabase: SupabaseService,
    private turnoService: TurnoService,
    private historiaService: HistoriaClinicaService,
    private loading: LoadingService
  ) {}

  async ngOnInit() {
    this.loading.show();
    await this.refrescarTurnos();
    this.pacientesMap = await this.supabase.cargarPacientes();
    this.loading.hide();
  }

  private generarFechasUnicas() {
    const fechas = this.turnos.map(t => String(t.fecha));
    this.fechasUnicas = Array.from(new Set(fechas));
  }

  aplicarFiltro() {
    const f = (this.filtro || '').toLowerCase().trim();

    if (!f) {
      this.filtrados = [...this.turnos];
      return;
    }

    this.filtrados = this.turnos.filter(t => {
      const paciente = this.pacientesMap[t.paciente_id];
      const nombrePaciente = (paciente?.nombre || '').toLowerCase();
      const apellidoPaciente = (paciente?.apellido || '').toLowerCase();
      const especialidad = (t.especialidad || '').toString().toLowerCase();
      const fecha = (t.fecha || '').toString().toLowerCase();
      const horario = (t.horario || '').toString().toLowerCase();
      const estado = (t.estado || '').toLowerCase();
      const resena = (t.resena || '').toString().toLowerCase();
      const calificacion = t.calificacion !== null && t.calificacion !== undefined ? String(t.calificacion).toLowerCase() : '';
      const encuesta = t.encuesta ? JSON.stringify(t.encuesta).toLowerCase() : '';

      return (
        especialidad.includes(f) ||
        nombrePaciente.includes(f) ||
        apellidoPaciente.includes(f) ||
        fecha.includes(f) ||
        horario.includes(f) ||
        estado.includes(f) ||
        resena.includes(f) ||
        calificacion.includes(f) ||
        encuesta.includes(f)
      );
    });
  }

  limpiarFiltro() {
    this.filtro = '';
    this.aplicarFiltro();
    this.mensaje = '';
  }

  mostrarMensaje(texto: string, tipo: 'error' | 'success' | 'info' = 'info') {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    setTimeout(() => { this.mensaje = ''; }, 5000);
  }

  async aceptarTurno(turno: any) {
    try {
      await this.turnoService.actualizarTurno(turno.id, { estado: 'aceptado' });
      this.motivosRechazo[turno.id] = '';
      this.motivosCancelacion[turno.id] = '';
      await this.refrescarTurnos();
      this.mostrarMensaje('Turno aceptado con éxito', 'success');
    } catch (err) {
      console.error(err);
      this.mostrarMensaje('Error al aceptar turno', 'error');
    }
  }

  async rechazarTurno(turno: any) {
  const motivo = this.motivosRechazo[turno.id];
  if (!motivo || !motivo.trim()) {
    this.mostrarMensaje('Debe ingresar un motivo para rechazar el turno', 'error');
    return;
  }
  if (['rechazado', 'realizado', 'cancelado', 'aceptado'].includes(turno.estado)) {
    this.mostrarMensaje('No puede rechazar este turno', 'error');
    return;
  }

  try {
    await this.turnoService.actualizarTurno(turno.id, {
      estado: 'rechazado',
      comentario_especialista: motivo.trim()
    });
    this.motivosRechazo[turno.id] = '';
    await this.refrescarTurnos();
    this.mostrarMensaje('Turno rechazado con éxito', 'success');
  } catch (err) {
    console.error(err);
    this.mostrarMensaje('Error al rechazar turno', 'error');
  }
}


  async cancelarTurno(turno: any) {
    const motivo = this.motivosCancelacion[turno.id];
    if (!motivo || !motivo.trim()) {
      this.mostrarMensaje('Debe ingresar un motivo para cancelar el turno', 'error');
      return;
    }
    if (['realizado','rechazado','cancelado'].includes(turno.estado)) {
      this.mostrarMensaje('No puede cancelar este turno', 'error');
      return;
    }

    try {
      await this.turnoService.actualizarTurno(turno.id, {
        estado: 'cancelado',
        comentario_cancelacion: motivo.trim()
      });
      this.motivosCancelacion[turno.id] = '';
      await this.refrescarTurnos();
      this.mostrarMensaje('Turno cancelado con éxito', 'success');
    } catch (err) {
      console.error(err);
      this.mostrarMensaje('Error al cancelar turno', 'error');
    }
  }

  abrirModalFinalizarTurno(turno: any) {
    this.turnoSeleccionado = turno;
    this.altura = '';
    this.peso = '';
    this.temperatura = '';
    this.presion = '';
    this.resena = '';
    this.datosDinamicos = [{ clave: '', valor: '' }];
    this.modalVisible = true;
  }

  cerrarModal() {
    this.modalVisible = false;
    this.turnoSeleccionado = null;
  }

  agregarDatoDinamico() {
    if (this.datosDinamicos.length < 3) this.datosDinamicos.push({ clave: '', valor: '' });
  }

  eliminarDatoDinamico(index: number) {
    this.datosDinamicos.splice(index, 1);
  }

  async guardarHistoriaClinica() {
    if (!this.turnoSeleccionado) return;

    if (!this.altura || !this.peso || !this.temperatura || !this.presion || !this.resena) {
      this.mostrarMensaje('Complete todos los campos obligatorios', 'error');
      return;
    }

    const especialista_id = await this.supabase.getUserId();
    const historia = {
      paciente_id: this.turnoSeleccionado.paciente_id,
      especialista_id,
      turno_id: this.turnoSeleccionado.id,
      altura: this.altura,
      peso: this.peso,
      temperatura: this.temperatura,
      presion: this.presion,
      datos_dinamicos: this.datosDinamicos.filter(d => d.clave && d.valor)
    };

    try {
      await this.historiaService.crearHistoria(historia);
      await this.turnoService.actualizarTurno(this.turnoSeleccionado.id, {
        estado: 'realizado',
        resena: this.resena.trim()
      });
      this.cerrarModal();
      this.mostrarMensaje('Turno finalizado y reseña guardada', 'success');
      await this.refrescarTurnos();
    } catch (err) {
      console.error(err);
      this.mostrarMensaje('Error al guardar historia clínica', 'error');
    }
  }

  abrirModalResena(turno: any) {
  this.resenaTurno = turno;

  this.comentarioPaciente = turno?.comentario_paciente || '';

  if (turno?.encuesta) {
    try {
      this.encuestaPretty = JSON.stringify(turno.encuesta, null, 2);
    } catch (e) {
      this.encuestaPretty = String(turno.encuesta);
    }
  } else {
    this.encuestaPretty = '';
  }

  this.modalResenaVisible = true;
}

  cerrarModalResena() {
  this.modalResenaVisible = false;
  this.resenaTurno = null;
  this.encuestaPretty = '';
  this.comentarioPaciente = '';
}

  async refrescarTurnos() {
    try {
      const userId = await this.supabase.getUserId();
      const data = await this.turnoService.obtenerTurnosPorUsuario(userId!, 'especialista');
      this.turnos = data || [];
      this.generarFechasUnicas();
      this.aplicarFiltro();
    } catch (err) {
      console.error(err);
      this.mostrarMensaje('Error al cargar turnos', 'error');
    }
  }

  verResena(turno: any) {
    this.abrirModalResena(turno);
  }

  obtenerMotivo(turno: any): string | null {
    return turno.comentario_especialista || turno.comentario_paciente || turno.comentario_cancelacion || null;
  }
}
