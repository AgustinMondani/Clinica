import { Component, OnInit } from '@angular/core';
import { HistoriaClinicaService } from '../../core/historia-clinica.service';
import { SupabaseService } from '../../core/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-pacientes-especialista',
  templateUrl: './pacientes-especialista.component.html',
  styleUrls: ['./pacientes-especialista.component.scss'],
  imports: [FormsModule, CommonModule]
})
export class PacientesEspecialistaComponent implements OnInit {
  historias: any[] = [];
  pacientesMap: Record<string, { nombre: string; apellido: string }> = {};

  constructor(
    private historiaService: HistoriaClinicaService,
    private supabase: SupabaseService
  ) {}

  async ngOnInit() {
    const especialistaId = await this.supabase.getUserId();
    this.historias = await this.historiaService.obtenerHistoriasPorEspecialista(especialistaId!);
    this.pacientesMap = await this.supabase.cargarPacientes();
  }
}
