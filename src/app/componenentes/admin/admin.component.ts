import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { HistoriaClinicaService } from '../../core/historia-clinica.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class AdminComponent implements OnInit {
  especialistas: any[] = [];
  pacientes: any[] = [];

  historiaSeleccionada: any[] = [];
  pacienteSeleccionado: any = null;
  mostrarModal: boolean = false;

  constructor(
    private supabase: SupabaseService,
    private historiaService: HistoriaClinicaService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarEspecialistas();
    await this.cargarPacientes();
  }

  async cargarEspecialistas() {
    const { data } = await this.supabase.client.from('especialistas').select('*');
    this.especialistas = data || [];
  }

  async cargarPacientes() {
    const { data } = await this.supabase.client.from('pacientes').select('*');
    this.pacientes = data || [];
  }

  async aprobar(id: string) {
    await this.supabase.client.from('especialistas').update({ aprobado: true }).eq('id', id);
    await this.cargarEspecialistas();
  }

  async rechazar(id: string) {
    await this.supabase.client.from('especialistas').update({ aprobado: false }).eq('id', id);
    await this.cargarEspecialistas();
  }

  async verHistoria(paciente: any) {
    this.pacienteSeleccionado = paciente;
    try {
      this.historiaSeleccionada = await this.historiaService.obtenerHistoriasPorPaciente(paciente.id);
      this.mostrarModal = true;
    } catch (error) {
      console.error('Error al obtener historia clínica:', error);
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.pacienteSeleccionado = null;
    this.historiaSeleccionada = [];
  }

  irARegistroAdmin() {
    this.router.navigate(['/registro-admin']);
  }

async exportarUsuariosExcel() {
  const pacientes = await this.supabase.client
    .from('pacientes')
    .select('nombre, apellido, edad, dni, email');

  const especialistas = await this.supabase.client
    .from('especialistas')
    .select('nombre, apellido, edad, dni, email');

  const usuarios = [...(pacientes.data || []), ...(especialistas.data || [])];

  // Exportar
  const worksheet = XLSX.utils.json_to_sheet(usuarios);
  const workbook = { Sheets: { 'Usuarios': worksheet }, SheetNames: ['Usuarios'] };
  const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  FileSaver.saveAs(blob, `usuarios_${new Date().toISOString()}.xlsx`);
}
}
