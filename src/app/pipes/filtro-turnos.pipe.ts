import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtroTurnos'
})
export class FiltroTurnosPipe implements PipeTransform {
  transform(turnos: any[], filtro: string, especialistasMap: Record<string, { nombre: string; apellido: string }>): any[] {
    if (!turnos || !filtro) return turnos;

    filtro = filtro.toLowerCase();

    return turnos.filter(turno => {
      const especialista = especialistasMap[turno.especialista_id];
      const nombreEspecialista = especialista?.nombre?.toLowerCase() || '';
      const apellidoEspecialista = especialista?.apellido?.toLowerCase() || '';

      return (
        turno.especialidad?.toLowerCase().includes(filtro) ||
        turno.nombre_paciente?.toLowerCase().includes(filtro) ||
        turno.estado?.toLowerCase().includes(filtro) ||
        nombreEspecialista.includes(filtro) ||
        apellidoEspecialista.includes(filtro)
      );
    });
  }
}