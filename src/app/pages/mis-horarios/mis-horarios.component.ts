import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mis-horarios',
  templateUrl: './mis-horarios.component.html',
  styleUrls: ['./mis-horarios.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class MisHorariosComponent implements OnInit {
  especialidades: string[] = [];
  diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

  nueva: any = {
    especialidad: '',
    dias: [] as string[],
    hora_desde: '',
    hora_hasta: '',
  };

  horarios: any[] = [];
  mensajeError = '';
  horasDisponibles: string[] = [];

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    const user = await this.supabase.getUsuarioActual();
    const userId = user?.id;
    if (!userId) return;

    const { data, error } = await this.supabase.client
      .from('especialista_especialidad')
      .select('especialidad:especialidades(nombre)')
      .eq('especialista_id', userId);

    if (error) console.error('Error al obtener especialidades:', error);

    this.especialidades = data?.map((e: any) => e.especialidad.nombre) || [];
    this.generarHorasDisponibles('lunes'); // Por defecto
    await this.cargarHorarios();
  }

  async cargarHorarios() {
    const userId = await this.supabase.getUserId();
    const { data, error } = await this.supabase.client
      .from('horarios_especialistas')
      .select('*')
      .eq('especialista_id', userId);

    if (error) console.error('Error al cargar horarios:', error);
    this.horarios = data || [];
  }

  toggleDiaSeleccionado(event: any) {
    const dia = event.target.value;
    if (event.target.checked) {
      this.nueva.dias.push(dia);
      if (this.nueva.dias.length === 1) {
        this.generarHorasDisponibles(dia);
      }
    } else {
      this.nueva.dias = this.nueva.dias.filter((d: string) => d !== dia);
      if (this.nueva.dias.length > 0) {
        this.generarHorasDisponibles(this.nueva.dias[0]);
      }
    }
  }

  generarHorasDisponibles(dia: string) {
    let inicio = 8;
    let fin = dia === 'sabado' ? 14 : 19;
    const horas: string[] = [];

    for (let h = inicio; h <= fin; h++) {
      for (let m of [0, 15, 30, 45]) {
        if (h === fin && m > 0) continue;
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        horas.push(`${hh}:${mm}`);
      }
    }

    this.horasDisponibles = horas;
  }

  seSuperpone(nuevoDesde: string, nuevoHasta: string, existentes: any[]): boolean {
    return existentes.some((h) => {
      return nuevoDesde < h.hasta && nuevoHasta > h.desde;
    });
  }

  convertirHoraADecimal(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h + m / 60;
  }

  validarHorarioPorDia(dia: string, desde: string, hasta: string): boolean {
    const horaDesde = this.convertirHoraADecimal(desde);
    const horaHasta = this.convertirHoraADecimal(hasta);
    const inicio = 8;
    const fin = dia === 'sabado' ? 14 : 19;

    return horaDesde >= inicio && horaHasta <= fin && horaDesde < horaHasta;
  }

  async agregarHorario() {
    this.mensajeError = '';
    const userId = await this.supabase.getUserId();

    if (!this.nueva.especialidad || this.nueva.dias.length === 0) {
      this.mensajeError = 'Debe seleccionar al menos una especialidad y un día.';
      return;
    }

    if (this.nueva.hora_desde >= this.nueva.hora_hasta) {
      this.mensajeError = 'La hora de inicio debe ser menor que la hora de fin.';
      return;
    }

    // ✅ Validación de rango por día
    for (const dia of this.nueva.dias) {
      if (!this.validarHorarioPorDia(dia, this.nueva.hora_desde, this.nueva.hora_hasta)) {
        this.mensajeError = `El horario del ${dia} está fuera del rango permitido.`;
        return;
      }
    }

    // ✅ Verificación de superposición
    for (let dia of this.nueva.dias) {
      const { data: existentes } = await this.supabase.client
        .from('horarios_especialistas')
        .select('*')
        .eq('especialista_id', userId)
        .eq('dia', dia);

      if (existentes && this.seSuperpone(this.nueva.hora_desde, this.nueva.hora_hasta, existentes)) {
        this.mensajeError = `El rango horario ${this.nueva.hora_desde} - ${this.nueva.hora_hasta} se superpone con otro horario del ${dia}.`;
        return;
      }
    }

    // ✅ Inserción si pasa todas las validaciones
    const horariosParaInsertar = this.nueva.dias.map((dia: string) => ({
      especialista_id: userId,
      especialidad: this.nueva.especialidad,
      dia,
      desde: this.nueva.hora_desde,
      hasta: this.nueva.hora_hasta,
    }));

    const { error } = await this.supabase.client
      .from('horarios_especialistas')
      .insert(horariosParaInsertar);

    if (error) {
      this.mensajeError = 'Error al agregar horarios: ' + error.message;
      return;
    }

    this.nueva = { especialidad: '', dias: [], hora_desde: '', hora_hasta: '' };
    await this.cargarHorarios();
  }

  async eliminarHorario(id: string) {
    await this.supabase.client.from('horarios_especialistas').delete().eq('id', id);
    await this.cargarHorarios();
  }
}
