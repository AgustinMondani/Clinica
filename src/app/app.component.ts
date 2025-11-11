import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpinnerComponent } from './componenentes/spinner/spinner.component';
import { NavbarComponent } from './componenentes/navbar/navbar.component';
import { Router, NavigationEnd } from '@angular/router';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SpinnerComponent, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  
})
export class AppComponent implements OnInit {
  title = 'clinica';
  constructor(private router: Router) {}

   ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const routeName = event.urlAfterRedirects.split('/')[1] || 'home';
        document.body.className = '';
        document.body.classList.add(`${routeName}-page`);
      }
    });
  }
}