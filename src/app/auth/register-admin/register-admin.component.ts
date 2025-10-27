import { Component } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register-admin',
  templateUrl: './register-admin.component.html',
  styleUrls: ['./register-admin.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class RegisterAdminComponent {
  formData: any = {
    nombre: '',
    apellido: '',
    edad: null,
    dni: '',
    email: '',
    password: ''
  };

  imagen: File | null = null;

  errorGeneral = '';
  errorImagen = '';

  constructor(private supabase: SupabaseService, private router: Router) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) {
      this.imagen = null;
      this.errorImagen = 'Debe seleccionar una imagen.';
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.imagen = null;
      this.errorImagen = 'El archivo debe ser una imagen válida.';
      return;
    }

    this.errorImagen = '';
    this.imagen = file;
  }

  async registrar() {
    this.errorGeneral = '';

    if (!this.imagen) {
      this.errorImagen = 'Debe seleccionar una imagen antes de continuar.';
      return;
    }

    try {
      const { data, error } = await this.supabase.client.auth.signUp({
        email: this.formData.email,
        password: this.formData.password
      });

      if (error) {
        this.errorGeneral = 'Error al registrar usuario: ' + error.message;
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        this.errorGeneral = 'No se pudo obtener el ID del usuario.';
        return;
      }

      const imgPath = `administradores/${userId}.jpg`;

      const { error: uploadError } = await this.supabase.client.storage
        .from('imagenes')
        .upload(imgPath, this.imagen!, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        this.errorGeneral = 'Error al subir la imagen: ' + uploadError.message;
        return;
      }

      const { data: publicUrlData } = this.supabase.client
        .storage
        .from('imagenes')
        .getPublicUrl(imgPath);

      const imgUrl = publicUrlData.publicUrl;

      const { error: insertError } = await this.supabase.client
        .from('administradores')
        .insert({
          id: userId,
          nombre: this.formData.nombre,
          apellido: this.formData.apellido,
          edad: this.formData.edad,
          dni: this.formData.dni,
          email: this.formData.email,
          imagen: imgUrl
        });

      if (insertError) {
        this.errorGeneral = 'Error al guardar el administrador: ' + insertError.message;
        return;
      }

      this.errorGeneral = '';
      this.router.navigate(['/admin']);

    } catch (err: any) {
      this.errorGeneral = 'Error inesperado: ' + err.message;
    }
  }
}
