import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/supabase.service';
import { TurnoService } from '../../core/turno.service';
import { HistoriaClinicaService } from '../../core/historia-clinica.service';
import { ResaltarDirective } from '../../directives/resaltar.directive';

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

  altura: string = '';
  peso: string = '';
  temperatura: string = '';
  presion: string = '';
  resena: string = '';
  datosDinamicos: { clave: string; valor: string }[] = [{ clave: '', valor: '' }];

  constructor(
    private supabase: SupabaseService,
    private turnoService: TurnoService,
    private historiaService: HistoriaClinicaService
  ) {}

  async ngOnInit() {
    await this.refrescarTurnos();
    this.pacientesMap = await this.supabase.cargarPacientes();
  }

  private generarFechasUnicas() {
    const fechas = this.turnos.map(t => t.fecha);
    this.fechasUnicas = Array.from(new Set(fechas));
  }

  aplicarFiltro() {
    const f = (this.filtro || '').toLowerCase();
    this.filtrados = this.turnos.filter(t => {
      const paciente = this.pacientesMap[t.paciente_id];
      const nombrePaciente = paciente?.nombre?.toLowerCase() || '';
      const apellidoPaciente = paciente?.apellido?.toLowerCase() || '';
      const especialidad = t.especialidad?.toLowerCase() || '';
      const coincideTexto = especialidad.includes(f) || nombrePaciente.includes(f) || apellidoPaciente.includes(f);
      return coincideTexto;
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

    if (['cancelado','realizado','rechazado'].includes(turno.estado)) {
      this.mostrarMensaje('No puede cancelar este turno', 'error');
      return;
    }

    try {
      await this.turnoService.actualizarTurno(turno.id, {
        estado: 'cancelado',
        comentario_especialista: motivo.trim()
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
    if (this.datosDinamicos.length < 10) this.datosDinamicos.push({ clave: '', valor: '' });
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

  async refrescarTurnos() {
    const userId = await this.supabase.getUserId();
    const data = await this.turnoService.obtenerTurnosPorUsuario(userId!, 'especialista');
    this.turnos = data || [];
    this.generarFechasUnicas();
    this.aplicarFiltro();
  }

  verResena(turno: any) {
    this.mostrarMensaje(`Reseña: ${turno.resena}`, 'info');
  }

  obtenerMotivo(turno: any): string | null {
    return turno.comentario_especialista || turno.comentario_paciente || turno.comentario_cancelacion || null;
  }
}
