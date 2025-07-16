import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../core/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HistoriaClinicaService } from '../../core/historia-clinica.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-mi-perfil',
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MiPerfilComponent implements OnInit {
  usuario: any = null;
  imagen1Url: string | null = null;
  imagen2Url: string | null = null;
  opciones: string[] = [];
  historias: any[] = [];

  constructor(private supabase: SupabaseService, private router: Router, private historiaService: HistoriaClinicaService,) {}

  async ngOnInit() {
    const user = await this.supabase.getUsuarioActual();
    this.usuario = user;
    const userId = await this.supabase.getUserId();
    this.historias = await this.historiaService.obtenerHistoriasPorPaciente(user.id);

    if (!user) return;

    const bucket = 'fotosperfieles';

    if (user.imagen1) {
      const { data } = this.supabase.client.storage.from(bucket).getPublicUrl(user.imagen1);
      this.imagen1Url = data.publicUrl;
    }
    if (user.imagen2) {
      const { data } = this.supabase.client.storage.from(bucket).getPublicUrl(user.imagen2);
      this.imagen2Url = data.publicUrl;
    }

    if (user.rol === 'admin') {
      this.opciones = ['Ver Turnos', 'Solicitar Turno', 'Usuarios'];
    } else if (user.rol === 'paciente') {
      this.opciones = ['Mis Turnos', 'Solicitar Turno'];
    } else if (user.rol === 'especialista') {
      this.opciones = ['Mis Turnos', 'Mis Horarios'];
    }
  }

 generarHistoriaClinicaPDF() {
  const doc = new jsPDF();
  const fechaEmision = new Date().toLocaleDateString();

  const img = new Image();
  img.src = 'https://oqnisprjqxdarqewgqqu.supabase.co/storage/v1/object/public/imagenes//favicon.png';

  img.onload = () => {
    doc.addImage(img, 'PNG', 10, 10, 30, 30);

    doc.setFontSize(18);
    doc.text('Informe de Historia Clínica', 50, 20);
    doc.setFontSize(12);
    doc.text(`Fecha de emisión: ${fechaEmision}`, 50, 30);

    const datosPaciente = [
      ['Nombre', this.usuario?.nombre || ''],
      ['Apellido', this.usuario?.apellido || ''],
      ['Edad', this.usuario?.edad?.toString() || ''],
      ['DNI', this.usuario?.dni || ''],
      ['Email', this.usuario?.email || '']
    ];

    autoTable(doc, {
      startY: 50,
      head: [['PACIENETE DATOS', '']],
      body: datosPaciente
    });

    let posY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(14);
    doc.text('Historial Clínico', 14, posY);
    posY += 6;

    this.historias.forEach((historia, index) => {
      const historiaTabla = [
        ['Fecha', this.formatearSoloFecha(historia.created_at) || ''],
        ['Altura', historia.altura || ''],
        ['Peso', historia.peso || ''],
        ['Temperatura', historia.temperatura || ''],
        ['Presión', historia.presion || ''],
      ];

      if (Array.isArray(historia.datos_dinamicos)) {
  historia.datos_dinamicos.forEach((item: any) => {
    historiaTabla.push([item.clave, item.valor]);
  });
}

      autoTable(doc, {
        startY: posY,
        head: [['Campo', 'Valor']],
        body: historiaTabla,
        styles: { fontSize: 10 },
        didDrawPage: (data) => {
        }
      });

      autoTable(doc, {
  startY: posY,
  head: [['Campo', 'Valor']],
  body: historiaTabla,
  styles: { fontSize: 10 }
});

// 👇 Posición final real de la tabla
posY = (doc as any).lastAutoTable.finalY + 10;
    });

    doc.save('historia_clinica.pdf');
  };
}


  irA(ruta: string) {
  this.router.navigate([`/${ruta}`]);
}

formatearSoloFecha(fechaISO: string): string {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
}

