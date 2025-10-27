import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { CaptchaService } from '../../core/captcha.service';
import { CaptchaDirective } from '../../directives/captcha.directive';

@Component({
  selector: 'app-register-paciente',
  templateUrl: './register-paciente.component.html',
  styleUrls: ['./register-paciente.component.scss'],
  imports: [CommonModule, FormsModule, CaptchaDirective]
})
export class RegisterPacienteComponent implements OnInit {
  formData: any = {
    nombre: '',
    apellido: '',
    edad: null,
    dni: '',
    obraSocial: '',
    email: '',
    password: ''
  };

  imagen1: File | null = null;
  imagen2: File | null = null;

  captchaRespuesta: number | null = null;
  captchaImagen: string = '';

  errorGeneral: string = '';

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private captchaService: CaptchaService
  ) {}

  ngOnInit() {
    this.cargarCaptcha();
  }

  onFileSelected(event: any, imgNumber: number) {
    const file = event.target.files[0];
    if (imgNumber === 1) {
      this.imagen1 = file;
    } else {
      this.imagen2 = file;
    }
  }

  async registrar(form: NgForm) {
    this.errorGeneral = '';

    if (!this.imagen1 || !this.imagen2) {
      this.errorGeneral = 'Debes subir ambas imágenes.';
      form.control.markAllAsTouched();
      return;
    }

    if (!form.valid) {
      this.errorGeneral = 'Por favor completa todos los campos obligatorios.';
      return;
    }

    const respuesta = Number(this.captchaRespuesta);
    if (!this.captchaService.validarRespuesta(respuesta)) {
      this.errorGeneral = 'Captcha incorrecto. Por favor, intente nuevamente.';
      this.cargarCaptcha();
      return;
    }

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
      this.errorGeneral = 'Error inesperado al obtener el ID del usuario.';
      return;
    }

    let img1Url = '';
    let img2Url = '';
    try {
      const img1Path = `pacientes/${userId}_1.jpg`;
      const img2Path = `pacientes/${userId}_2.jpg`;

      await this.supabase.client.storage.from('imagenes').upload(img1Path, this.imagen1!, { cacheControl: '3600', upsert: false });
      await this.supabase.client.storage.from('imagenes').upload(img2Path, this.imagen2!, { cacheControl: '3600', upsert: false });

      img1Url = this.supabase.client.storage.from('imagenes').getPublicUrl(img1Path).data.publicUrl;
      img2Url = this.supabase.client.storage.from('imagenes').getPublicUrl(img2Path).data.publicUrl;
    } catch (err) {
      this.errorGeneral = 'Error al subir las imágenes.';
      return;
    }

    await this.supabase.client.from('pacientes').insert({
      id: userId,
      nombre: this.formData.nombre,
      apellido: this.formData.apellido,
      edad: this.formData.edad,
      dni: this.formData.dni,
      obra_social: this.formData.obraSocial,
      email: this.formData.email,
      imagen1: img1Url,
      imagen2: img2Url
    });

    this.router.navigate(['/login']);
  }

  cargarCaptcha() {
    this.captchaService.generarCaptcha();
    this.captchaImagen = this.captchaService.getCaptchaImagenUrl();
    this.captchaRespuesta = null;
  }

  cambiarCaptcha() {
    this.cargarCaptcha();
  }
}
