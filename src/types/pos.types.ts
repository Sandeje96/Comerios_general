// pos.types.ts — Tipos del módulo de Punto de Venta

// ─────────────────────────────────────────────
// CARRITO (estado en memoria del cliente)
// ─────────────────────────────────────────────

export interface CartItem {
  productoId: string;      // UUID real del producto, o prefijo "libre_" + UUID para ítems libres
  codigoInterno: string;
  nombre: string;
  precioVenta: number;
  precioCosto: number | null;
  cantidad: number;
  subtotal: number;
  stockActual: number;     // Para validación client-side (9999 para ítems libres)
  esLibre?: boolean;       // true = ítem ingresado manualmente sin stock
}

// ─────────────────────────────────────────────
// PRODUCTO BUSCADO (resultado del buscador POS)
// ─────────────────────────────────────────────

export interface ProductoSearchResult {
  id: string;
  codigoInterno: string;
  codigoBarras: string | null;
  nombre: string;
  descripcion: string | null;
  precioVenta: number;
  precioCosto: number | null;
  stockActual: number;
}

// ─────────────────────────────────────────────
// SNAPSHOT DEL COMPROBANTE (guardado en JSON)
// ─────────────────────────────────────────────

export interface ComprobanteSnapshot {
  numeroComprobante: number;
  fecha: string;        // ISO 8601
  dia: string;          // "Domingo 08 de Junio de 2026"
  hora: string;         // "23:34"
  empresa: {
    nombreFantasia: string;
    email: string;
    celular: string | null;
  };
  comitente: {
    nombre: string;
    email: string;
  };
  items: ComprobanteItem[];
  total: number;
}

export interface ComprobanteItem {
  nombre: string;
  codigoInterno: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

// ─────────────────────────────────────────────
// PAYLOAD PARA SERVER ACTION
// ─────────────────────────────────────────────

export interface VentaPayload {
  items: VentaItemPayload[];
  itemsLibres?: ItemLibrePayload[];
}

export interface VentaItemPayload {
  productoId: string;
  cantidad: number;
}

/** Ítem libre: producto sin stock en sistema, ingresado manualmente */
export interface ItemLibrePayload {
  nombre: string;
  precioUnitario: number;
  cantidad: number;
}

// ─────────────────────────────────────────────
// RESULTADO DE CONFIRMAR VENTA
// ─────────────────────────────────────────────

export interface VentaResult {
  ventaId: string;
  comprobanteId: string;
  numeroComprobante: number;
  snapshot: ComprobanteSnapshot;
}

// ─────────────────────────────────────────────
// RESPUESTA GENÉRICA DE SERVER ACTIONS
// ─────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
