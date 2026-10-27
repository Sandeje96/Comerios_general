"use client";

import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateAR } from "@/lib/date-ar";

interface ProductoParaExportar {
  codigoInterno: string;
  nombre: string;
  stockActual: number;
}

export function ExportPdfButton({ productos }: { productos: ProductoParaExportar[] }) {
  const exportarPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text("Reporte de Stock de Productos", 14, 22);
    
    // Fecha en horario de Argentina
    doc.setFontSize(11);
    doc.text(`Fecha: ${formatDateAR(new Date())}`, 14, 30);

    // Tabla
    const tableColumn = ["Código Interno", "Nombre del Producto", "Stock Actual"];
    const tableRows = productos.map(producto => [
      producto.codigoInterno,
      producto.nombre,
      producto.stockActual.toString()
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: "striped",
      styles: { font: "helvetica", fontSize: 10 },
      headStyles: { fillColor: [15, 23, 42] }, // Color slate-900 para combinar con el dashboard
    });

    // Guardar
    doc.save("reporte-stock.pdf");
  };

  return (
    <Button 
      variant="outline" 
      onClick={exportarPDF}
      className="flex items-center gap-2"
    >
      <FileText className="w-4 h-4" />
      <span>Exportar PDF</span>
    </Button>
  );
}
