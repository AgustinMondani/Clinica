import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mis-horarios',
  templateUrl: './mis-horarios.component.html',
  styleUrls: ['./mis-horarios.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MisHorariosComponent implements OnInit {
  especialidades: string[] = [];
  diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

  nueva: any = {
    especialidad: '',
    dias: [] as string[],
    hora_desde: '',
    hora_hasta: ''
  };

  horarios: any[] = [];

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    const user = await this.supabase.getUsuarioActual();
    const userId = user?.id;

    if (!userId) return;

    const { data, error } = await this.supabase.client
      .from('especialista_especialidad')
      .select('especialidad:especialidades(nombre)')
      .eq('especialista_id', userId);

    if (error) {
      console.error('Error al obtener especialidades:', error);
    }

    this.especialidades = data?.map((e: any) => e.especialidad.nombre) || [];

    await this.cargarHorarios();
  }

  async cargarHorarios() {
    const userId = await this.supabase.getUserId();

    const { data, error } = await this.supabase.client
      .from('horarios_especialistas')
      .select('*')
      .eq('especialista_id', userId);

    if (error) {
      console.error('Error al cargar horarios:', error);
    }

    this.horarios = data || [];
  }

  toggleDiaSeleccionado(event: any) {
    const dia = event.target.value;
    if (event.target.checked) {
      this.nueva.dias.push(dia);
    } else {
      this.nueva.dias = this.nueva.dias.filter((d: string) => d !== dia);
    }
  }

  async agregarHorario() {
    const userId = await this.supabase.getUserId();

    if (this.nueva.dias.length === 0) {
      return;
    }

  
   const horariosParaInsertar = this.nueva.dias.map((dia: string) => ({
  especialista_id: userId,
  especialidad: this.nueva.especialidad,
  dia,
  desde: this.nueva.hora_desde,
  hasta: this.nueva.hora_hasta
}));


    const { error } = await this.supabase.client
      .from('horarios_especialistas')
      .insert(horariosParaInsertar);

    if (error) {
      alert('Error al agregar horarios: ' + error.message);
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

