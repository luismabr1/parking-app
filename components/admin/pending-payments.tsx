"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, RefreshCw, Car, ImageIcon } from "lucide-react"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExitTimeDisplay } from "./exit-time-display"

interface PendingPayment {
  _id: string
  codigoTicket: string
  referenciaTransferencia: string
  banco: string
  telefono: string
  numeroIdentidad: string
  montoPagado: number
  montoCalculado: number
  fechaPago: string
  estado: string
  tiempoSalida?: string
  tiempoSalidaEstimado?: string
  carInfo?: {
    placa: string
    marca: string
    modelo: string
    color: string
    nombreDueño: string
    telefono: string
    horaIngreso?: string
    fechaRegistro?: string
    imagenes?: {
      plateImageUrl?: string
      vehicleImageUrl?: string
      fechaCaptura?: string
      capturaMetodo?: string
    }
  }
}

interface PendingPaymentsProps {
  onStatsUpdate: () => void
}

export default function PendingPayments({ onStatsUpdate }: PendingPaymentsProps) {
  const [payments, setPayments] = useState<PendingPayment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  // DEBUG: Log de todos los pagos
  console.log("🔍 DEBUG PendingPayments - All payments:", payments)

  useEffect(() => {
    fetchPendingPayments()

    // Configurar un intervalo para actualizar los pagos pendientes cada 10 segundos
    const intervalId = setInterval(() => {
      fetchPendingPayments(false)
    }, 10000)

    return () => clearInterval(intervalId)
  }, [])

  const fetchPendingPayments = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }

      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/pending-payments?t=${timestamp}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        next: { revalidate: 0 },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("🔍 DEBUG: Raw API response:", data)

        // Ordenar por urgencia: críticos primero, luego urgentes, etc.
        const sortedData = data.sort((a: PendingPayment, b: PendingPayment) => {
          if (!a.tiempoSalida && !b.tiempoSalida) return 0
          if (!a.tiempoSalida) return 1
          if (!b.tiempoSalida) return -1

          // Calcular urgencia para ordenar
          const getUrgencyScore = (payment: PendingPayment) => {
            const paymentTime = new Date(payment.fechaPago)
            const currentTime = new Date()
            const minutesToAdd =
              {
                now: 0,
                "5min": 5,
                "10min": 10,
                "15min": 15,
                "20min": 20,
                "30min": 30,
                "45min": 45,
                "60min": 60,
              }[payment.tiempoSalida || "now"] || 0

            const targetTime = new Date(paymentTime.getTime() + minutesToAdd * 60000)
            const timeRemaining = Math.ceil((targetTime.getTime() - currentTime.getTime()) / 60000)

            if (timeRemaining <= 0) return 4 // Crítico
            if (timeRemaining <= 2) return 3 // Urgente
            if (timeRemaining <= 5) return 2 // Warning
            return 1 // Normal
          }

          return getUrgencyScore(b) - getUrgencyScore(a)
        })

        setPayments(sortedData)
      } else {
        throw new Error("Error al cargar pagos pendientes")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos")
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  const handlePaymentAction = async (paymentId: string, action: "validate" | "reject") => {
    try {
      setProcessingId(paymentId)
      setError("")

      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/${action}-payment?t=${timestamp}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify({ paymentId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error al ${action === "validate" ? "validar" : "rechazar"} el pago`)
      }

      await fetchPendingPayments()
      onStatsUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar la acción")
    } finally {
      setProcessingId(null)
    }
  }

  // Función para formatear datos con fallback
  const formatDataWithFallback = (value: string | undefined) => {
    if (!value || value === "Por definir" || value === "PENDIENTE") {
      return "Dato no proporcionado"
    }
    return value
  }

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
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pagos Pendientes de Validación</CardTitle>
        <Button onClick={() => fetchPendingPayments(true)} variant="outline" size="sm">
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

        {/* DEBUG INFO - Solo en desarrollo */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
            <p className="font-bold">🔧 DEBUG INFO:</p>
            <p>Total payments: {payments.length}</p>
            <p>
              With tiempoSalida: {payments.filter((p) => p.tiempoSalida).length} | Without:{" "}
              {payments.filter((p) => !p.tiempoSalida).length}
            </p>
          </div>
        )}

        {payments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-medium">No hay pagos pendientes</p>
            <p className="text-sm">Todos los pagos han sido procesados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment._id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-lg">Ticket: {payment.codigoTicket}</h3>
                    <Badge variant="outline">Pendiente</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Fecha de Pago</p>
                    <p className="font-medium">{formatDateTime(payment.fechaPago)}</p>
                  </div>
                </div>

                {/* Tiempo de salida programado - COMPONENTE REUTILIZABLE */}
                <ExitTimeDisplay
                  tiempoSalida={payment.tiempoSalida}
                  tiempoSalidaEstimado={payment.tiempoSalidaEstimado}
                  fechaPago={payment.fechaPago}
                  codigoTicket={payment.codigoTicket}
                  variant="full"
                />

                {/* Información del Vehículo con imágenes de referencia */}
                {payment.carInfo && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Car className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium text-blue-800">Vehículo a Retirar</h4>
                    </div>

                    {/* Layout con imágenes y datos */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Columna 1: Imágenes de referencia */}
                      {(payment.carInfo.imagenes?.plateImageUrl || payment.carInfo.imagenes?.vehicleImageUrl) && (
                        <div className="space-y-3">
                          <h5 className="text-sm font-medium text-gray-700 flex items-center">
                            <ImageIcon className="h-4 w-4 mr-1" />
                            Imágenes de Referencia
                          </h5>

                          <div className="space-y-2">
                            {/* Imagen de la placa */}
                            {payment.carInfo.imagenes?.plateImageUrl && (
                              <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Placa</p>
                                <img
                                  src={payment.carInfo.imagenes.plateImageUrl || "/placeholder.svg"}
                                  alt="Placa del vehículo"
                                  className="w-full max-w-32 h-16 object-cover rounded border mx-auto"
                                  onError={(e) => {
                                    console.error("Error loading plate image:", payment.carInfo.imagenes?.plateImageUrl)
                                    e.currentTarget.style.display = "none"
                                  }}
                                />
                              </div>
                            )}

                            {/* Imagen del vehículo */}
                            {payment.carInfo.imagenes?.vehicleImageUrl && (
                              <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Vehículo</p>
                                <img
                                  src={payment.carInfo.imagenes.vehicleImageUrl || "/placeholder.svg"}
                                  alt="Vehículo"
                                  className="w-full max-w-40 h-24 object-cover rounded border mx-auto"
                                  onError={(e) => {
                                    console.error(
                                      "Error loading vehicle image:",
                                      payment.carInfo.imagenes?.vehicleImageUrl,
                                    )
                                    e.currentTarget.style.display = "none"
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Metadatos de captura */}
                          {payment.carInfo.imagenes?.fechaCaptura && (
                            <div className="text-xs text-gray-500 text-center">
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

                      {/* Columna 2 y 3: Datos del vehículo */}
                      <div
                        className={`${payment.carInfo.imagenes?.plateImageUrl || payment.carInfo.imagenes?.vehicleImageUrl ? "lg:col-span-2" : "lg:col-span-3"} grid grid-cols-1 md:grid-cols-2 gap-3`}
                      >
                        <div className="space-y-2">
                          <div>
                            <span className="text-gray-600 text-sm">Placa:</span>
                            <span className="font-medium ml-2 text-lg">
                              {formatDataWithFallback(payment.carInfo.placa)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 text-sm">Vehículo:</span>
                            <span className="font-medium ml-2">
                              {formatDataWithFallback(payment.carInfo.marca)}{" "}
                              {formatDataWithFallback(payment.carInfo.modelo)}
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
                            <span className="font-medium ml-2">
                              {formatDataWithFallback(payment.carInfo.nombreDueño)}
                            </span>
                          </div>
                          {payment.carInfo.telefono &&
                            payment.carInfo.telefono !== "Por definir" &&
                            payment.carInfo.telefono !== "Dato no proporcionado" && (
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
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Monto Calculado</p>
                    <p className="font-semibold text-lg">{formatCurrency(payment.montoCalculado)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Monto Pagado</p>
                    <p className="font-semibold text-lg">{formatCurrency(payment.montoPagado)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Diferencia</p>
                    <p
                      className={`font-semibold text-lg ${
                        payment.montoPagado >= payment.montoCalculado ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(payment.montoPagado - payment.montoCalculado)}
                    </p>
                  </div>
                </div>

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
                    onClick={() => handlePaymentAction(payment._id, "validate")}
                    disabled={processingId === payment._id}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {processingId === payment._id ? "Validando..." : "Validar Pago"}
                  </Button>
                  <Button
                    onClick={() => handlePaymentAction(payment._id, "reject")}
                    disabled={processingId === payment._id}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {processingId === payment._id ? "Rechazando..." : "Rechazar Pago"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
