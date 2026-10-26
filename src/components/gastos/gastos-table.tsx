"use client";

import { useState, useTransition } from "react";
import { GastoItemResponse } from "@/services/gasto.service";
import { deleteGastoAction } from "@/actions/gasto.actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, Receipt, AlertCircle } from "lucide-react";

interface GastosTableProps {
  gastos: GastoItemResponse[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
}

export function GastosTable({ gastos }: GastosTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("TODAS");
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEliminar = (id: string) => {
    setEliminandoId(id);
    startTransition(async () => {
      await deleteGastoAction(id);
      setEliminandoId(null);
      setConfirmDeleteId(null);
    });
  };

  const filteredGastos = gastos.filter((g) => {
    // Filtro categoría
    if (categoriaFiltro !== "TODAS" && g.categoria !== categoriaFiltro) {
      return false;
    }

    // Filtro texto
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const descMatch = g.descripcion.toLowerCase().includes(term);
    const compMatch = g.comprobante?.toLowerCase().includes(term);
    const catMatch = g.categoriaLabel.toLowerCase().includes(term);
    const pagoMatch = g.metodoPago?.toLowerCase().includes(term);
    return descMatch || compMatch || catMatch || pagoMatch;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Barra de Búsqueda y Filtro de Categoría */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Buscar por concepto, comprobante o medio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="TODAS">Todas las categorías</option>
            <option value="PROVEEDORES">📦 Proveedores</option>
            <option value="ALQUILER">🏢 Alquiler</option>
            <option value="SERVICIOS">💡 Boletas / Servicios</option>
            <option value="INTERNET_TELEFONIA">🌐 Internet / Tel</option>
            <option value="SUELDOS">👥 Sueldos</option>
            <option value="MANTENIMIENTO">🔧 Mantenimiento</option>
            <option value="IMPUESTOS">📑 Impuestos</option>
            <option value="OTROS">📌 Otros</option>
          </select>
        </div>

        <span className="text-xs text-slate-500">
          Mostrando <b>{filteredGastos.length}</b> de <b>{gastos.length}</b> gastos
        </span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-28 text-xs font-semibold">Fecha</TableHead>
              <TableHead className="text-xs font-semibold">Categoría</TableHead>
              <TableHead className="text-xs font-semibold">Concepto / Descripción</TableHead>
              <TableHead className="text-xs font-semibold">Comprobante / Ref</TableHead>
              <TableHead className="text-xs font-semibold">Medio de Pago</TableHead>
              <TableHead className="text-xs font-semibold text-right">Monto ($)</TableHead>
              <TableHead className="text-xs font-semibold text-center w-20">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGastos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Receipt className="w-8 h-8 mb-2 stroke-1" />
                    <p className="text-sm font-medium text-slate-600">
                      No se registraron gastos en este período
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Podés registrar uno nuevo con el botón "Registrar Gasto" o cambiar el filtro.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredGastos.map((gasto) => (
                <TableRow
                  key={gasto.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <TableCell className="text-xs text-slate-600 font-medium">
                    {gasto.fechaLegible}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium py-0.5 px-2 flex items-center gap-1 w-fit ${gasto.categoriaColor}`}
                    >
                      <span>{gasto.categoriaIcon}</span>
                      <span>{gasto.categoriaLabel}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-800">
                    {gasto.descripcion}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">
                    {gasto.comprobante ? gasto.comprobante : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {gasto.metodoPago ? (
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {gasto.metodoPago}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-bold text-rose-700 text-right">
                    {formatCurrency(gasto.monto)}
                  </TableCell>
                  <TableCell className="text-center">
                    {confirmDeleteId === gasto.id ? (
                      <div className="flex items-center gap-1 justify-center animate-in fade-in">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleEliminar(gasto.id)}
                          disabled={isPending && eliminandoId === gasto.id}
                          className="h-7 text-[10px] px-2"
                        >
                          {isPending && eliminandoId === gasto.id ? "..." : "Sí"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDeleteId(null)}
                          className="h-7 text-[10px] px-2 text-slate-500"
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDeleteId(gasto.id)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
