"use client";

import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MovimientoCCItemResponse } from "@/services/proveedor.service";
import { formatDateAR, formatTimeAR, formatYMD_AR } from "@/lib/date-ar";

interface CuentaCorrientePdfButtonProps {
  proveedor: {
    nombre: string;
    cuit?: string | null;
    telefono?: string | null;
    email?: string | null;
    direccion?: string | null;
  };
  movimientos: MovimientoCCItemResponse[];
  rangoTexto: string;
  saldoAnterior: number;
  saldoFinal: number;
  totalDebitos: number;
  totalCreditos: number;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function CuentaCorrientePdfButton({
  proveedor,
  movimientos,
  rangoTexto,
  saldoAnterior,
  saldoFinal,
  totalDebitos,
  totalCreditos,
}: CuentaCorrientePdfButtonProps) {
  const exportarPDF = () => {
    const doc = new jsPDF();
    const now = new Date();

    // Título Principal
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("Estado de Cuenta Corriente", 14, 18);

    // Subtítulo Proveedor
    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(`Proveedor: ${proveedor.nombre}`, 14, 25);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    const contactoInfo = [
      proveedor.cuit ? `CUIT: ${proveedor.cuit}` : null,
      proveedor.telefono ? `Tel: ${proveedor.telefono}` : null,
      proveedor.email ? `Email: ${proveedor.email}` : null,
    ]
      .filter(Boolean)
      .join("  |  ");

    if (contactoInfo) {
      doc.text(contactoInfo, 14, 30);
    }

    doc.text(`Período consultado: ${rangoTexto}`, 14, 36);
    doc.text(
      `Fecha de emisión: ${formatDateAR(now)} a las ${formatTimeAR(now)} hs`,
      14,
      41
    );

    // Caja de Resumen Financiero
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 46, 182, 20, 2, 2, "FD");

    doc.setTextColor(30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Saldo Anterior: ${formatMoney(saldoAnterior)}`, 20, 55);
    doc.text(`Total Débitos: ${formatMoney(totalDebitos)}`, 75, 55);
    doc.text(`Total Créditos: ${formatMoney(totalCreditos)}`, 130, 55);

    doc.setFontSize(10);
    doc.setTextColor(saldoFinal > 0 ? 185 : 16, saldoFinal > 0 ? 28 : 129, saldoFinal > 0 ? 28 : 64);
    const estadoSaldo =
      saldoFinal > 0
        ? `Saldo Deudor: ${formatMoney(saldoFinal)}`
        : saldoFinal < 0
        ? `Saldo a Favor: ${formatMoney(Math.abs(saldoFinal))}`
        : "Saldo al Día: $0,00";
    doc.text(estadoSaldo, 20, 62);

    // Tabla de Movimientos
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Detalle Cronológico de Operaciones", 14, 73);

    const columns = [
      "Fecha",
      "Comprobante / Concepto",
      "Débito",
      "Crédito",
      "Saldo Acum.",
      "Recibo",
    ];

    const rows: (string | number)[][] = [];

    // Fila inicial de saldo anterior si existe
    if (saldoAnterior !== 0) {
      rows.push([
        "-",
        "Saldo Anterior al Período",
        "-",
        "-",
        formatMoney(saldoAnterior),
        "-",
      ]);
    }

    for (const m of movimientos) {
      let reciboTexto = "-";
      if (m.tipo === "CREDITO") {
        reciboTexto = m.reciboRecibido
          ? `Recibido${m.reciboNumero ? ` (#${m.reciboNumero})` : ""}`
          : "PENDIENTE";
      }

      const conceptoTexto = m.anulado
        ? `[ANULADO] ${m.concepto}`
        : m.comprobante
        ? `${m.concepto} (N° ${m.comprobante})`
        : m.concepto;

      rows.push([
        m.fechaLegible,
        conceptoTexto,
        m.debito > 0 ? formatMoney(m.debito) : "-",
        m.credito > 0 ? formatMoney(m.credito) : "-",
        m.anulado ? "[Anulado]" : formatMoney(m.saldoAcumulado),
        reciboTexto,
      ]);
    }

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 76,
      theme: "striped",
      styles: { font: "helvetica", fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      columnStyles: {
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right", fontStyle: "bold" },
        5: { halign: "center" },
      },
      didParseCell: (data) => {
        // Colorear pendientes de recibo en rojo/ámbar
        if (data.column.index === 5 && data.cell.text[0] === "PENDIENTE") {
          data.cell.styles.textColor = [194, 65, 12];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    const cleanFileName = `cuenta-corriente-${proveedor.nombre
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")}-${formatYMD_AR(now)}.pdf`;
    doc.save(cleanFileName);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportarPDF}
      className="flex items-center gap-1.5 text-xs h-9 bg-white hover:bg-slate-50"
    >
      <FileText className="w-4 h-4 text-slate-600" />
      <span>Exportar PDF</span>
    </Button>
  );
}
