"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, RefreshCw, Car, ImageIcon } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ExitTimeDisplay from "./exit-time-display";
import { sortPaymentsByUrgency } from "@/lib/payment-utils";
import ImageWithFallback from "../image-with-fallback";
import React from "react";

export interface PendingPayment {
  _id: string;
  codigoTicket: string;
  referenciaTransferencia: string;
  banco: string;
  telefono: string;
  numeroIdentidad: string;
  montoPagado: number;
  montoCalculado: number;
  fechaPago: string;
  estado: string;
  tiempoSalida?: string;
  tiempoSalidaEstimado?: string;
  tipoPago?: string;
  carInfo: {
    placa: string;
    marca: string;
    modelo: string;
    color: string;
    nombreDueño: string;
    telefono: string;
    horaIngreso?: string;
    fechaRegistro?: string;
    imagenes?: {
      plateImageUrl?: string;
      vehicleImageUrl?: string;
      fechaCaptura?: string;
      capturaMetodo?: string;
    };
  };
  montoPagadoUsd?: number;
  tasaCambioUsada?: number;
}

interface PendingPaymentsProps {
  onStatsUpdate: () => void;
}

interface PendingPaymentCardProps {
  payment: PendingPayment;
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
  isProcessing: boolean;
}

const PendingPaymentCard: React.FC<PendingPaymentCardProps> = ({
  payment,
  onValidate,
  onReject,
  isProcessing,
}) => {
  const [companySettings, setCompanySettings] = useState<{ tarifas: { precioHora: number; tasaCambio: number } } | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const response = await fetch("/api/company-settings");
        if (response.ok) {
          const data = await response.json();
          setCompanySettings(data);
        }
      } catch (error) {
        console.error("Error fetching company settings:", error);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchCompanySettings();
  }, []);

  if (process.env.NODE_ENV === "development") {
    console.log(`🔍 DEBUG: Renderizando PendingPaymentCard para ticket ${payment.codigoTicket}`, payment);
  }

  const formatDataWithFallback = (value: string | undefined) => {
    if (!value || value === "Por definir" || value === "PENDIENTE") {
      return "Dato no proporcionado";
    }
    return value;
  };

  const tasaCambio = companySettings?.tarifas.tasaCambio || payment.tasaCambioUsada || 35.0;
  const precioHora = companySettings?.tarifas.precioHora || 3.0;

  const isUsdPayment = payment.tipoPago === "efectivo_usd";
  const montoToDisplay = isUsdPayment
    ? formatCurrency(payment.montoCalculado, "USD")
    : formatCurrency(payment.montoCalculado * tasaCambio, "VES");

  const hours = payment.montoCalculado / precioHora;
  const formattedHours = hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1);

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-lg">Ticket: {payment.codigoTicket}</h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Fecha de Pago</p>
          <p className="font-medium">{formatDateTime(payment.fechaPago || payment.fechaCreacion)}</p>
        </div>
      </div>

      {payment.tipoPago && (
        <div className="bg-blue-100 p-3 rounded-lg text-center">
          <h4 className="text-2xl font-bold text-blue-800">
            {payment.tipoPago === "efectivo_bs" ? "EFECTIVO BS" : payment.tipoPago === "efectivo_usd" ? "EFECTIVO USD" : payment.tipoPago.toUpperCase()}
          </h4>
        </div>
      )}

      <ExitTimeDisplay
        tiempoSalida={payment.tiempoSalida}
        tiempoSalidaEstimado={payment.tiempoSalidaEstimado}
        fechaPago={payment.fechaPago || payment.fechaCreacion}
        codigoTicket={payment.codigoTicket}
        variant="full"
      />

      {payment.carInfo && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Car className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-blue-800">Vehículo a Retirar</h4>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div>
                  <span className="text-gray-600 text-sm">Placa:</span>
                  <span className="font-medium ml-2 text-lg">{formatDataWithFallback(payment.carInfo.placa)}</span>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Vehículo:</span>
                  <span className="font-medium ml-2">
                    {formatDataWithFallback(payment.carInfo.marca)} {formatDataWithFallback(payment.carInfo.modelo)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Color:</span>
                  <span className="font-medium ml-2">{formatDataWithFallback(payment.carInfo.color)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-600 text-sm">Propietario:</span>
                  <span className="font-medium ml-2">{formatDataWithFallback(payment.carInfo.nombreDueño)}</span>
                </div>
                {payment.carInfo.telefono && payment.carInfo.telefono !== "Por definir" && (
                  <div>
                    <span className="text-gray-600 text-sm">Teléfono:</span>
                    <span className="font-medium ml-2">{payment.carInfo.telefono}</span>
                  </div>
                )}
                {(payment.carInfo.horaIngreso || payment.carInfo.fechaRegistro) && (
                  <div>
                    <span className="text-gray-600 text-sm">Ingreso:</span>
                    <span className="font-medium ml-2 text-sm">
                      {formatDateTime(payment.carInfo.fechaRegistro || payment.carInfo.horaIngreso)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {(payment.carInfo.imagenes?.plateImageUrl || payment.carInfo.imagenes?.vehicleImageUrl) && (
              <div className="lg:col-span-3 mt-4">
                <h5 className="text-sm font-medium text-gray-700 flex items-center mb-2">
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Imágenes de Referencia
                </h5>
                <div className="flex flex-wrap gap-4 justify-center">
                  {payment.carInfo.imagenes?.plateImageUrl && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Placa</p>
                      <ImageWithFallback
                        src={payment.carInfo.imagenes.plateImageUrl}
                        alt={`Placa del vehículo ${payment.carInfo.placa}`}
                        className="w-64 h-48 object-cover rounded border"
                        fallback="/placeholder.svg"
                      />
                    </div>
                  )}
                  {payment.carInfo.imagenes?.vehicleImageUrl && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Vehículo</p>
                      <ImageWithFallback
                        src={payment.carInfo.imagenes.vehicleImageUrl}
                        alt={`Vehículo ${payment.carInfo.marca} ${payment.carInfo.modelo}`}
                        className="w-64 h-48 object-cover rounded border"
                        fallback="/placeholder.svg"
                      />
                    </div>
                  )}
                </div>
                {payment.carInfo.imagenes?.fechaCaptura && (
                  <div className="text-xs text-gray-500 text-center mt-2">
                    <p>Capturado: {formatDateTime(payment.carInfo.imagenes.fechaCaptura)}</p>
                    {payment.carInfo.imagenes.capturaMetodo && (
                      <p className="capitalize">
                        Método: {payment.carInfo.imagenes.capturaMetodo.replace("_", " ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div>
          <p className="text-sm text-gray-500">Monto a Pagar</p>
          <p className="text-2xl font-bold">{montoToDisplay}</p>
        </div>
        <div className="text-sm text-gray-600">
          <p>Detalles del Cálculo:</p>
          <p>{formattedHours} horas * {formatCurrency(precioHora, "USD")} por hora = {formatCurrency(payment.montoCalculado, "USD")}</p>
          <p>Tasa de Cambio Usada: 1 USD = {formatCurrency(tasaCambio, "VES")}</p>
        </div>
      </div>

      {payment.tipoPago?.startsWith("efectivo") && (
        <div className="bg-yellow-50 p-3 rounded-lg mt-3">
          <p className="text-sm text-yellow-800 font-medium flex items-center">
            <span className="mr-2">💰</span> Pago en Efectivo - Cliente debe dirigirse a taquilla
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            El cliente está en camino para completar el pago en efectivo.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Referencia de Transferencia</p>
          <p className="font-medium">{payment.referenciaTransferencia}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Banco</p>
          <p className="font-medium">{payment.banco}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Teléfono</p>
          <p className="font-medium">{payment.telefono}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Número de Identidad</p>
          <p className="font-medium">{payment.numeroIdentidad}</p>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button
          onClick={() => onValidate(payment._id)}
          disabled={isProcessing}
          className="flex-1"
          aria-label={`Validar pago ${payment.codigoTicket}`}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {isProcessing ? "Validando..." : "Validar Pago"}
        </Button>
        <Button
          onClick={() => onReject(payment._id)}
          disabled={isProcessing}
          variant="destructive"
          className="flex-1"
          aria-label={`Rechazar pago ${payment.codigoTicket}`}
        >
          <XCircle className="h-4 w-4 mr-2" />
          {isProcessing ? "Rechazando..." : "Rechazar Pago"}
        </Button>
      </div>
    </div>
  );
};

const PendingPayments = ({ onStatsUpdate }: PendingPaymentsProps) => {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const isFetchingRef = useRef(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const fetchCounterRef = useRef(0);
  const renderCountRef = useRef(0);
  const prevOnStatsUpdateRef = useRef(onStatsUpdate);
  const prevPaymentsRef = useRef<PendingPayment[]>(payments);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `🔍 DEBUG: Estado actualizado - payments.length: ${payments.length}, isLoading: ${isLoading}, error: ${error}`
      );
    }
  }, [payments, isLoading, error]);

  renderCountRef.current += 1;
  if (process.env.NODE_ENV === "development") {
    console.log(`🔍 DEBUG: Renderizado de PendingPayments #${renderCountRef.current}`);
    if (prevOnStatsUpdateRef.current !== onStatsUpdate) {
      console.log("🔍 DEBUG: onStatsUpdate cambió, posible causa de re-render");
      prevOnStatsUpdateRef.current = onStatsUpdate;
    }
  }

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 DEBUG: Montando PendingPayments");
    }
    return () => {
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 DEBUG: Desmontando PendingPayments");
      }
    };
  }, []);

  const sortedPayments = useMemo(() => {
    return [...payments].sort(sortPaymentsByUrgency);
  }, [payments]);

  const arePaymentsEqual = (newPayments: PendingPayment[], oldPayments: PendingPayment[]) => {
    if (newPayments.length !== oldPayments.length) return false;
    if (newPayments.length === 0) return true;
    return newPayments.every((newPayment, index) => newPayment._id === oldPayments[index]._id);
  };

  const fetchPendingPayments = useCallback(async (showLoading = true, source = "unknown") => {
    fetchCounterRef.current += 1;
    const fetchId = fetchCounterRef.current;
    if (isFetchingRef.current) {
      if (process.env.NODE_ENV === "development") {
        console.log(`🔍 DEBUG: Solicitud #${fetchId} en curso (fuente: ${source}), omitiendo fetch`);
      }
      return;
    }

    try {
      if (process.env.NODE_ENV === "development") {
        console.log(`🔍 DEBUG: Iniciando solicitud #${fetchId} (fuente: ${source})`);
      }
      if (showLoading) setIsLoading(true);
      isFetchingRef.current = true;

      const timestamp = new Date().getTime();
      const response = await fetch(`/api/admin/pending-payments?t=${timestamp}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar pagos pendientes");
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Formato de datos inválido: se esperaba un array");
      }

      if (process.env.NODE_ENV === "development") {
        console.log(`🔍 DEBUG: Respuesta de solicitud #${fetchId} (fuente: ${source})`, data);
      }

      if (!arePaymentsEqual(data as PendingPayment[], prevPaymentsRef.current)) {
        setPayments(data as PendingPayment[]);
        prevPaymentsRef.current = data as PendingPayment[];
      } else {
        if (process.env.NODE_ENV === "development") {
          console.log(`🔍 DEBUG: Omitiendo actualización de payments, datos idénticos (fuente: ${source})`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
      if (process.env.NODE_ENV === "development") {
        console.error(`🔍 DEBUG: Error en solicitud #${fetchId} (fuente: ${source})`, err);
      }
    } finally {
      if (showLoading) setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const handlePaymentAction = useCallback(
    async (paymentId: string, action: "validate" | "reject") => {
      try {
        setProcessingId(paymentId);
        setError("");

        const settingsResponse = await fetch("/api/company-settings");
        const companySettings = await settingsResponse.json();
        const currentPrecioHora = companySettings.tarifas.precioHora || 3.0;
        const currentTasaCambio = companySettings.tarifas.tasaCambio || 35.0;

        const timestamp = new Date().getTime();
        const response = await fetch(`/api/admin/${action}-payment?t=${timestamp}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          body: JSON.stringify({ paymentId, currentPrecioHora, currentTasaCambio }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Error al ${action === "validate" ? "validar" : "rechazar"} el pago`
          );
        }

        await fetchPendingPayments(false, `${action}-payment`);
        onStatsUpdate();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al procesar la acción");
      } finally {
        setProcessingId(null);
      }
    },
    [fetchPendingPayments, onStatsUpdate]
  );

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 DEBUG: Configurando useEffect inicial");
    }
    fetchPendingPayments(true, "initial-mount");

    if (intervalIdRef.current) {
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 DEBUG: Limpiando intervalo previo antes de crear uno nuevo");
      }
      clearInterval(intervalIdRef.current);
    }

    intervalIdRef.current = setInterval(() => {
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 DEBUG: Ejecutando fetch desde intervalo");
      }
      fetchPendingPayments(false, "interval");
    }, 10000);

    return () => {
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 DEBUG: Limpiando intervalo en desmontaje");
      }
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [fetchPendingPayments]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pagos Pendientes de Validación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pagos Pendientes de Validación</CardTitle>
        <Button onClick={() => fetchPendingPayments(true, "manual-refresh")} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
            <p className="font-bold">🔧 DEBUG INFO:</p>
            <p>Total payments: {sortedPayments.length}</p>
            <p>
              With tiempoSalida: {sortedPayments.filter((p) => p.tiempoSalida).length} | Without:{" "}
              {sortedPayments.filter((p) => !p.tiempoSalida).length}
            </p>
          </div>
        )}

        {sortedPayments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-medium">No hay pagos pendientes</p>
            <p className="text-sm">Todos los pagos han sido procesados</p>
            {process.env.NODE_ENV === "development" && <p>🔍 DEBUG: Renderizando vista de lista vacía</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedPayments.map((payment) => (
              <PendingPaymentCard
                key={payment._id}
                payment={payment}
                onValidate={() => handlePaymentAction(payment._id, "validate")}
                onReject={() => handlePaymentAction(payment._id, "reject")}
                isProcessing={processingId === payment._id}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(PendingPayments);