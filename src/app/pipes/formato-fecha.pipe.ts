import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatoFecha'
})
export class FormatoFechaPipe implements PipeTransform {

  transform(value: string | Date, formato: string = 'dd/MM/yyyy'): string {
  if (!value) return '';

  let iso = value instanceof Date ? value.toISOString() : value;

  const fechaStr = iso.split('T')[0];

  const [anio, mes, dia] = fechaStr.split('-');
  return `${dia}/${mes}/${anio}`;
}

}
