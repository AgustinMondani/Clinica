import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
  selector: '[appResaltar]'
})
export class ResaltarDirective {
  @Input('appResaltar') estado: string = '';

  constructor(private el: ElementRef) {}

  ngOnChanges() {
    switch(this.estado) {
      case 'pendiente':
        this.el.nativeElement.style.color = 'orange';
        break;
      case 'aceptado':
        this.el.nativeElement.style.color = 'blue';
        break;
      case 'rechazado':
        this.el.nativeElement.style.color = 'red';
        break;
      case 'cancelado':
        this.el.nativeElement.style.color = 'gray';
        break;
      case 'realizado':
        this.el.nativeElement.style.color = 'green';
        break;
      default:
        this.el.nativeElement.style.color = 'black';
    }
  }

}
