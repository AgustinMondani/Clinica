import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtroTurnos'
})
export class FiltroTurnosPipe implements PipeTransform {

  transform(turnos: any[], filtro: string): any[] {
    if (!turnos || !filtro) return turnos;

    filtro = filtro.toLowerCase();

    return turnos.filter(turno =>
      turno.especialidad?.toLowerCase().includes(filtro) ||
      turno.nombre_paciente?.toLowerCase().includes(filtro) ||
      turno.estado?.toLowerCase().includes(filtro)
    );
  }

}
