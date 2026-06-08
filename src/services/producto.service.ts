import { findProductoByCodigo, createProductoWithStock, updateProducto, reactivateProductoWithStock } from "../repositories/producto-crud.repository";
import { ProductoCreateInput, ProductoUpdateInput } from "../validators/producto.schema";

export async function registrarNuevoProducto(
  comercioId: string,
  usuarioId: string,
  data: ProductoCreateInput
) {
  // Verificar que el código interno no se repita en este comercio
  const existe = await findProductoByCodigo(comercioId, data.codigoInterno);
  if (existe) {
    if (existe.activo) {
      throw new Error(`El código interno "${data.codigoInterno}" ya está en uso.`);
    } else {
      // El producto existe pero fue eliminado, lo reactivamos con los nuevos datos
      return reactivateProductoWithStock(
        comercioId,
        existe.id,
        {
          codigoBarras: data.codigoBarras || null,
          nombre: data.nombre,
          descripcion: data.descripcion || null,
          precioCosto: data.precioCosto,
          precioVenta: data.precioVenta,
        },
        data.stockInicial,
        usuarioId
      );
    }
  }

  return createProductoWithStock(
    {
      comercioId,
      codigoInterno: data.codigoInterno,
      codigoBarras: data.codigoBarras || null,
      nombre: data.nombre,
      descripcion: data.descripcion || null,
      precioCosto: data.precioCosto,
      precioVenta: data.precioVenta,
    },
    data.stockInicial,
    usuarioId
  );
}

export async function modificarProducto(
  comercioId: string,
  id: string,
  data: ProductoUpdateInput
) {
  // Si cambia el código, verificar que no choque con otro
  const existe = await findProductoByCodigo(comercioId, data.codigoInterno);
  if (existe && existe.id !== id) {
    if (existe.activo) {
      throw new Error(`El código interno "${data.codigoInterno}" ya pertenece a otro producto.`);
    } else {
      throw new Error(`El código interno "${data.codigoInterno}" pertenece a un producto que fue eliminado.`);
    }
  }

  return updateProducto(comercioId, id, {
    codigoInterno: data.codigoInterno,
    codigoBarras: data.codigoBarras || null,
    nombre: data.nombre,
    descripcion: data.descripcion || null,
    precioCosto: data.precioCosto,
    precioVenta: data.precioVenta,
  });
}
