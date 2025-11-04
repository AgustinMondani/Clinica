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
  imports: [CommonModule, FormsModule],
  standalone: true
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
  errorGeneral = '';

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
    private router: Router
  ) {}

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

  agregarNuevaEspecialidad() {
    const nombre = this.nuevaEspecialidad.trim();

    if (!nombre) {
      this.errorEspecialidad = 'Debes ingresar un nombre válido.';
      return;
    }

    const existe = this.especialidades.some(
      (esp) => esp.nombre.toLowerCase() === nombre.toLowerCase()
    );

    if (existe) {
      this.errorEspecialidad = 'Esa especialidad ya existe.';
      return;
    }

    this.errorEspecialidad = '';

    const nueva = {
      id: Date.now(),
      nombre,
      esNueva: true
    };

    this.especialidades.push(nueva);
    this.especialidadesSeleccionadas.push(nueva.id);
    this.nuevaEspecialidad = '';
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
    this.errorGeneral = '';

    if (!this.selectedImage) {
      this.errorImagen = 'La imagen es obligatoria.';
      return;
    }

    if (this.especialidadesSeleccionadas.length === 0) {
      this.errorEspecialidad = 'Debes seleccionar al menos una especialidad.';
      return;
    }

    if (form.invalid) return;

    try {
      const { data: existente } = await this.supabase.client
        .from('especialistas')
        .select('email')
        .eq('email', this.email)
        .maybeSingle();

      if (existente) {
        this.errorGeneral = 'El email ingresado ya está registrado como especialista.';
        return;
      }

      const { data: pacienteExistente } = await this.supabase.client
        .from('pacientes')
        .select('email')
        .eq('email', this.email)
        .maybeSingle();

      if (pacienteExistente) {
        this.errorGeneral = 'El email ingresado ya está registrado como paciente.';
        return;
      }

      const { data, error } = await this.auth.register(this.email, this.password);
      if (error) {
        this.errorGeneral = 'Error al registrar el usuario.';
        return;
      }

      const uid = data.user?.id;
      if (!uid) {
        this.errorGeneral = 'No se pudo obtener el ID del usuario.';
        return;
      }

      let urlImagen = '';
      if (this.imagenFile) {
        const rutaImagen = `especialistas/${uid}.jpg`;

        const { error: uploadError } = await this.supabase.client.storage
          .from('imagenes')
          .upload(rutaImagen, this.imagenFile, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          this.errorGeneral = 'Error al subir la imagen.';
          return;
        }

        const { data: publicData } = this.supabase.client.storage
          .from('imagenes')
          .getPublicUrl(rutaImagen);

        urlImagen = publicData.publicUrl;
      }

      const nuevasEspecialidades = this.especialidades.filter(e => e.esNueva);
      for (const esp of nuevasEspecialidades) {
        const { data: nueva } = await this.supabase.client
          .from('especialidades')
          .insert({ nombre: esp.nombre })
          .select()
          .single();

        if (nueva) {
          const idx = this.especialidadesSeleccionadas.indexOf(esp.id);
          if (idx !== -1) this.especialidadesSeleccionadas[idx] = nueva.id;
        }
      }

      const { error: insertError } = await this.supabase.client
        .from('especialistas')
        .insert({
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

      if (insertError) {
        this.errorGeneral = 'Error al guardar el especialista.';
        return;
      }

      for (const espId of this.especialidadesSeleccionadas) {
        await this.supabase.client
          .from('especialista_especialidad')
          .insert({ especialista_id: uid, especialidad_id: espId });
      }

      this.router.navigate(['/login']);
    } catch (err) {
      console.error(err);
      this.errorGeneral = 'Ocurrió un error inesperado.';
    }
  }
}
