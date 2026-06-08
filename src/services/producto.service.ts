import { findProductoByCodigo, createProductoWithStock, updateProducto } from "../repositories/producto-crud.repository";
import { ProductoCreateInput, ProductoUpdateInput } from "../validators/producto.schema";

export async function registrarNuevoProducto(
  comercioId: string,
  usuarioId: string,
  data: ProductoCreateInput
) {
  // Verificar que el código interno no se repita en este comercio
  const existe = await findProductoByCodigo(comercioId, data.codigoInterno);
  if (existe) {
    throw new Error(`El código interno "${data.codigoInterno}" ya está en uso.`);
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
    throw new Error(`El código interno "${data.codigoInterno}" ya pertenece a otro producto.`);
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
