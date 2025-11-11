# 🏥 Clínica Online Mondani

Aplicación web desarrollada con **Angular** y **Supabase** para la gestión de turnos médicos.  
Permite a los pacientes solicitar turnos, a los especialistas gestionarlos, y a los administradores supervisar toda la actividad del sistema.

---

## 🚀 Funcionalidades principales

- ✅ Registro y autenticación de usuarios (pacientes, especialistas y administradores)
- ✅ Solicitud de turnos por especialidad, especialista, fecha y horario
- ✅ Cancelación de turnos con motivo
- ✅ Calificación y reseña de turnos realizados
- ✅ Paneles diferenciados según el rol del usuario
- ✅ Filtros y visualización dinámica de turnos
- ✅ Gestión de usuarios
- ✅ Descarga de estadísticas y reportes (PDF / Excel)
- ✅ Sistema de historia clínica dinámica
- ✅ Animaciones de transición entre componentes

---

## 📋 Requerimientos del proyecto (por sprint)

### 🔐 **Login / Acceso rápido**
- ✅ Boton *favbutton* de acceso rápido con animación para mostrar los usuarios
- ✅ Ubicación en la esquina inferior izquierda (login)
- ✅ Se muestran 6 usuarios (3 pacientes, 2 especialistas, 1 admin)

---

### 🩺 **Sacar un turno**
- ✅ Mostrar **ESPECIALIDADES** en botones con imagen
- ✅ Mostrar **PROFESIONALES** con su imagen y nombre botones rectangulares
- ✅ Mostrar **días disponibles** para el profesional formato: “09 de Septiembre”
- ✅ Mostrar **horarios disponibles** (formato: “13:15”)

---

### 🧍‍♂️ **Registro de usuarios**
- ✅ Mostrar solo dos botones (Paciente / Especialista) al ingresar
- ✅ Cada botón tiene imagen representativa
- ✅ Formularios separados según tipo de usuario
- ✅ El formulario aparece con **animación** al seleccionar el tipo de usuario

---

### 👨‍⚕️ **Sección Pacientes (para especialistas)**
- ✅ Mostrar solo los pacientes que el especialista atendió al menos una vez
- ✅ Mostrar cada paciente con un *favbutton* redondo, imagen y nombre
- ✅ Al seleccionar un paciente se muestran los **detalles de los turnos**
- ✅ Acceso a la **reseña de cada consulta**
- ✅ Visualización de la **foto del paciente** desde la base de datos

---

### 👩‍💼 **Sección Usuarios (para administradores)**
- ❌ Mostrar todos los usuarios con *favbutton*, imagen y nombre
- ✅ Descargar un **Excel con los datos de todos los usuarios**
- ❌ Descargar un **Excel individual** con los turnos tomados por cada usuario y con quién fueron

---

### 🧑‍⚕️ **Mi perfil (pacientes)**
- ✅ Descargar un **PDF con la historia clínica completa**
- ✅ Incluir logo de la clínica, título del informe y fecha de emisión
- ❌ Posibilidad de descargar todas las atenciones por profesional (PDF)

---

### 🎨 **Animaciones**
- ✅ Animación de transición de **derecha a izquierda** entre componentes
- ❌ Segunda animación aplicada al aparecer formularios y/o vistas internas
- ❌ Animaciones suaves y consistentes en la navegación

---

## 🧩 Librerias utilizadas

- **Angular** 
- **TypeScript** 
- **Supabase** — Backend como servicio (autenticación, base de datos y almacenamiento)
- **Firebase** — Deploy
- **Chart.js / ng2-charts** — Gráficos estadísticos
- **jsPDF + html2canvas** — Exportación a PDF
- **xlsx** — Exportación a Excel
- **SCSS / CSS3** — Estilos personalizados y animaciones

---

## 🖼️ Imágenes de las distintas pantallas

### 🔑 Inicio de sesión:
<img width="2006" height="923" alt="image" src="https://github.com/user-attachments/assets/98bd2409-d4bb-4691-982b-67e450c81339" />

### 🏠 Bienvenida:
<img width="1932" height="923" alt="image" src="https://github.com/user-attachments/assets/20707374-4a11-425f-b09b-e84cae2d34eb" />

### 🧾 Formulario de registro:
<img width="951" height="837" alt="image" src="https://github.com/user-attachments/assets/3d93343a-82d1-4d42-af9c-54d138bac1ad" />

### 👤 Mi perfil:
<img width="1920" height="922" alt="image" src="https://github.com/user-attachments/assets/19dee104-9198-411e-a97c-18c92f20e9a6" />

---

## ✨ ALUMNO

**Agustín Mondani**  
💻 Técnico en Programación — UTN  
📍 Proyecto final de Laboratorio IV  
📅 2025

---

