import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { AuthService } from '../../core/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
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
  selectedImage: File | null = null;

  especialidades: any[] = [];
  especialidadesSeleccionadas: number[] = [];
  nuevaEspecialidad = '';

  errorImagen = '';
  errorEspecialidad = '';

  constructor(private supabase: SupabaseService, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
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

  manejarImagen(event: any) {
    const archivo = event.target.files[0];
    if (archivo && !archivo.type.startsWith('image/')) {
      this.errorImagen = 'El archivo debe ser una imagen válida.';
      this.imagenFile = null;
      this.selectedImage = null;
    } else {
      this.errorImagen = '';
      this.imagenFile = archivo;
      this.selectedImage = archivo;
    }
  }

  async registrarEspecialista(form: NgForm) {
    this.errorImagen = '';
    this.errorEspecialidad = '';

    // Validaciones obligatorias
    if (!this.selectedImage) {
      this.errorImagen = 'La imagen es obligatoria.';
      return;
    }

    if (this.especialidadesSeleccionadas.length === 0 && this.nuevaEspecialidad.trim() === '')  {
      this.errorEspecialidad = 'Debes seleccionar al menos una especialidad.';
      return;
    }

    if (form.invalid) {
      return;
    }

    // Registro de usuario
    const { data, error } = await this.auth.register(this.email, this.password);
    if (error) {
      console.error('Error al registrar usuario:', error.message);
      return;
    }

    const uid = data.user?.id;
    if (!uid) {
      console.error('Error: no se pudo obtener el ID del usuario.');
      return;
    }

    // Subida de imagen
    let urlImagen = '';
    if (this.imagenFile) {
      const rutaImagen = `especialistas/${uid}.jpg`;
      try {
        await this.supabase.client.storage.from('imagenes').upload(rutaImagen, this.imagenFile, { cacheControl: '3600', upsert: false });
        const { data: publicData } = this.supabase.client.storage.from('imagenes').getPublicUrl(rutaImagen);
        urlImagen = publicData.publicUrl;
      } catch (err) {
        console.error('Error al subir la imagen:', err);
        this.errorImagen = 'Error al subir la imagen. Intente nuevamente.';
        return;
      }
    }

    // Insertar nueva especialidad si corresponde
    if (this.nuevaEspecialidad.trim() !== '') {
      const { data: nueva } = await this.supabase.client.from('especialidades').insert({ nombre: this.nuevaEspecialidad.trim() }).select().single();
      if (nueva) {
        this.especialidadesSeleccionadas.push(nueva.id);
      }
    }

    // Insertar especialista
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

    // Vincular especialidades
    for (const espId of this.especialidadesSeleccionadas) {
      await this.supabase.client.from('especialista_especialidad').insert({
        especialista_id: uid,
        especialidad_id: espId
      });
    }

    console.log('¡Registro exitoso! El administrador deberá aprobar tu cuenta.');
    this.router.navigate(['/login']);
  }
}
``
