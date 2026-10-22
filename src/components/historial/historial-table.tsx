"use client";

import { useState } from "react";
import { VentaHistorialItem } from "@/services/historial.service";
import { HistorialDetalleModal } from "./historial-detalle-modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Search, ShoppingBag } from "lucide-react";

interface HistorialTableProps {
  ventas: VentaHistorialItem[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value);
}

export function HistorialTable({ ventas }: HistorialTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVenta, setSelectedVenta] = useState<VentaHistorialItem | null>(null);

  const filteredVentas = ventas.filter((v) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const ticketMatch = v.numeroComprobante?.toString().includes(term);
    const cajeroMatch = v.cajero.toLowerCase().includes(term);
    const itemMatch = v.items.some((i) => i.nombre.toLowerCase().includes(term));
    return ticketMatch || cajeroMatch || itemMatch;
  });

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Barra superior de la tabla */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Buscar por ticket, cajero o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <span className="text-xs text-slate-500">
            Mostrando <b>{filteredVentas.length}</b> de <b>{ventas.length}</b> operaciones
          </span>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-24 text-xs font-semibold">Comprobante</TableHead>
                <TableHead className="text-xs font-semibold">Fecha y Hora</TableHead>
                <TableHead className="text-xs font-semibold">Atendido por</TableHead>
                <TableHead className="text-xs font-semibold text-center">Artículos</TableHead>
                <TableHead className="text-xs font-semibold text-right">Total</TableHead>
                <TableHead className="text-xs font-semibold text-center w-24">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVentas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <ShoppingBag className="w-8 h-8 mb-2 stroke-1" />
                      <p className="text-sm font-medium text-slate-600">
                        No se registraron ventas en este período
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Probá cambiando el filtro de fechas o seleccionando otro rango.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVentas.map((venta) => (
                  <TableRow
                    key={venta.id}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    onClick={() => setSelectedVenta(venta)}
                  >
                    <TableCell className="font-mono font-bold text-xs text-slate-900">
                      {venta.numeroComprobante ? (
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                          #{String(venta.numeroComprobante).padStart(4, "0")}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 font-medium">
                      {venta.fechaLegible}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold uppercase">
                          {venta.cajero.slice(0, 2)}
                        </div>
                        <span>{venta.cajero}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 text-center">
                      <Badge variant="outline" className="font-normal text-xs">
                        {venta.cantidadArticulos} {venta.cantidadArticulos === 1 ? "ítem" : "ítems"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-bold text-slate-900 text-right">
                      {formatCurrency(venta.total)}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedVenta(venta)}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de Detalle */}
      <HistorialDetalleModal
        venta={selectedVenta}
        onClose={() => setSelectedVenta(null)}
      />
    </>
  );
}
