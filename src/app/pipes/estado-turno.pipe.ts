import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estadoTurno'
})
export class EstadoTurnoPipe implements PipeTransform {

  transform(value: string): string {
    switch (value) {
      case 'pendiente':
        return 'PENDIENTE :/';
      case 'aceptado':
        return 'ACEPTADO :)';
      case 'rechazado':
        return 'RECHAZADO :(';
      case 'cancelado':
        return 'CANCELADO ';
      case 'realizado':
        return 'REALIZADO';
      default:
        return value;
    }
  }

}
