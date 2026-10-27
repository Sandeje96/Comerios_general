"use client";

import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { VentaHistorialItem } from "@/services/historial.service";
import { formatDateAR, formatTimeAR, formatYMD_AR } from "@/lib/date-ar";

interface HistorialPdfButtonProps {
  ventas: VentaHistorialItem[];
  rangoTexto: string;
  totalRecaudado: number;
  cantidadVentas: number;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
}

export function HistorialPdfButton({
  ventas,
  rangoTexto,
  totalRecaudado,
  cantidadVentas,
}: HistorialPdfButtonProps) {
  const exportarPDF = () => {
    const doc = new jsPDF();
    const now = new Date();

    // Título
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de Historial de Ventas", 14, 20);

    // Subtítulo con Período
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Período: ${rangoTexto}`, 14, 27);
    doc.text(`Fecha de emisión: ${formatDateAR(now)} ${formatTimeAR(now)} hs`, 14, 33);

    // Resumen en recuadro
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 38, 182, 18, 2, 2, "FD");

    doc.setTextColor(30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Recaudado: ${formatMoney(totalRecaudado)}`, 20, 49);
    doc.text(`Cantidad de Operaciones: ${cantidadVentas}`, 110, 49);

    // Tabla de Ventas
    const tableColumn = ["Ticket #", "Fecha y Hora", "Cajero", "Artículos", "Total"];
    const tableRows = ventas.map((v) => [
      v.numeroComprobante ? `#${String(v.numeroComprobante).padStart(4, "0")}` : "-",
      v.fechaLegible,
      v.cajero,
      v.cantidadArticulos.toString(),
      formatMoney(v.total),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 62,
      theme: "striped",
      styles: { font: "helvetica", fontSize: 9 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 45 },
        3: { cellWidth: 25, halign: "center" },
        4: { cellWidth: 47, halign: "right" },
      },
    });

    // Guardar archivo
    const cleanFileName = `reporte-ventas-${formatYMD_AR(now)}.pdf`;
    doc.save(cleanFileName);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportarPDF}
      disabled={ventas.length === 0}
      className="flex items-center gap-1.5 text-xs h-9 bg-white hover:bg-slate-50"
    >
      <FileText className="w-4 h-4 text-slate-600" />
      <span>Exportar Reporte PDF</span>
    </Button>
  );
}
