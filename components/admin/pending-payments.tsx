"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, RefreshCw, Car } from "lucide-react"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  carInfo?: {
    placa: string
    marca: string
    modelo: string
    color: string
    nombreDueño: string
    telefono: string
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

  useEffect(() => {
    fetchPendingPayments()

    // Configurar un intervalo para actualizar los pagos pendientes cada 30 segundos
    const intervalId = setInterval(() => {
      fetchPendingPayments(false) // false para no mostrar el indicador de carga
    }, 30000)

    return () => clearInterval(intervalId)
  }, [])

  const fetchPendingPayments = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }

      // Agregar un timestamp para evitar el caché
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/pending-payments?t=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPayments(data)
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

                {/* Información del Vehículo si existe */}
                {payment.carInfo && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Car className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium text-blue-800">Información del Vehículo</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Placa:</span>
                        <span className="font-medium ml-2">{payment.carInfo.placa}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Vehículo:</span>
                        <span className="font-medium ml-2">
                          {payment.carInfo.marca} {payment.carInfo.modelo}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Color:</span>
                        <span className="font-medium ml-2">{payment.carInfo.color}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Propietario:</span>
                        <span className="font-medium ml-2">{payment.carInfo.nombreDueño}</span>
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
