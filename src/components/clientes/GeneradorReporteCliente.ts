import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";

// Extender la interfaz de jsPDF para jspdf-autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Tipos de datos (pueden ser importados desde otros archivos si ya existen)
interface Pago {
  id: string;
  monto: number;
  fechaPago: string;
}

interface Prestamo {
  id: string;
  monto: number;
  tasaInteres: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  pagos: Pago[];
  notas?: string | null;
}

interface ClienteDetallado {
  nombre: string;
  cedula: string;
  telefono: string | null;
  correo: string | null;
  prestamos: Prestamo[];
}

// Función principal para generar el reporte
export const generarReporteClientePDF = (cliente: ClienteDetallado) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  let y = 20; // Posición vertical inicial

  // --- TÍTULO ---
  doc.setFontSize(20);
  doc.text("Reporte de Cliente y Préstamos", 105, y, { align: "center" });
  y += 15;

  // --- DATOS DEL CLIENTE ---
  doc.setFontSize(12);
  doc.text("🧍‍♂️ Datos del Cliente", 14, y);
  y += 8;
  doc.autoTable({
    startY: y,
    body: [
      ["Nombre", cliente.nombre],
      ["DNI", cliente.cedula],
      ["Contacto", `${cliente.telefono || "-"} / ${cliente.correo || "-"}`],
    ],
    theme: "striped",
    styles: { fontSize: 10 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // --- RESUMEN GENERAL ---
  const totalPrestado = cliente.prestamos.reduce((sum, p) => sum + p.monto, 0);
  const totalPagado = cliente.prestamos
    .flatMap((p) => p.pagos)
    .reduce((sum, pago) => sum + pago.monto, 0);
  const saldoTotal = totalPrestado - totalPagado;

  doc.text("📊 Estado Actual General", 14, y);
  y += 8;
  doc.autoTable({
    startY: y,
    body: [
      ["Total Prestado", `S/ ${totalPrestado.toFixed(2)}`],
      ["Total Pagado", `S/ ${totalPagado.toFixed(2)}`],
      ["Saldo Pendiente", `S/ ${saldoTotal.toFixed(2)}`],
    ],
    theme: "grid",
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  // --- DETALLE DE PRÉSTAMOS ---
  cliente.prestamos.forEach((prestamo, index) => {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.text(`💳 Préstamo N°${index + 1}`, 14, y);
    y += 8;

    const saldoPendientePrestamo =
      prestamo.monto - prestamo.pagos.reduce((sum, p) => sum + p.monto, 0);

    doc.autoTable({
      startY: y,
      head: [["Detalle", "Valor"]],
      body: [
        ["Código", prestamo.id.substring(0, 8)],
        ["Monto", `S/ ${prestamo.monto.toFixed(2)}`],
        ["Interés", `${prestamo.tasaInteres}% diario`],
        [
          "Plazo",
          `${format(new Date(prestamo.fechaInicio), "dd/MM/yy")} - ${format(
            new Date(prestamo.fechaFin),
            "dd/MM/yy"
          )}`,
        ],
        ["Estado", prestamo.estado],
        ["Saldo Pendiente", `S/ ${saldoPendientePrestamo.toFixed(2)}`],
      ],
      theme: "striped",
      styles: { fontSize: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 5;

    // Historial de Pagos del préstamo
    if (prestamo.pagos.length > 0) {
      doc.setFontSize(10);
      doc.text("Historial de Pagos:", 14, y);
      y += 5;
      doc.autoTable({
        startY: y,
        head: [["Fecha", "Monto", "Cajera"]],
        body: prestamo.pagos.map((p) => [
          format(new Date(p.fechaPago), "dd/MM/yyyy"),
          `S/ ${p.monto.toFixed(2)}`,
          "Admin", // Placeholder
        ]),
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [100, 100, 100] },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(10);
      doc.text("Sin pagos registrados para este préstamo.", 14, y);
      y += 10;
    }

    // Observaciones
    if (prestamo.notas) {
      doc.setFontSize(10);
      doc.text("📝 Observaciones:", 14, y);
      y += 5;
      doc.text(prestamo.notas, 14, y, { maxWidth: 180 });
      y += 15;
    }
  });

  // --- PIE DE PÁGINA ---
  const pageCount = doc.internal.pages.length;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    const text = `Emitido por: Sistema de Préstamos | Fecha: ${format(
      new Date(),
      "dd/MM/yyyy HH:mm"
    )} | Página ${i} de ${pageCount}`;
    doc.text(text, 105, pageHeight - 10, { align: "center" });
  }

  // Abrir PDF en una nueva pestaña
  doc.output("dataurlnewwindow");
};
