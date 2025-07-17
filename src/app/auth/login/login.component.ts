import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class LoginComponent {
  email = '';
  password = '';
  mostrarOpciones: boolean = false;

  errorEmail: string = '';
  errorPassword: string = '';
  errorGeneral: string = '';

  constructor(private supabase: SupabaseService, private router: Router) {}

  validarCampos(): boolean {
    this.errorEmail = '';
    this.errorPassword = '';
    this.errorGeneral = '';

    if (!this.email) {
      this.errorEmail = 'El email es requerido.';
    } else if (!this.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      this.errorEmail = 'El email no es válido.';
    }

    if (!this.password) {
      this.errorPassword = 'La contraseña es requerida.';
    } else if (this.password.length < 4) {
      this.errorPassword = 'La contraseña debe tener al menos 4 caracteres.';
    }

    return !this.errorEmail && !this.errorPassword;
  }

  async login() {
  if (!this.validarCampos()) return;

  const { data, error } = await this.supabase.client.auth.signInWithPassword({
    email: this.email,
    password: this.password,
  });

  if (error) {
    this.errorGeneral = 'Error al iniciar sesión, debes confirmar tu mail';
    return;
  }

  try {
    await this.supabase.client
      .from('logs_ingresos')
      .insert([{ usuario: this.email }]);
  } catch (e) {
    console.error('Error registrando log de ingreso:', e);
  }

  const userId = data.user.id;

  const admin = await this.supabase.client.from('administradores').select('*').eq('id', userId).maybeSingle();
  if (admin.data) {
    this.router.navigate(['/mi-perfil']);
    return;
  }

  const especialista = await this.supabase.client.from('especialistas').select('*').eq('id', userId).maybeSingle();
  if (especialista.data) {
    if (!data.user.email_confirmed_at) {
      this.errorGeneral = 'Debes confirmar tu email.';
      return;
    }
    if (!especialista.data.aprobado) {
      this.errorGeneral = 'Tu cuenta aún no fue aprobada por el administrador.';
      return;
    }
    this.router.navigate(['/mi-perfil']);
    return;
  }

  const paciente = await this.supabase.client.from('pacientes').select('*').eq('id', userId).maybeSingle();
  if (paciente.data) {
    if (!data.user.email_confirmed_at) {
      this.errorGeneral = 'Debes confirmar tu email.';
      return;
    }
    this.router.navigate(['/mi-perfil']);
    return;
  }

  this.errorGeneral = 'No se encontró un rol válido asociado a tu cuenta.';
}


  preloadUser(userType: string) {
    switch(userType) {
      case 'paciente1':
        this.email = 'lupapa@yopmail.com';
        this.password = '12345678';
        break;
      case 'paciente2':
        this.email = 'luchi@yopmail.com';
        this.password = '12345678';
        break;
      case 'paciente3':
        this.email = 'pedrofernandez@yopmail.com';
        this.password = '12345678';
        break;
      case 'especialista1':
        this.email = 'ricardo@yopmail.com';
        this.password = '12345678';
        break;
      case 'especialista2':
        this.email = 'perro@yopmail.com';
        this.password = '12345678';
        break;
      case 'admin':
        this.email = 'agusadmin@yopmail.com';
        this.password = '12345678';
        break;
    }
  }

  toggleOpciones() {
    this.mostrarOpciones = !this.mostrarOpciones;
  }
}
