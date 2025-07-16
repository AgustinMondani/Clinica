import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingSpinnerComponent } from './shared/loading-spinner/loading-spinner.component';
import { NavbarComponent } from './componenentes/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoadingSpinnerComponent, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'clinica';
}
