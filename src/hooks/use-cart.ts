import { create } from "zustand";
import { CartItem, ProductoSearchResult } from "@/types/pos.types";

interface CartStore {
  items: CartItem[];
  addItem: (producto: ProductoSearchResult) => void;
  removeItem: (productoId: string) => void;
  updateCantidad: (productoId: string, cantidad: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],

  addItem: (producto: ProductoSearchResult) => {
    set((state) => {
      const existing = state.items.find((i) => i.productoId === producto.id);

      if (existing) {
        // Si ya está, incrementar cantidad (respetando stock)
        const nuevaCantidad = Math.min(
          existing.cantidad + 1,
          producto.stockActual
        );
        return {
          items: state.items.map((i) =>
            i.productoId === producto.id
              ? {
                  ...i,
                  cantidad: nuevaCantidad,
                  subtotal: i.precioVenta * nuevaCantidad,
                }
              : i
          ),
        };
      }

      // Si no está, agregar como nuevo ítem
      const newItem: CartItem = {
        productoId: producto.id,
        codigoInterno: producto.codigoInterno,
        nombre: producto.nombre,
        precioVenta: producto.precioVenta,
        precioCosto: producto.precioCosto,
        cantidad: 1,
        subtotal: producto.precioVenta,
        stockActual: producto.stockActual,
      };

      return { items: [...state.items, newItem] };
    });
  },

  removeItem: (productoId: string) => {
    set((state) => ({
      items: state.items.filter((i) => i.productoId !== productoId),
    }));
  },

  updateCantidad: (productoId: string, cantidad: number) => {
    set((state) => {
      if (cantidad <= 0) {
        return { items: state.items.filter((i) => i.productoId !== productoId) };
      }

      return {
        items: state.items.map((i) => {
          if (i.productoId !== productoId) return i;
          const cantidadFinal = Math.min(cantidad, i.stockActual);
          return {
            ...i,
            cantidad: cantidadFinal,
            subtotal: i.precioVenta * cantidadFinal,
          };
        }),
      };
    });
  },

  clearCart: () => set({ items: [] }),

  total: () => get().items.reduce((acc, item) => acc + item.subtotal, 0),
}));
