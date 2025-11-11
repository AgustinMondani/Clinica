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
  datosEspecialidades: any[] = [];
  datosTurnosPorDia: any[] = [];
  datosTurnosPorMedico15Dias: any[] = [];
  datosTurnosPorMedicoFechas: any[] = [];
  datosTurnosRealizados: any[] = [];
  logsIngresos: any[] = [];

  fechaInicio: string = '';
  fechaFin: string = '';

  fechaInicioRealizado: string = '';
  fechaFinRealizado: string = '';

  pieChartLabels: string[] = [];
  pieChartData: number[] = [];
  pieChartType: ChartType = 'pie';

  lineChartLabels: string[] = [];
  lineChartData: any[] = [];
  lineChartType: ChartType = 'line';

  barChartLabelsMedicosTurnos15Dias: string[] = [];
  barChartDataMedicosTurnos15Dias: any[] = [];

  barChartLabelsMedicosPorFechas: string[] = [];
  barChartDataMedicosPorFechas: any[] = [];

  barChartLabelsTurnosEstado: string[] = [];
  barChartDataTurnosEstado: any[] = [];

  constructor(private estadisticasService: EstadisticasService, private loading: LoadingService) { }

  async ngOnInit() {
    this.loading.show();

    this.datosEspecialidades = await this.estadisticasService.getTurnosPorEspecialidad();
    this.datosTurnosPorDia = await this.estadisticasService.getTurnosPorDia();
    this.logsIngresos = await this.estadisticasService.getLogIngresos();
    this.datosTurnosPorMedico15Dias = await this.estadisticasService.getTurnosPorMedicoProximos15Dias();

    this.actualizarGraficoTorta();
    this.actualizarGraficoLinea();
    this.actualizarGraficoTurnosEstado();

    this.loading.hide();
  }

  actualizarGraficoTorta() {
    this.pieChartLabels = this.datosEspecialidades.map(e => e.especialidad);
    this.pieChartData = this.datosEspecialidades.map(e => e.count);
  }

  actualizarGraficoLinea() {
  const datosOrdenados = [...this.datosTurnosPorDia].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  this.lineChartLabels = datosOrdenados.map(d => d.fecha);
  this.lineChartData = [
    {
      data: datosOrdenados.map(d => d.count),
      label: 'Turnos por Día',
      borderColor: '#8442f5ff',
      fill: false,
      tension: 0.3
    }
  ];
}

  async filtrarPorFechas() {
    if (!this.fechaInicio || !this.fechaFin) return;
    this.loading.show();
    this.datosTurnosPorMedicoFechas = await this.estadisticasService.getTurnosPorMedicoEntreFechas(this.fechaInicio, this.fechaFin);
    this.actualizarGraficoMedicosFechas();
    this.loading.hide();
  }

  async filtrarPorRealizados() {
    if (!this.fechaInicioRealizado || !this.fechaFinRealizado) return;
    this.loading.show();
    this.datosTurnosRealizados = await this.estadisticasService.getTurnosPorMedicoEntreFechasFinalizados(
      this.fechaInicioRealizado,
      this.fechaFinRealizado
    );
    this.actualizarGraficoTurnosEstado();
    this.loading.hide();
  }

  actualizarGraficoMedicosFechas() {
    this.barChartLabelsMedicosPorFechas = this.datosTurnosPorMedicoFechas.map(d => d.nombre_completo);
    this.barChartDataMedicosPorFechas = [
      {
        label: 'Turnos por médico',
        data: this.datosTurnosPorMedicoFechas.map(d => d.count),
        backgroundColor: '#4287f5ff'
      }
    ];
  }

  actualizarGraficoTurnosEstado() {
    this.barChartLabelsTurnosEstado = this.datosTurnosRealizados.map(d => d.nombre_completo);
    this.barChartDataTurnosEstado = [
      {
        label: 'Cantidad realizados por especialista',
        data: this.datosTurnosRealizados.map(d => d.count),
        backgroundColor: '#f5b642ff'
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
    { id: 'graficoFechas', titulo: '' },
    { id: 'graficoRealizados', titulo: '' }
  ];

  let yOffset = 30;

  for (const seccion of secciones) {
    const element = document.getElementById(seccion.id);

    if (element) {
      element.scrollIntoView();
      await new Promise(resolve => setTimeout(resolve, 900));

      const canvas = await html2canvas(element as HTMLElement, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgHeight = (canvas.height * 180) / canvas.width;

      doc.setFontSize(14);
      doc.text(seccion.titulo, 14, yOffset - 5);
      doc.addImage(imgData, 'PNG', 14, yOffset, 180, imgHeight);

      yOffset += imgHeight + 20;
      if (yOffset > 250) {
        doc.addPage();
        yOffset = 30;
      }
    } else {
      console.warn(`No se encontró el elemento con id ${seccion.id}`);
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

    const hojaMedicos15 = XLSX.utils.json_to_sheet(this.datosTurnosPorMedico15Dias);
    XLSX.utils.book_append_sheet(wb, hojaMedicos15, 'Médicos 15 días');

    const hojaFechas = XLSX.utils.json_to_sheet(this.datosTurnosPorMedicoFechas);
    XLSX.utils.book_append_sheet(wb, hojaFechas, 'Por Fechas');

    const hojaEstados = XLSX.utils.json_to_sheet(this.datosTurnosRealizados);
    XLSX.utils.book_append_sheet(wb, hojaEstados, 'Realizados');

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
