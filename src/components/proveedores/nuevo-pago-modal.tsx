"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createPagoAction,
  getCotizacionesPendientesAction,
} from "@/actions/proveedor.actions";
import { formatYMD_AR } from "@/lib/date-ar";
import {
  MEDIOS_PAGO_PROVEEDOR,
  MEDIO_PAGO_INFO,
  TipoMedioPagoProveedor,
  TipoEstadoCheque,
  ESTADOS_CHEQUE,
  ESTADO_CHEQUE_INFO,
} from "@/validators/proveedor.schema";
import {
  PlusCircle,
  X,
  DollarSign,
  Calendar,
  CreditCard,
  Building2,
  FileCheck2,
  Paperclip,
  Upload,
  CheckSquare,
  Square,
} from "lucide-react";

interface ProveedorSimple {
  id: string;
  nombre: string;
}

interface CotizacionPendiente {
  id: string;
  numeroComprobante: string;
  fecha: Date | string;
  montoTotal: number;
  montoPagado: number;
  saldoPendiente: number;
}

interface NuevoPagoModalProps {
  proveedorId?: string;
  proveedorNombre?: string;
  proveedoresDisponibles?: ProveedorSimple[];
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function NuevoPagoModal({
  proveedorId: defaultProveedorId,
  proveedorNombre,
  proveedoresDisponibles = [],
  trigger,
  onSuccess,
}: NuevoPagoModalProps) {
  const [open, setOpen] = useState(false);
  const [proveedorId, setProveedorId] = useState(defaultProveedorId || "");
  const [fecha, setFecha] = useState(() => formatYMD_AR());
  const [monto, setMonto] = useState("");
  const [medioPago, setMedioPago] = useState<TipoMedioPagoProveedor>("EFECTIVO");
  const [referencia, setReferencia] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Transferencia bancaria
  const [transferenciaBanco, setTransferenciaBanco] = useState("");
  const [transferenciaOperacion, setTransferenciaOperacion] = useState("");
  const [transferenciaFecha, setTransferenciaFecha] = useState(() => formatYMD_AR());

  // Cheque
  const [chequeNumero, setChequeNumero] = useState("");
  const [chequeBanco, setChequeBanco] = useState("");
  const [chequeFechaEmision, setChequeFechaEmision] = useState(() => formatYMD_AR());
  const [chequeFechaCobro, setChequeFechaCobro] = useState("");
  const [chequeEstado, setChequeEstado] = useState<TipoEstadoCheque>("PENDIENTE");

  // Comprobante de pago propio (ej. transferencia)
  const [comprobantePagoUrl, setComprobantePagoUrl] = useState<string | undefined>(undefined);
  const [comprobantePagoNombre, setComprobantePagoNombre] = useState<string | undefined>(undefined);

  // Control de Recibo del Proveedor
  const [reciboRecibido, setReciboRecibido] = useState(false);
  const [reciboNumero, setReciboNumero] = useState("");
  const [reciboArchivoUrl, setReciboArchivoUrl] = useState<string | undefined>(undefined);
  const [reciboArchivoNombre, setReciboArchivoNombre] = useState<string | undefined>(undefined);

  // Cotizaciones para imputación
  const [cotizacionesPendientes, setCotizacionesPendientes] = useState<CotizacionPendiente[]>([]);
  const [imputaciones, setImputaciones] = useState<Record<string, number>>({});
  const [mostrarImputacion, setMostrarImputacion] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeProveedorId = defaultProveedorId || proveedorId;

  // Cargar cotizaciones pendientes al abrir el modal o cambiar de proveedor
  useEffect(() => {
    if (open && activeProveedorId) {
      getCotizacionesPendientesAction(activeProveedorId).then((res) => {
        if (res.success && res.cotizaciones) {
          setCotizacionesPendientes(res.cotizaciones);
        } else {
          setCotizacionesPendientes([]);
        }
      });
    }
  }, [open, activeProveedorId]);

  const handleComprobantePagoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("El comprobante de pago no debe superar los 4MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setComprobantePagoUrl(reader.result as string);
      setComprobantePagoNombre(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleReciboArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("El archivo del recibo no debe superar los 4MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReciboArchivoUrl(reader.result as string);
      setReciboArchivoNombre(file.name);
    };
    reader.readAsDataURL(file);
  };

  const toggleCotizacionSelect = (cot: CotizacionPendiente) => {
    const currentVal = imputaciones[cot.id];
    if (currentVal !== undefined && currentVal > 0) {
      const next = { ...imputaciones };
      delete next[cot.id];
      setImputaciones(next);
    } else {
      setImputaciones({
        ...imputaciones,
        [cot.id]: cot.saldoPendiente,
      });
    }
  };

  const handleImputacionChange = (cotId: string, val: string) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      const next = { ...imputaciones };
      delete next[cotId];
      setImputaciones(next);
    } else {
      setImputaciones({
        ...imputaciones,
        [cotId]: num,
      });
    }
  };

  const resetForm = () => {
    setProveedorId(defaultProveedorId || "");
    setFecha(formatYMD_AR());
    setMonto("");
    setMedioPago("EFECTIVO");
    setReferencia("");
    setObservaciones("");
    setTransferenciaBanco("");
    setTransferenciaOperacion("");
    setTransferenciaFecha(formatYMD_AR());
    setChequeNumero("");
    setChequeBanco("");
    setChequeFechaEmision(formatYMD_AR());
    setChequeFechaCobro("");
    setChequeEstado("PENDIENTE");
    setComprobantePagoUrl(undefined);
    setComprobantePagoNombre(undefined);
    setReciboRecibido(false);
    setReciboNumero("");
    setReciboArchivoUrl(undefined);
    setReciboArchivoNombre(undefined);
    setImputaciones({});
    setMostrarImputacion(false);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!activeProveedorId) {
      setError("Seleccioná un proveedor");
      return;
    }

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setError("Ingresá un importe válido mayor a 0");
      return;
    }

    const cotizacionesArray = Object.entries(imputaciones)
      .filter(([_, val]) => val > 0)
      .map(([cotizacionId, montoAsignado]) => ({
        cotizacionId,
        montoAsignado,
      }));

    // Validación si se imputó más que el monto del pago
    const totalImputado = cotizacionesArray.reduce((acc, c) => acc + c.montoAsignado, 0);
    if (totalImputado > montoNum) {
      setError(
        `El total imputado ($${totalImputado.toLocaleString("es-AR")}) supera el importe del pago ($${montoNum.toLocaleString("es-AR")})`
      );
      return;
    }

    startTransition(async () => {
      const res = await createPagoAction({
        proveedorId: activeProveedorId,
        fecha,
        monto: montoNum,
        medioPago,
        referencia: referencia.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        comprobantePagoUrl,
        comprobantePagoNombre,
        reciboRecibido,
        reciboNumero: reciboNumero.trim() || undefined,
        reciboArchivoUrl,
        reciboArchivoNombre,
        transferenciaBanco: transferenciaBanco.trim() || undefined,
        transferenciaOperacion: transferenciaOperacion.trim() || undefined,
        transferenciaFecha: medioPago === "TRANSFERENCIA" ? transferenciaFecha : undefined,
        chequeNumero: chequeNumero.trim() || undefined,
        chequeBanco: chequeBanco.trim() || undefined,
        chequeFechaEmision: medioPago === "CHEQUE" ? chequeFechaEmision : undefined,
        chequeFechaCobro: medioPago === "CHEQUE" && chequeFechaCobro ? chequeFechaCobro : undefined,
        chequeEstado: medioPago === "CHEQUE" ? chequeEstado : undefined,
        cotizaciones: cotizacionesArray.length > 0 ? cotizacionesArray : undefined,
      });

      if (res.success) {
        handleClose();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || "No se pudo registrar el pago");
      }
    });
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registrar Pago</span>
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400">
                  Crédito / Disminución de Deuda
                </span>
                <h3 className="text-lg font-bold">
                  {proveedorNombre ? `Registrar Pago - ${proveedorNombre}` : "Registrar Pago a Proveedor"}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              {/* Selector de Proveedor (si no viene prefijado) */}
              {!defaultProveedorId && (
                <div className="space-y-1">
                  <Label htmlFor="pagoProveedorSelect" className="text-xs font-semibold text-slate-700">
                    Proveedor *
                  </Label>
                  <select
                    id="pagoProveedorSelect"
                    value={proveedorId}
                    onChange={(e) => setProveedorId(e.target.value)}
                    required
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">-- Seleccionar Proveedor --</option>
                    {proveedoresDisponibles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Importe y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="pagoMonto" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Importe Pagado ($) *
                  </Label>
                  <Input
                    id="pagoMonto"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej: 150000.00"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    required
                    className="text-base font-bold text-emerald-700"
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="pagoFecha" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Fecha del Pago
                  </Label>
                  <Input
                    id="pagoFecha"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Medio de Pago Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> Medio de Pago *
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MEDIOS_PAGO_PROVEEDOR.map((m) => {
                    const info = MEDIO_PAGO_INFO[m];
                    const selected = medioPago === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMedioPago(m)}
                        className={`text-left p-2.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-2 ${
                          selected
                            ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-600"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span className="text-base">{info.icon}</span>
                        <span className="truncate">{info.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Campos condicionales: TRANSFERENCIA BANCARIA */}
              {medioPago === "TRANSFERENCIA" && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Detalles de la Transferencia Bancaria</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label htmlFor="transferenciaBanco" className="text-[11px] font-medium text-slate-700">
                        Banco / Cuenta Origen
                      </Label>
                      <Input
                        id="transferenciaBanco"
                        placeholder="Ej: Banco Galicia Cta Cte"
                        value={transferenciaBanco}
                        onChange={(e) => setTransferenciaBanco(e.target.value)}
                        className="text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="transferenciaOperacion" className="text-[11px] font-medium text-slate-700">
                        N° Operación / Referencia
                      </Label>
                      <Input
                        id="transferenciaOperacion"
                        placeholder="Ej: 0098412356"
                        value={transferenciaOperacion}
                        onChange={(e) => setTransferenciaOperacion(e.target.value)}
                        className="text-xs bg-white"
                      />
                    </div>
                  </div>

                  {/* Adjunto comprobante bancario propio */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                      <Paperclip className="w-3 h-3 text-slate-500" /> Adjuntar Comprobante Bancario de Transferencia
                    </Label>
                    {comprobantePagoNombre ? (
                      <div className="flex items-center justify-between p-2 bg-white rounded-md border border-blue-200 text-xs">
                        <span className="truncate text-blue-900 font-medium">{comprobantePagoNombre}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setComprobantePagoUrl(undefined);
                            setComprobantePagoNombre(undefined);
                          }}
                          className="text-red-500 hover:text-red-700 text-xs font-bold ml-2"
                        >
                          Quitar
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-blue-300 bg-white rounded-md cursor-pointer hover:bg-blue-50/50 text-xs text-blue-700 font-medium">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir PDF o captura del comprobante</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleComprobantePagoChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Campos condicionales: CHEQUE */}
              {medioPago === "CHEQUE" && (
                <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <span>🧾 Datos del Cheque</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label htmlFor="chequeNumero" className="text-[11px] font-medium text-slate-700">
                        N° de Cheque *
                      </Label>
                      <Input
                        id="chequeNumero"
                        placeholder="Ej: 00458129"
                        value={chequeNumero}
                        onChange={(e) => setChequeNumero(e.target.value)}
                        className="text-xs bg-white"
                        required={medioPago === "CHEQUE"}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="chequeBanco" className="text-[11px] font-medium text-slate-700">
                        Banco Emisor
                      </Label>
                      <Input
                        id="chequeBanco"
                        placeholder="Ej: Banco Santander"
                        value={chequeBanco}
                        onChange={(e) => setChequeBanco(e.target.value)}
                        className="text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <Label htmlFor="chequeFechaEmision" className="text-[11px] font-medium text-slate-700">
                        Fecha Emisión
                      </Label>
                      <Input
                        id="chequeFechaEmision"
                        type="date"
                        value={chequeFechaEmision}
                        onChange={(e) => setChequeFechaEmision(e.target.value)}
                        className="text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="chequeFechaCobro" className="text-[11px] font-medium text-slate-700">
                        Fecha Cobro / Venc.
                      </Label>
                      <Input
                        id="chequeFechaCobro"
                        type="date"
                        value={chequeFechaCobro}
                        onChange={(e) => setChequeFechaCobro(e.target.value)}
                        className="text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="chequeEstado" className="text-[11px] font-medium text-slate-700">
                        Estado del Cheque
                      </Label>
                      <select
                        id="chequeEstado"
                        value={chequeEstado}
                        onChange={(e) => setChequeEstado(e.target.value as TipoEstadoCheque)}
                        className="w-full h-8 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
                      >
                        {ESTADOS_CHEQUE.map((st) => (
                          <option key={st} value={st}>
                            {ESTADO_CHEQUE_INFO[st].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Referencia y Observaciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="referencia" className="text-xs font-semibold text-slate-700">
                    Referencia / Identificación (Opcional)
                  </Label>
                  <Input
                    id="referencia"
                    placeholder="Ej: Pago parcial cotización #12"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pagoObservaciones" className="text-xs font-semibold text-slate-700">
                    Observaciones (Opcional)
                  </Label>
                  <Input
                    id="pagoObservaciones"
                    placeholder="Ej: Entregado en mano al repartidor"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* CONTROL DE RECIBO DEL PROVEEDOR (SECCIÓN CLAVE) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className={`w-5 h-5 ${reciboRecibido ? "text-emerald-600" : "text-amber-500"}`} />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        ¿Recibiste el Recibo Oficial del Proveedor?
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {reciboRecibido
                          ? "✅ Marcado como recibido. Podés cargar el número y adjuntarlo."
                          : "⏳ Quedará como pendiente de recibo hasta que el proveedor te lo entregue."}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reciboRecibido}
                      onChange={(e) => setReciboRecibido(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {reciboRecibido && (
                  <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label htmlFor="reciboNumero" className="text-[11px] font-medium text-slate-700">
                        N° de Recibo del Proveedor
                      </Label>
                      <Input
                        id="reciboNumero"
                        placeholder="Ej: REC-0001-0005432"
                        value={reciboNumero}
                        onChange={(e) => setReciboNumero(e.target.value)}
                        className="text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-slate-700">
                        Adjuntar Recibo (PDF o Imagen)
                      </Label>
                      {reciboArchivoNombre ? (
                        <div className="flex items-center justify-between p-1.5 bg-white rounded-md border border-slate-200 text-xs">
                          <span className="truncate font-medium text-slate-700">{reciboArchivoNombre}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setReciboArchivoUrl(undefined);
                              setReciboArchivoNombre(undefined);
                            }}
                            className="text-red-500 text-xs font-bold ml-1"
                          >
                            Quitar
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-1.5 p-1.5 border border-dashed border-slate-300 bg-white rounded-md cursor-pointer hover:bg-slate-50 text-xs text-slate-600">
                          <Upload className="w-3.5 h-3.5 text-slate-400" />
                          <span>Subir Recibo</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleReciboArchivoChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ASOCIACIÓN CON COTIZACIONES PENDIENTES (OPCIONAL) */}
              {cotizacionesPendientes.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMostrarImputacion(!mostrarImputacion)}
                    className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-between text-xs font-bold text-slate-800"
                  >
                    <span>
                      📋 Imputar a Cotizaciones Pendientes ({cotizacionesPendientes.length} disponibles)
                    </span>
                    <span className="text-slate-500 font-normal">
                      {mostrarImputacion ? "Ocultar ▲" : "Mostrar / Desplegar ▼"}
                    </span>
                  </button>

                  {mostrarImputacion && (
                    <div className="p-3 space-y-2 bg-slate-50 text-xs">
                      <p className="text-[11px] text-slate-500">
                        Podés asociar este pago a una o varias cotizaciones. Esto no duplicará el crédito en la cuenta corriente.
                      </p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {cotizacionesPendientes.map((c) => {
                          const isSelected = imputaciones[c.id] !== undefined;
                          return (
                            <div
                              key={c.id}
                              className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${
                                isSelected ? "bg-white border-emerald-500 shadow-xs" : "bg-white border-slate-200"
                              }`}
                            >
                              <div
                                onClick={() => toggleCotizacionSelect(c)}
                                className="flex items-center gap-2 cursor-pointer select-none flex-1"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400" />
                                )}
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    Cotización #{c.numeroComprobante}
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    Total: ${c.montoTotal.toLocaleString("es-AR")} | Pendiente: $
                                    {c.saldoPendiente.toLocaleString("es-AR")}
                                  </p>
                                </div>
                              </div>

                              {isSelected && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] font-medium text-slate-500">$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    max={c.saldoPendiente}
                                    value={imputaciones[c.id] || ""}
                                    onChange={(e) => handleImputacionChange(c.id, e.target.value)}
                                    className="w-24 h-7 text-xs font-bold text-emerald-700 text-right"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botones de acción */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isPending ? "Guardando Pago..." : "Confirmar Pago"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
