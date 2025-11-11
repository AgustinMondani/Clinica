import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoriaClinicaService } from '../../core/historia-clinica.service';
import { SupabaseService } from '../../core/supabase.service';
import { LoadingService } from '../../core/loading.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pacientes-especialista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pacientes-especialista.component.html',
  styleUrls: ['./pacientes-especialista.component.scss'],
})
export class PacientesEspecialistaComponent implements OnInit {
  historias: any[] = [];
  pacientes: any[] = [];
  pacienteSeleccionado: any = null;
  historiasPacienteSeleccionado: any[] = [];
  resenaSeleccionada: string | null = null;

  constructor(
    private historiaService: HistoriaClinicaService,
    private supabase: SupabaseService,
    private loading: LoadingService
  ) {}

  async ngOnInit() {
    this.loading.show();
    const especialistaId = await this.supabase.getUserId();

    const historias = await this.historiaService.obtenerHistoriasPorEspecialista(especialistaId!);

    const { data: pacientesDB } = await this.supabase.client
      .from('pacientes')
      .select('id, nombre, apellido, imagen1');

    const pacientesMap: Record<string, any> = {};
    pacientesDB?.forEach((p) => (pacientesMap[p.id] = p));

    const pacientesAtendidos: Record<string, any> = {};
    historias.forEach((h) => {
      const paciente = pacientesMap[h.paciente_id];
      if (paciente && !pacientesAtendidos[h.paciente_id]) {
        pacientesAtendidos[h.paciente_id] = paciente;
      }
    });

    this.historias = historias;
    this.pacientes = Object.values(pacientesAtendidos);
    this.loading.hide();
  }

  seleccionarPaciente(paciente: any) {
    this.pacienteSeleccionado = paciente;
    this.resenaSeleccionada = null;
    this.historiasPacienteSeleccionado = this.historias.filter(
      (h) => h.paciente_id === paciente.id
    );
  }

  volverALista() {
    this.pacienteSeleccionado = null;
    this.historiasPacienteSeleccionado = [];
  }

  mostrarResena(resena: string) {
    this.resenaSeleccionada = resena;
  }

  cerrarResena() {
    this.resenaSeleccionada = null;
  }
}
