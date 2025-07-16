import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { TurnoService } from '../../core/turno.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoriaClinicaService } from '../../core/historia-clinica.service';
import { ResaltarDirective } from '../../directives/resaltar.directive';

@Component({
  selector: 'app-mis-turnos-especialista',
  templateUrl: './mis-turnos-especialista.component.html',
  styleUrls: ['./mis-turnos-especialista.component.scss'],
  imports: [CommonModule, FormsModule, ResaltarDirective],
  standalone: true
})
export class MisTurnosEspecialistaComponent implements OnInit {
  turnos: any[] = [];
  filtrados: any[] = [];
  filtro: string = '';
  filtroFecha: string = '';
  filtroEstado: string = '';
  fechasUnicas: string[] = [];

  pacientesMap: Record<string, { nombre: string; apellido: string }> = {};

  modalVisible: boolean = false;
  turnoSeleccionado: any = null;

  altura: string = '';
  peso: string = '';
  temperatura: string = '';
  presion: string = '';
  datosDinamicos: { clave: string; valor: string }[] = [{ clave: '', valor: '' }];

  modalMotivoVisible: boolean = false;
  motivo: string = '';
  accionMotivo: 'rechazar' | 'cancelar' | null = null;
  turnoConMotivo: any = null;

  modalMensajeVisible: boolean = false;
  mensajeModal: string = '';

  modalResenaVisible: boolean = false;
  resenaMostrar: string = '';

  constructor(
    private supabase: SupabaseService,
    private turnoService: TurnoService,
    private historiaService: HistoriaClinicaService
  ) {}

  async ngOnInit() {
    const userId = await this.supabase.getUserId();
    const data = await this.turnoService.obtenerTurnosPorUsuario(userId!, 'especialista');
    this.turnos = data || [];
    this.pacientesMap = await this.supabase.cargarPacientes();

    this.generarFechasUnicas();
    this.aplicarFiltro();
  }

  generarFechasUnicas() {
    const fechas = this.turnos.map(t => t.fecha);
    this.fechasUnicas = Array.from(new Set(fechas));
  }

  aplicarFiltro() {
    const f = this.filtro.toLowerCase();

    this.filtrados = this.turnos.filter(t => {
      const paciente = this.pacientesMap[t.paciente_id];
      const nombrePaciente = paciente?.nombre?.toLowerCase() || '';
      const apellidoPaciente = paciente?.apellido?.toLowerCase() || '';
      const especialidad = t.especialidad?.toLowerCase() || '';
      const nombreTurno = t.nombre_paciente?.toLowerCase() || '';
      const id = t.paciente_id?.toLowerCase() || '';

      const coincideTexto =
        especialidad.includes(f) ||
        nombreTurno.includes(f) ||
        id.includes(f) ||
        nombrePaciente.includes(f) ||
        apellidoPaciente.includes(f);

      const coincideFecha = this.filtroFecha ? t.fecha === this.filtroFecha : true;
      const coincideEstado = this.filtroEstado ? t.estado === this.filtroEstado : true;

      return coincideTexto && coincideFecha && coincideEstado;
    });
  }

  limpiarFiltros() {
    this.filtro = '';
    this.filtroFecha = '';
    this.filtroEstado = '';
    this.aplicarFiltro();
  }

  async aceptarTurno(turno: any) {
    await this.turnoService.actualizarTurno(turno.id, { estado: 'aceptado' });
    await this.refrescarTurnos();
    this.mostrarMensaje('Turno aceptado con éxito');
  }

  abrirModalMotivo(accion: 'rechazar' | 'cancelar', turno: any) {
    this.accionMotivo = accion;
    this.turnoConMotivo = turno;
    this.motivo = '';
    this.modalMotivoVisible = true;
  }

  async enviarMotivo() {
    if (!this.motivo.trim()) {
      this.mostrarMensaje('Debe ingresar un motivo.');
      return;
    }

    if (!this.turnoConMotivo || !this.accionMotivo) {
      this.modalMotivoVisible = false;
      return;
    }

    const estado = this.accionMotivo === 'rechazar' ? 'rechazado' : 'cancelado';

    await this.turnoService.actualizarTurno(this.turnoConMotivo.id, {
      estado,
      comentario_especialista: this.motivo.trim()
    });

    this.modalMotivoVisible = false;
    await this.refrescarTurnos();
    this.mostrarMensaje(`Turno ${estado} con éxito.`);
  }

  async cancelarTurno(turno: any) {
    this.abrirModalMotivo('cancelar', turno);
  }

  async rechazarTurno(turno: any) {
    this.abrirModalMotivo('rechazar', turno);
  }

  abrirModalFinalizarTurno(turno: any) {
    this.turnoSeleccionado = turno;

    this.altura = '';
    this.peso = '';
    this.temperatura = '';
    this.presion = '';
    this.datosDinamicos = [{ clave: '', valor: '' }];

    this.modalVisible = true;
  }

  cerrarModal() {
    this.modalVisible = false;
    this.turnoSeleccionado = null;
  }

  agregarDatoDinamico() {
    if (this.datosDinamicos.length < 3) {
      this.datosDinamicos.push({ clave: '', valor: '' });
    }
  }

  eliminarDatoDinamico(index: number) {
    this.datosDinamicos.splice(index, 1);
  }

  async guardarHistoriaClinica() {
    if (!this.turnoSeleccionado) return;

    if (!this.altura || !this.peso || !this.temperatura || !this.presion) {
      this.mostrarMensaje('Complete todos los datos fijos de la historia clínica.');
      return;
    }

    const especialista_id = await this.supabase.getUserId();
    const paciente_id = this.turnoSeleccionado.paciente_id;
    const turno_id = this.turnoSeleccionado.id;

    const historiaClinica = {
      paciente_id,
      especialista_id,
      turno_id,
      altura: this.altura,
      peso: this.peso,
      temperatura: this.temperatura,
      presion: this.presion,
      datos_dinamicos: this.datosDinamicos.filter(d => d.clave && d.valor)
    };

    try {
      await this.historiaService.crearHistoria(historiaClinica);
      await this.turnoService.actualizarTurno(turno_id, { estado: 'realizado' });
      this.modalVisible = false;
      this.mostrarMensaje('Historia clínica guardada exitosamente');
      await this.refrescarTurnos();
    } catch (error) {
      console.error('Error al guardar historia clínica:', error);
      this.mostrarMensaje('Ocurrió un error al guardar la historia clínica');
    }
  }

  mostrarMensaje(texto: string) {
    this.mensajeModal = texto;
    this.modalMensajeVisible = true;
  }

  cerrarModalMensaje() {
    this.modalMensajeVisible = false;
    this.mensajeModal = '';
  }

  async refrescarTurnos() {
    const userId = await this.supabase.getUserId();
    const data = await this.turnoService.obtenerTurnosPorUsuario(userId!, 'especialista');
    this.turnos = data || [];
    this.generarFechasUnicas();
    this.aplicarFiltro();
  }

  verResena(turno: any) {
    this.resenaMostrar = turno.resena;
    this.modalResenaVisible = true;
  }

  cerrarModalResena() {
    this.modalResenaVisible = false;
    this.resenaMostrar = '';
  }
}
