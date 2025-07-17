import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpinnerComponent } from './componenentes/spinner/spinner.component';
import { NavbarComponent } from './componenentes/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SpinnerComponent, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'clinica';
}
