"use client";

import { useState, useCallback, useTransition } from "react";
import { useCart } from "@/hooks/use-cart";
import { searchProductosAction, confirmarVentaAction } from "@/actions/pos.actions";
import { ProductoSearchResult, VentaResult, CartItem } from "@/types/pos.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComprobanteView } from "@/components/pos/comprobante-view";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function VentasPage() {
  const { items, addItem, removeItem, updateCantidad, clearCart, total } = useCart();

  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ProductoSearchResult[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comprobante, setComprobante] = useState<VentaResult | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Búsqueda de productos ──
  const handleSearch = useCallback(async (value: string) => {
    setQuery(value);
    if (value.trim().length < 1) { setResultados([]); return; }
    setBuscando(true);
    const result = await searchProductosAction(value);
    setBuscando(false);
    if (result.success) setResultados(result.data);
  }, []);

  // ── Agregar al carrito ──
  const handleSelectProducto = (producto: ProductoSearchResult) => {
    addItem(producto);
    setQuery("");
    setResultados([]);
  };

  // ── Confirmar venta ──
  const handleConfirmar = () => {
    if (items.length === 0) return;
    setError(null);
    startTransition(async () => {
      const payload = { items: items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })) };
      const result = await confirmarVentaAction(payload);
      if (result.success) {
        setComprobante(result.data);
        clearCart();
      } else {
        setError(result.error);
      }
    });
  };

  // ── Vista de comprobante ──
  if (comprobante) {
    return (
      <ComprobanteView
        result={comprobante}
        onNuevaVenta={() => setComprobante(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Terminal de Ventas</h1>
          <p className="text-xs text-slate-500">
            {items.length} {items.length === 1 ? "producto" : "productos"} en carrito
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.href = "/dashboard"}>
          ← Panel
        </Button>
      </header>

      <div className="flex h-[calc(100vh-57px)]">
        {/* ── Columna izquierda: Buscador ── */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          {/* Buscador */}
          <div className="relative">
            <Input
              id="buscador-producto"
              type="text"
              placeholder="Buscar por nombre, código o barras..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="text-base h-12 pr-4"
              autoFocus
              autoComplete="off"
            />
            {buscando && (
              <p className="absolute right-3 top-3.5 text-xs text-slate-400">Buscando...</p>
            )}
          </div>

          {/* Resultados de búsqueda */}
          {resultados.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {resultados.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProducto(p)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-sm text-slate-900">{p.nombre}</p>
                    <p className="text-xs text-slate-500">Código: {p.codigoInterno}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatCurrency(p.precioVenta)}</p>
                    <p className={`text-xs ${p.stockActual === 0 ? "text-red-500" : "text-slate-400"}`}>
                      Stock: {p.stockActual}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {query.length === 0 && items.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
              <div className="text-5xl mb-3">🔍</div>
              <p className="font-medium text-slate-500">Buscá un producto para comenzar</p>
              <p className="text-sm mt-1">Podés buscar por nombre, código interno o código de barras</p>
            </div>
          )}
        </div>

        {/* ── Columna derecha: Carrito ── */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Carrito</h2>
          </div>

          {/* Ítems */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="text-4xl mb-2">🛒</div>
                <p className="text-sm">El carrito está vacío</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {items.map((item: CartItem) => (
                  <div key={item.productoId} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.nombre}</p>
                      <p className="text-xs text-slate-500">{formatCurrency(item.precioVenta)} c/u</p>
                    </div>
                    {/* Cantidad */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateCantidad(item.productoId, item.cantidad - 1)}
                        className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center transition-colors"
                      >−</button>
                      <span className="w-8 text-center text-sm font-semibold">{item.cantidad}</span>
                      <button
                        onClick={() => updateCantidad(item.productoId, item.cantidad + 1)}
                        disabled={item.cantidad >= item.stockActual}
                        className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 font-bold text-sm flex items-center justify-center transition-colors"
                      >+</button>
                    </div>
                    {/* Subtotal */}
                    <div className="text-right w-20">
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.subtotal)}</p>
                      <button
                        onClick={() => removeItem(item.productoId)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >Quitar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer carrito */}
          <div className="border-t border-slate-200 p-4 space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Total</span>
              <span className="text-2xl font-bold text-slate-900">{formatCurrency(total())}</span>
            </div>
            <Button
              id="btn-confirmar-venta"
              className="w-full h-12 text-base font-semibold"
              onClick={handleConfirmar}
              disabled={items.length === 0 || isPending}
            >
              {isPending ? "Procesando..." : "Confirmar Venta"}
            </Button>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Vaciar carrito
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
