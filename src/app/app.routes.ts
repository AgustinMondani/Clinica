import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BienvenidaComponent } from './pages/bienvenida/bienvenida.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterPacienteComponent } from './auth/register-paciente/register-paciente.component';
import { RegisterEspecialistaComponent } from './auth/register-especialista/register-especialista.component';
import { RegisterAdminComponent } from './auth/register-admin/register-admin.component';
import { AdminComponent } from './componenentes/admin/admin.component';
import { SolicitarTurnoComponent } from './pages/solicitar-turno/solicitar-turno.component';
import { MisTurnosPacienteComponent } from './pages/mis-turnos-paciente/mis-turnos-paciente.component';
import { MisTurnosEspecialistaComponent } from './pages/mis-turnos-especialista/mis-turnos-especialista.component';
import { MisHorariosComponent } from './pages/mis-horarios/mis-horarios.component';
import { TurnosAdminComponent } from './pages/turnos-admin/turnos-admin.component';
import { MiPerfilComponent } from './pages/mi-perfil/mi-perfil.component';
import { PacientesEspecialistaComponent } from './pages/pacientes-especialista/pacientes-especialista.component';
import { AdminEstadisticasComponent } from './pages/admin-estadisticas/admin-estadisticas.component';
import { RegistrosComponent } from './pages/registros/registros.component';

export const routes: Routes = [
  { path: '', component: BienvenidaComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registros', component: RegistrosComponent},
  { path: 'registro-paciente', component: RegisterPacienteComponent },
  { path: 'registro-especialista', component: RegisterEspecialistaComponent },
  { path: 'registro-admin', component: RegisterAdminComponent },
  { path: 'admin', component: AdminComponent},
  { path: 'solicitar-turno', component: SolicitarTurnoComponent },
  { path: 'mis-turnos-paciente', component: MisTurnosPacienteComponent },
  { path: 'mis-turnos-especialista', component: MisTurnosEspecialistaComponent },
  { path: 'mis-horarios', component: MisHorariosComponent },
  { path: 'turnos-admin', component: TurnosAdminComponent},
  { path: 'mi-perfil', component: MiPerfilComponent},
  { path: 'pacientes-especialista', component: PacientesEspecialistaComponent},
  { path: 'estadisticas', component:AdminEstadisticasComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
