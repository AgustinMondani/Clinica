import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './bienvenida.component.html',
  styleUrls: ['./bienvenida.component.scss']
})
export class BienvenidaComponent implements OnInit {

  imagenes = [
    'https://oqnisprjqxdarqewgqqu.supabase.co/storage/v1/object/public/imagenes/bienvenida/imagen3.png',
    'https://oqnisprjqxdarqewgqqu.supabase.co/storage/v1/object/public/imagenes/bienvenida/imagen2.png',
    'https://oqnisprjqxdarqewgqqu.supabase.co/storage/v1/object/public/imagenes/bienvenida/imagen3.png',
    'https://oqnisprjqxdarqewgqqu.supabase.co/storage/v1/object/public/imagenes/bienvenida/imagen4.jpg'
  ];

  slideActivo = 0;

  ngOnInit() {
    setInterval(() => {
      this.slideActivo = (this.slideActivo + 1) % this.imagenes.length;
    }, 2000);
  }
}
