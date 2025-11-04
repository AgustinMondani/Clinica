import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'], 
  imports: [CommonModule]
})
export class NavbarComponent {
  currentRoute: string = '';

  constructor(private router: Router, private location: Location) {
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });
  }

  goHome() {
    this.router.navigate(['/']);
  }

  goBack() {
    this.location.back();
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  showBack(): boolean {
    return !(this.currentRoute == '/' || this.currentRoute == '/login' || this.currentRoute == '/registro-especialista' || this.currentRoute == '/registro-paciente');
  }

  showHome(): boolean {
    return this.currentRoute !== '/' && (this.currentRoute == '/login' || this.currentRoute == '/registro-especialista' || this.currentRoute == '/registro-paciente');
  }

  showLogout(): boolean {
    return !(this.currentRoute == '/' || this.currentRoute == '/login' || this.currentRoute == '/registro-especialista' || this.currentRoute == '/registro-paciente' || this.currentRoute == '/registros');
  };
  
  showNav(): boolean {
    return this.currentRoute !== '/';
  }
}
