"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Car,
  User,
  Phone,
  Building2,
  Hash,
  ImageIcon,
  ExternalLink,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import ExitTimeDisplay from "./exit-time-display"

interface PaymentInfo {
  _id: string
  codigoTicket: string
  referenciaTransferencia: string
  banco: string
  telefono: string
  numeroIdentidad: string
  montoPagado: number
  fechaPago: string
  estado: string
  estadoValidacion: string
  tipoPago: string
  urlImagenComprobante?: string
  carInfo: {
    placa: string
    marca: string
    modelo: string
    color: string
    nombreDueño: string
    telefono: string
    imagenes?: string[]
  }
  tiempoSalida?: string
  tiempoSalidaEstimado?: string
  montoCalculado?: number
}

interface CompanySettings {
  nombreEmpresa?: string
  moneda?: string
  tasaCambio?: number
  tarifaPorHora?: number
}

interface PendingPaymentsProps {
  onStatsUpdate: () => void
}

const PendingPaymentCard: React.FC<{
  payment: PaymentInfo
  onValidate: (id: string) => void
  onReject: (id: string) => void
  formatCurrency: (amount: number) => string
  isProcessing: boolean
}> = React.memo(({ payment, onValidate, onReject, formatCurrency, isProcessing }) => {
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  const getPaymentTypeColor = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case "transferencia":
        return "bg-blue-100 text-blue-800"
      case "pago_movil":
        return "bg-green-100 text-green-800"
      case "efectivo":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatPaymentType = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case "transferencia":
        return "Transferencia"
      case "pago_movil":
        return "Pago Móvil"
      case "efectivo":
        return "Efectivo"
      default:
        return tipo || "No especificado"
    }
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Ticket: {payment.codigoTicket}
            </CardTitle>
            <Badge className={getPaymentTypeColor(payment.tipoPago)} variant="secondary">
              {formatPaymentType(payment.tipoPago)}
            </Badge>
          </div>

          {/* Exit Time Display - Prominente después del tipo de pago */}
          {(payment.tiempoSalida || payment.tiempoSalidaEstimado) && (
            <div className="mt-2">
              <ExitTimeDisplay
                tiempoSalida={payment.tiempoSalida}
                tiempoSalidaEstimado={payment.tiempoSalidaEstimado}
                fechaPago={payment.fechaPago}
                codigoTicket={payment.codigoTicket}
                variant="compact"
              />
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Car Information */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Car className="h-4 w-4 text-gray-600" />
              <span className="font-semibold text-gray-900">{payment.carInfo?.placa || "Placa no disponible"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <span>
                {payment.carInfo?.marca || "N/A"} {payment.carInfo?.modelo || ""}
              </span>
              <span>{payment.carInfo?.color || "N/A"}</span>
            </div>
            {payment.carInfo?.nombreDueño && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                <User className="h-3 w-3" />
                <span>{payment.carInfo.nombreDueño}</span>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Monto Pagado:</span>
              <span className="font-bold text-green-600">{formatCurrency(payment.montoPagado)}</span>
            </div>

            {payment.montoCalculado && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Monto Calculado:</span>
                <span className="font-bold">{formatCurrency(payment.montoCalculado)}</span>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-1 gap-2 text-sm">
              {payment.referenciaTransferencia && (
                <div className="flex items-center gap-2">
                  <Hash className="h-3 w-3" />
                  <span className="text-gray-600">Ref:</span>
                  <span className="font-mono">{payment.referenciaTransferencia}</span>
                </div>
              )}

              {payment.banco && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-3 w-3" />
                  <span className="text-gray-600">Banco:</span>
                  <span>{payment.banco}</span>
                </div>
              )}

              {payment.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span className="text-gray-600">Teléfono:</span>
                  <span>{payment.telefono}</span>
                </div>
              )}

              {payment.numeroIdentidad && (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span className="text-gray-600">Cédula:</span>
                  <span>{payment.numeroIdentidad}</span>
                </div>
              )}

              {/* Comprobante de Pago */}
              {payment.urlImagenComprobante && (
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-3 w-3" />
                  <span className="text-gray-600">Comprobante:</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-blue-600 hover:text-blue-800"
                    onClick={() => setShowReceiptModal(true)}
                  >
                    Ver comprobante
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Pago realizado: {new Date(payment.fechaPago).toLocaleString("es-ES")}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onValidate(payment._id)}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Validar Pago
            </Button>
            <Button
              onClick={() => onReject(payment._id)}
              disabled={isProcessing}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal para mostrar el comprobante */}
      {showReceiptModal && payment.urlImagenComprobante && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Comprobante de Pago - {payment.codigoTicket}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowReceiptModal(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <img
                src={payment.urlImagenComprobante || "/placeholder.svg"}
                alt={`Comprobante de pago ${payment.codigoTicket}`}
                className="w-full h-auto rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=400&width=300&text=Error+cargando+imagen"
                }}
              />
              <div className="mt-4 text-sm text-gray-600">
                <p>
                  <strong>Referencia:</strong> {payment.referenciaTransferencia}
                </p>
                <p>
                  <strong>Banco:</strong> {payment.banco}
                </p>
                <p>
                  <strong>Monto:</strong> {formatCurrency(payment.montoPagado)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
})

PendingPaymentCard.displayName = "PendingPaymentCard"

const PendingPayments: React.FC<PendingPaymentsProps> = ({ onStatsUpdate }) => {
  const [payments, setPayments] = useState<PaymentInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingPayments, setProcessingPayments] = useState<Set<string>>(new Set())
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    nombreEmpresa: "Estacionamiento",
    moneda: "VES",
    tasaCambio: 36.0,
    tarifaPorHora: 2.0,
  })
  const isFetchingRef = useRef(false)

  // Fetch company settings
  const fetchCompanySettings = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/company-settings")
      if (response.ok) {
        const settings = await response.json()
        setCompanySettings({
          nombreEmpresa: settings.nombreEmpresa || "Estacionamiento",
          moneda: settings.moneda || "VES",
          tasaCambio: settings.tasaCambio || 36.0,
          tarifaPorHora: settings.tarifaPorHora || 2.0,
        })
      }
    } catch (error) {
      console.error("Error fetching company settings:", error)
      // Keep default settings if fetch fails
    }
  }, [])

  const fetchPayments = useCallback(async () => {
    if (isFetchingRef.current) return

    isFetchingRef.current = true
    try {
      const response = await fetch(`/api/admin/pending-payments?t=${Date.now()}`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      }
    } catch (error) {
      console.error("Error fetching pending payments:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los pagos pendientes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }, [])

  const validatePayment = useCallback(
    async (paymentId: string) => {
      setProcessingPayments((prev) => new Set(prev).add(paymentId))

      try {
        const response = await fetch("/api/admin/validate-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentId,
            currentPrecioHora: companySettings.tarifaPorHora || 2.0,
            currentTasaCambio: companySettings.tasaCambio || 36.0,
          }),
        })

        if (response.ok) {
          toast({
            title: "Pago Validado",
            description: "El pago ha sido validado exitosamente",
          })
          await fetchPayments()
          onStatsUpdate()
        } else {
          const errorData = await response.json()
          throw new Error(errorData.message || "Error validating payment")
        }
      } catch (error) {
        console.error("Error validating payment:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "No se pudo validar el pago",
          variant: "destructive",
        })
      } finally {
        setProcessingPayments((prev) => {
          const newSet = new Set(prev)
          newSet.delete(paymentId)
          return newSet
        })
      }
    },
    [fetchPayments, onStatsUpdate, companySettings],
  )

  const rejectPayment = useCallback(
    async (paymentId: string) => {
      setProcessingPayments((prev) => new Set(prev).add(paymentId))

      try {
        const response = await fetch("/api/admin/reject-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        })

        if (response.ok) {
          toast({
            title: "Pago Rechazado",
            description: "El pago ha sido rechazado",
            variant: "destructive",
          })
          await fetchPayments()
          onStatsUpdate()
        } else {
          throw new Error("Error rejecting payment")
        }
      } catch (error) {
        console.error("Error rejecting payment:", error)
        toast({
          title: "Error",
          description: "No se pudo rechazar el pago",
          variant: "destructive",
        })
      } finally {
        setProcessingPayments((prev) => {
          const newSet = new Set(prev)
          newSet.delete(paymentId)
          return newSet
        })
      }
    },
    [fetchPayments, onStatsUpdate],
  )

  const formatCurrency = useCallback(
    (amount: number) => {
      if (!amount || isNaN(amount)) return "$0.00"

      // Usar configuración por defecto si no está disponible
      const moneda = companySettings?.moneda || "VES"
      const tasaCambio = companySettings?.tasaCambio || 36.0

      if (moneda === "USD") {
        return `$${amount.toFixed(2)} USD`
      }

      const usdAmount = amount / tasaCambio
      if (usdAmount >= 1) {
        return `$${usdAmount.toFixed(2)} USD`
      }
      return `${moneda} ${amount.toLocaleString()}`
    },
    [companySettings],
  )

  // Función para ordenar pagos por urgencia (tiempo de salida)
  const sortByUrgency = useCallback((a: PaymentInfo, b: PaymentInfo) => {
    const getUrgencyScore = (payment: PaymentInfo) => {
      if (!payment.tiempoSalida && !payment.tiempoSalidaEstimado) return 0

      const exitTime = new Date(payment.tiempoSalida || payment.tiempoSalidaEstimado || "")
      const now = new Date()
      const diffMinutes = (exitTime.getTime() - now.getTime()) / (1000 * 60)

      if (diffMinutes < 0) return 4 // Crítico - ya pasó el tiempo
      if (diffMinutes < 15) return 3 // Muy urgente
      if (diffMinutes < 30) return 2 // Urgente
      if (diffMinutes < 60) return 1 // Moderado
      return 0 // Normal
    }

    return getUrgencyScore(b) - getUrgencyScore(a)
  }, [])

  const sortedPayments = useMemo(() => {
    return [...payments].sort(sortByUrgency)
  }, [payments, sortByUrgency])

  useEffect(() => {
    fetchCompanySettings()
    fetchPayments()
    const interval = setInterval(fetchPayments, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [fetchCompanySettings, fetchPayments])

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pagos Pendientes de Validación
              </CardTitle>
              <CardDescription>
                {sortedPayments.length} pago{sortedPayments.length !== 1 ? "s" : ""} esperando validación
              </CardDescription>
            </div>
            <Button variant="outline" onClick={fetchPayments} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {sortedPayments.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Todo al día!</h3>
              <p className="text-gray-600">No hay pagos pendientes de validación en este momento.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedPayments.map((payment) => (
            <PendingPaymentCard
              key={payment._id}
              payment={payment}
              onValidate={validatePayment}
              onReject={rejectPayment}
              formatCurrency={formatCurrency}
              isProcessing={processingPayments.has(payment._id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

PendingPayments.displayName = "PendingPayments"

export default React.memo(PendingPayments)
