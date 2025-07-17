import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { EstadisticasService } from '../../core/estadisticas.service';
import { ChartType } from 'chart.js';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';

import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { LoadingService } from '../../core/loading.service';

@Component({
  selector: 'app-admin-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './admin-estadisticas.component.html',
  styleUrls: ['./admin-estadisticas.component.scss']
})
export class AdminEstadisticasComponent implements OnInit {
  // Datos
  datosEspecialidades: any[] = [];
  datosTurnosPorDia: any[] = [];
  datosTurnosPorMedico15Dias: any[] = [];
  logsIngresos: any[] = [];

  // Gráfico de torta - Turnos por especialidad
  pieChartLabels: string[] = [];
  pieChartData: number[] = [];
  pieChartType: ChartType = 'pie';

  // Gráfico de línea - Turnos por día
  lineChartLabels: string[] = [];
  lineChartData: any[] = [];
  lineChartType: ChartType = 'line';

  // Gráfico de barras - Turnos por médico (últimos 15 días)
  barChartLabelsMedicosTurnos15Dias: string[] = [];
  barChartDataMedicosTurnos15Dias: any[] = [];
  datosMedicosTurnos15Dias: any[] = [];

  constructor(private estadisticasService: EstadisticasService, private loading: LoadingService) { }

  async ngOnInit() {
    
    this.loading.show();

    this.datosEspecialidades = await this.estadisticasService.getTurnosPorEspecialidad();
    this.datosTurnosPorDia = await this.estadisticasService.getTurnosPorDia();
    this.logsIngresos = await this.estadisticasService.getLogIngresos();
    this.datosMedicosTurnos15Dias = await this.estadisticasService.getTurnosPorMedicoProximos15Dias();

    this.actualizarGraficoMedicos15Dias();
    this.actualizarGraficoTorta();
    this.actualizarGraficoLinea();
    this.loading.hide();
  }

  actualizarGraficoTorta() {
    this.pieChartLabels = this.datosEspecialidades.map(e => e.especialidad);
    this.pieChartData = this.datosEspecialidades.map(e => e.count);
  }

  actualizarGraficoLinea() {
    this.lineChartLabels = this.datosTurnosPorDia.map(d => d.fecha);
    this.lineChartData = [
      {
        data: this.datosTurnosPorDia.map(d => d.count),
        label: 'Turnos por Día',
        borderColor: '#8442f5ff',
        fill: false,
        tension: 0.3
      }
    ];
  }

  actualizarGraficoMedicos15Dias() {
    this.barChartLabelsMedicosTurnos15Dias = this.datosMedicosTurnos15Dias.map(d => d.nombre_completo);
    this.barChartDataMedicosTurnos15Dias = [
      {
        label: 'Turnos próximos 15 días',
        data: this.datosMedicosTurnos15Dias.map(d => d.count),
        backgroundColor: '#51f542ff'
      }
    ];
  }

  async descargarPDFConGraficos() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Informe Estadístico - Clínica', 14, 20);

    const secciones = [
      { id: 'graficoEspecialidad', titulo: '' },
      { id: 'graficoTurnosPorDia', titulo: '' },
      { id: 'graficoTurnosMedicos', titulo: '' },
    ];

    let yOffset = 30;

    for (const seccion of secciones) {
      const canvasElement = document.getElementById(seccion.id);

      if (canvasElement) {
        const canvas = await html2canvas(canvasElement as HTMLElement);
        const imgData = canvas.toDataURL('image/png');
        doc.setFontSize(14);
        doc.text(seccion.titulo, 14, yOffset);
        yOffset += 5;
        doc.addImage(imgData, 'PNG', 14, yOffset, 180, 80);
        yOffset += 90;
      }
    }

    autoTable(doc, {
      startY: yOffset,
      head: [['Usuario', 'Fecha y Hora']],
      body: this.logsIngresos.map(log => [log.usuario, new Date(log.fecha_hora).toLocaleString()])
    });

    doc.save('estadisticas.pdf');
  }

  descargarExcel() {
    const wb: XLSX.WorkBook = XLSX.utils.book_new();

    const hojaEspecialidades = XLSX.utils.json_to_sheet(this.datosEspecialidades);
    XLSX.utils.book_append_sheet(wb, hojaEspecialidades, 'Por Especialidad');

    const hojaTurnosDia = XLSX.utils.json_to_sheet(this.datosTurnosPorDia);
    XLSX.utils.book_append_sheet(wb, hojaTurnosDia, 'Por Día');

    const hojaMedicos15 = XLSX.utils.json_to_sheet(this.datosMedicosTurnos15Dias);
    XLSX.utils.book_append_sheet(wb, hojaMedicos15, 'Médicos 15 días');

    const hojaLogs = XLSX.utils.json_to_sheet(
      this.logsIngresos.map(log => ({
        usuario: log.usuario,
        fecha: new Date(log.fecha_hora).toLocaleString()
      }))
    );
    XLSX.utils.book_append_sheet(wb, hojaLogs, 'Logs de Ingreso');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'estadisticas-clinica.xlsx');
  }

}
