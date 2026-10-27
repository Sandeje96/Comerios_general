"use client";

import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { GastoItemResponse, DesgloseCategoria } from "@/services/gasto.service";
import { formatDateAR, formatTimeAR, formatYMD_AR } from "@/lib/date-ar";

interface GastosPdfButtonProps {
  gastos: GastoItemResponse[];
  rangoTexto: string;
  totalGastos: number;
  totalVentas: number;
  balanceNeto: number;
  desglose: DesgloseCategoria[];
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
}

export function GastosPdfButton({
  gastos,
  rangoTexto,
  totalGastos,
  totalVentas,
  balanceNeto,
  desglose,
}: GastosPdfButtonProps) {
  const exportarPDF = () => {
    const doc = new jsPDF();
    const now = new Date();

    // Título
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de Gastos y Rentabilidad", 14, 20);

    // Subtítulo
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Período: ${rangoTexto}`, 14, 27);
    doc.text(
      `Fecha de emisión: ${formatDateAR(now)} ${formatTimeAR(now)} hs`,
      14,
      33
    );

    // Caja de Resumen Financiero
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 38, 182, 22, 2, 2, "FD");

    doc.setTextColor(30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Ventas: ${formatMoney(totalVentas)}`, 20, 48);
    doc.text(`Gastos: ${formatMoney(totalGastos)}`, 80, 48);

    doc.setTextColor(balanceNeto >= 0 ? 16 : 185, balanceNeto >= 0 ? 185 : 28, balanceNeto >= 0 ? 129 : 28);
    doc.setFontSize(10);
    doc.text(`Ganancia Neta: ${formatMoney(balanceNeto)}`, 140, 48);

    doc.setTextColor(100);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      totalVentas > 0
        ? `Margen sobre ventas: ${Math.round(((totalVentas - totalGastos) / totalVentas) * 1000) / 10}%`
        : "Sin ventas en este período",
      20,
      55
    );

    // Tabla de Desglose por Categoría
    if (desglose.length > 0) {
      doc.setTextColor(30);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Resumen por Categoría", 14, 68);

      const catColumns = ["Categoría", "Cantidad de Pagos", "Total Gastado", "% del Total"];
      const catRows = desglose.map((c) => [
        c.label,
        c.cantidad.toString(),
        formatMoney(c.total),
        `${c.porcentaje}%`,
      ]);

      autoTable(doc, {
        head: [catColumns],
        body: catRows,
        startY: 72,
        theme: "striped",
        styles: { font: "helvetica", fontSize: 8 },
        headStyles: { fillColor: [51, 65, 85], textColor: 255 },
      });
    }

    // Tabla de Detalle de Gastos
    const currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 68;

    doc.setTextColor(30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Listado de Gastos Registrados", 14, currentY);

    const gastosColumns = ["Fecha", "Categoría", "Descripción / Concepto", "Comprobante", "Medio", "Monto"];
    const gastosRows = gastos.map((g) => [
      g.fechaLegible,
      g.categoriaLabel,
      g.descripcion,
      g.comprobante || "-",
      g.metodoPago || "-",
      formatMoney(g.monto),
    ]);

    autoTable(doc, {
      head: [gastosColumns],
      body: gastosRows,
      startY: currentY + 4,
      theme: "striped",
      styles: { font: "helvetica", fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      columnStyles: {
        5: { halign: "right", fontStyle: "bold" },
      },
    });

    const cleanFileName = `reporte-gastos-${formatYMD_AR(now)}.pdf`;
    doc.save(cleanFileName);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportarPDF}
      disabled={gastos.length === 0}
      className="flex items-center gap-1.5 text-xs h-9 bg-white hover:bg-slate-50"
    >
      <FileText className="w-4 h-4 text-slate-600" />
      <span>Exportar Reporte PDF</span>
    </Button>
  );
}
