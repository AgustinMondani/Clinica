// mi-perfil.component.ts
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HistoriaClinicaService } from '../../core/historia-clinica.service';

@Component({
  selector: 'app-mi-perfil',
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MiPerfilComponent implements OnInit {
  usuario: any = null;
  imagen1Url: string | null = null;
  imagen2Url: string | null = null;
  opciones: string[] = [];
  historias: any[] = [];

  constructor(private supabase: SupabaseService, private router: Router, private historiaService: HistoriaClinicaService,) {}

  async ngOnInit() {
    const user = await this.supabase.getUsuarioActual();
    this.usuario = user;
    const userId = await this.supabase.getUserId();
    this.historias = await this.historiaService.obtenerHistoriasPorPaciente(user.id);

    if (!user) return;

    const bucket = 'imagenes-usuarios'; // Reemplazar por el bucket real

    if (user.imagen1) {
      const { data } = this.supabase.client.storage.from(bucket).getPublicUrl(user.imagen1);
      this.imagen1Url = data.publicUrl;
    }
    if (user.imagen2) {
      const { data } = this.supabase.client.storage.from(bucket).getPublicUrl(user.imagen2);
      this.imagen2Url = data.publicUrl;
    }

    if (user.rol === 'admin') {
      this.opciones = ['Ver Turnos', 'Solicitar Turno', 'Usuarios'];
    } else if (user.rol === 'paciente') {
      this.opciones = ['Mis Turnos', 'Solicitar Turno'];
    } else if (user.rol === 'especialista') {
      this.opciones = ['Mis Turnos', 'Mis Horarios'];
    }
  }

  irA(ruta: string) {
  this.router.navigate([`/${ruta}`]);
}
}
