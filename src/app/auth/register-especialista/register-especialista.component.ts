import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { AuthService } from '../../core/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-especialista',
  templateUrl: './register-especialista.component.html',
  styleUrls: ['./register-especialista.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class RegisterEspecialistaComponent implements OnInit {
  nombre = '';
  apellido = '';
  edad = 0;
  dni = '';
  email = '';
  password = '';
  imagenFile: File | null = null;

  especialidades: any[] = [];
  especialidadesSeleccionadas: number[] = [];
  nuevaEspecialidad = '';

  errorImagen = '';

  constructor(private supabase: SupabaseService, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.cargarEspecialidades();
  }

  async cargarEspecialidades() {
    const { data } = await this.supabase.client.from('especialidades').select('*');
    this.especialidades = data || [];
  }

  toggleEspecialidad(id: number) {
    const index = this.especialidadesSeleccionadas.indexOf(id);
    if (index === -1) {
      this.especialidadesSeleccionadas.push(id);
    } else {
      this.especialidadesSeleccionadas.splice(index, 1);
    }
  }

  handleImage(event: any) {
    const file = event.target.files[0];
    if (file && !file.type.startsWith('image/')) {
      this.errorImagen = 'El archivo debe ser una imagen válida.';
      this.imagenFile = null;
    } else {
      this.errorImagen = '';
      this.imagenFile = file;
    }
  }

  async registrarEspecialista() {
    if(this.errorImagen) return;

    const { data, error } = await this.auth.register(this.email, this.password);
    if (error) {

      console.error('Error al registrar usuario:', error.message);
      return;
    }

    const uid = data.user?.id;

    let urlImagen = '';
    if (this.imagenFile) {
      const { data: img } = await this.supabase.client.storage
        .from('imagenes')
        .upload(`especialistas/${uid}.jpg`, this.imagenFile, { upsert: true });
      urlImagen = `https://your-project-url.supabase.co/storage/v1/object/public/imagenes/${img?.path}`;
    }

    if (this.nuevaEspecialidad.trim() !== '') {
      const { data: nueva } = await this.supabase.client
        .from('especialidades')
        .insert({ nombre: this.nuevaEspecialidad.trim() })
        .select()
        .single();

      if (nueva) {
        this.especialidadesSeleccionadas.push(nueva.id);
      }
    }

    await this.supabase.client.from('especialistas').insert({
      id: uid,
      nombre: this.nombre,
      apellido: this.apellido,
      edad: this.edad,
      dni: this.dni,
      email: this.email,
      password: this.password,
      imagen: urlImagen,
      verificado: false,
      aprobado: false,
    });

    for (const espId of this.especialidadesSeleccionadas) {
      await this.supabase.client.from('especialista_especialidad').insert({
        especialista_id: uid,
        especialidad_id: espId,
      });
    }

    console.log('¡Registro exitoso! El administrador deberá aprobar tu cuenta.');
    this.router.navigate(['/login']);
  }
}
