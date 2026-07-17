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
  const { items, addItem, addItemLibre, removeItem, updateCantidad, clearCart, total } = useCart();

  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ProductoSearchResult[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comprobante, setComprobante] = useState<VentaResult | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Formulario de ítem libre ──
  const [mostrarFormLibre, setMostrarFormLibre] = useState(false);
  const [libreNombre, setLibreNombre] = useState("");
  const [librePrecio, setLibrePrecio] = useState("");
  const [libreCantidad, setLibreCantidad] = useState("1");
  const [libreError, setLibreError] = useState<string | null>(null);

  // ── Búsqueda de productos ──
  const handleSearch = useCallback(async (value: string) => {
    setQuery(value);
    if (value.trim().length < 1) { setResultados([]); return; }
    setBuscando(true);
    const result = await searchProductosAction(value);
    setBuscando(false);
    if (result.success) setResultados(result.data);
  }, []);

  // ── Agregar al carrito (producto con stock) ──
  const handleSelectProducto = (producto: ProductoSearchResult) => {
    addItem(producto);
    setQuery("");
    setResultados([]);
  };

  // ── Agregar ítem libre ──
  const handleAgregarLibre = () => {
    setLibreError(null);
    const nombre = libreNombre.trim();
    const precio = parseFloat(librePrecio);
    const cantidad = parseInt(libreCantidad, 10);

    if (!nombre) { setLibreError("Ingresá una descripción del producto."); return; }
    if (isNaN(precio) || precio <= 0) { setLibreError("El precio debe ser mayor a cero."); return; }
    if (isNaN(cantidad) || cantidad < 1) { setLibreError("La cantidad debe ser al menos 1."); return; }

    // Agregar tantas veces como la cantidad indicada (reutiliza addItemLibre)
    for (let i = 0; i < cantidad; i++) {
      addItemLibre(nombre, precio);
    }

    // Limpiar formulario
    setLibreNombre("");
    setLibrePrecio("");
    setLibreCantidad("1");
    setMostrarFormLibre(false);
  };

  // ── Confirmar venta ──
  const handleConfirmar = () => {
    if (items.length === 0) return;
    setError(null);
    startTransition(async () => {
      const itemsStock = items
        .filter((i) => !i.esLibre)
        .map((i) => ({ productoId: i.productoId, cantidad: i.cantidad }));

      const itemsLibresPayload = items
        .filter((i) => i.esLibre)
        .map((i) => ({
          nombre: i.nombre,
          precioUnitario: i.precioVenta,
          cantidad: i.cantidad,
        }));

      const payload = { items: itemsStock, itemsLibres: itemsLibresPayload };
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

          {/* ── Botón / Formulario de Ítem Libre ── */}
          {!mostrarFormLibre ? (
            <button
              id="btn-agregar-libre"
              onClick={() => { setMostrarFormLibre(true); setQuery(""); setResultados([]); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-sm font-medium w-full"
            >
              <span className="text-lg leading-none">＋</span>
              Agregar producto sin stock (ingreso manual)
            </button>
          ) : (
            <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-indigo-700">Producto sin stock</p>
                <button
                  onClick={() => { setMostrarFormLibre(false); setLibreError(null); }}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Descripción del producto</label>
                <Input
                  id="libre-nombre"
                  type="text"
                  placeholder="Ej: Aceite girasol 1L"
                  value={libreNombre}
                  onChange={(e) => setLibreNombre(e.target.value)}
                  className="h-10"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && document.getElementById("libre-precio")?.focus()}
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Precio unitario ($)</label>
                  <Input
                    id="libre-precio"
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={librePrecio}
                    onChange={(e) => setLibrePrecio(e.target.value)}
                    className="h-10"
                    onKeyDown={(e) => e.key === "Enter" && document.getElementById("libre-cantidad")?.focus()}
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs text-slate-500 mb-1 block">Cantidad</label>
                  <Input
                    id="libre-cantidad"
                    type="number"
                    placeholder="1"
                    min="1"
                    max="9999"
                    value={libreCantidad}
                    onChange={(e) => setLibreCantidad(e.target.value)}
                    className="h-10"
                    onKeyDown={(e) => e.key === "Enter" && handleAgregarLibre()}
                  />
                </div>
              </div>

              {libreError && (
                <p className="text-xs text-red-500">{libreError}</p>
              )}

              <Button
                id="btn-confirmar-libre"
                onClick={handleAgregarLibre}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700"
              >
                Agregar al carrito
              </Button>
            </div>
          )}

          {/* Empty state */}
          {query.length === 0 && items.length === 0 && !mostrarFormLibre && (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
              <div className="text-5xl mb-3">🔍</div>
              <p className="font-medium text-slate-500">Buscá un producto para comenzar</p>
              <p className="text-sm mt-1">Podés buscar por nombre, código interno o código de barras</p>
              <p className="text-sm mt-1 text-slate-400">O usá el botón de abajo para agregar uno sin stock</p>
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
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.nombre}</p>
                        {item.esLibre && (
                          <span className="shrink-0 text-[10px] font-semibold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                            LIBRE
                          </span>
                        )}
                      </div>
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
                        disabled={!item.esLibre && item.cantidad >= item.stockActual}
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
