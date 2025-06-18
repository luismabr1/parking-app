"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { LogOut, Car, RefreshCw, ImageIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDateTime } from "@/lib/utils"
import { ExitTimeDisplay } from "./exit-time-display"

interface PaidTicket {
  _id: string
  codigoTicket: string
  estado: string
  horaOcupacion?: string
  montoCalculado: number
  tiempoSalida?: string
  tiempoSalidaEstimado?: string
  fechaPago?: string
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

export default function VehicleExit() {
  const [paidTickets, setPaidTickets] = useState<PaidTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  // DEBUG: Log de todos los tickets
  console.log("🔍 DEBUG VehicleExit - All tickets:", paidTickets)

  useEffect(() => {
    fetchPaidTickets()

    // Actualizar cada 10 segundos para tiempo real
    const interval = setInterval(() => {
      fetchPaidTickets()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const fetchPaidTickets = async () => {
    try {
      setIsLoading(true)
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/paid-tickets?t=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
      if (response.ok) {
        const data = await response.json()
        console.log("🔍 DEBUG: Raw paid tickets API response:", data)

        // Ordenar por urgencia de salida
        const sortedData = data.sort((a: PaidTicket, b: PaidTicket) => {
          if (!a.tiempoSalida && !b.tiempoSalida) return 0
          if (!a.tiempoSalida) return 1
          if (!b.tiempoSalida) return -1

          // Calcular urgencia para ordenar
          const getUrgencyScore = (ticket: PaidTicket) => {
            if (!ticket.fechaPago || !ticket.tiempoSalida) return 0

            const paymentTime = new Date(ticket.fechaPago)
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
              }[ticket.tiempoSalida] || 0

            const targetTime = new Date(paymentTime.getTime() + minutesToAdd * 60000)
            const timeRemaining = Math.ceil((targetTime.getTime() - currentTime.getTime()) / 60000)

            if (timeRemaining <= 0) return 4 // Crítico
            if (timeRemaining <= 2) return 3 // Urgente
            if (timeRemaining <= 5) return 2 // Warning
            return 1 // Normal
          }

          return getUrgencyScore(b) - getUrgencyScore(a)
        })

        setPaidTickets(sortedData)
      }
    } catch (error) {
      console.error("Error fetching paid tickets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVehicleExit = async (ticketCode: string) => {
    try {
      setIsProcessing(ticketCode)
      setMessage("")

      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/vehicle-exit?t=${timestamp}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify({ ticketCode }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ ${data.message}`)
        await fetchPaidTickets()
      } else {
        setMessage(`❌ ${data.message}`)
      }

      setTimeout(() => setMessage(""), 5000)
    } catch (error) {
      setMessage("❌ Error al procesar la salida del vehículo")
      setTimeout(() => setMessage(""), 5000)
    } finally {
      setIsProcessing(null)
    }
  }

  // Función para formatear datos con fallback
  const formatDataWithFallback = (value: string | undefined) => {
    if (!value || value === "Por definir" || value === "PENDIENTE") {
      return "Dato no proporcionado"
    }
    return value
  }

  const filteredTickets = paidTickets.filter(
    (ticket) =>
      ticket.codigoTicket.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.carInfo?.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.carInfo?.nombreDueño.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Salida de Vehículos</CardTitle>
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
        <CardTitle>Salida de Vehículos - Liberar Espacios</CardTitle>
        <Button onClick={fetchPaidTickets} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert variant={message.includes("❌") ? "destructive" : "default"}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* DEBUG INFO - Solo en desarrollo */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
            <p className="font-bold">🔧 DEBUG INFO:</p>
            <p>Total tickets: {paidTickets.length}</p>
            <p>
              With tiempoSalida: {paidTickets.filter((t) => t.tiempoSalida).length} | Without:{" "}
              {paidTickets.filter((t) => !t.tiempoSalida).length}
            </p>
          </div>
        )}

        {/* Búsqueda */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="search">Buscar por ticket, placa o propietario</Label>
            <Input
              id="search"
              placeholder="Ej. PARK001, ABC123, Juan Pérez..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>
            <strong>Vehículos pagados listos para salir:</strong> {filteredTickets.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Al procesar la salida, el espacio de estacionamiento quedará disponible para nuevos vehículos.
          </p>
        </div>

        {/* Lista de Tickets Pagados */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay vehículos pagados pendientes de salida</p>
              {searchTerm && <p className="text-sm">No se encontraron resultados para &quot;{searchTerm}&quot;</p>}
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div key={ticket._id} className="border rounded-lg p-4 space-y-4">
                {/* Header con código y monto */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-lg">Espacio: {ticket.codigoTicket}</h3>
                    <Badge>Pagado</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Monto Pagado</p>
                    <p className="font-medium">${ticket.montoCalculado.toFixed(2)}</p>
                  </div>
                </div>

                {/* Tiempo de salida programado */}
                {ticket.fechaPago && (
                  <ExitTimeDisplay
                    tiempoSalida={ticket.tiempoSalida}
                    tiempoSalidaEstimado={ticket.tiempoSalidaEstimado}
                    fechaPago={ticket.fechaPago}
                    codigoTicket={ticket.codigoTicket}
                    variant="compact"
                  />
                )}

                {/* Información del vehículo con imágenes */}
                {ticket.carInfo && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Car className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium text-green-800">Vehículo a Retirar</h4>
                    </div>

                    {/* Layout con imágenes y datos */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Columna 1: Imágenes */}
                      {(ticket.carInfo.imagenes?.plateImageUrl || ticket.carInfo.imagenes?.vehicleImageUrl) && (
                        <div className="space-y-3">
                          <h5 className="text-sm font-medium text-gray-700 flex items-center">
                            <ImageIcon className="h-4 w-4 mr-1" />
                            Imágenes de Referencia
                          </h5>

                          <div className="space-y-2">
                            {/* Imagen de la placa */}
                            {ticket.carInfo.imagenes?.plateImageUrl && (
                              <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Placa</p>
                                <img
                                  src={ticket.carInfo.imagenes.plateImageUrl || "/placeholder.svg"}
                                  alt="Placa del vehículo"
                                  className="w-full max-w-32 h-16 object-cover rounded border mx-auto"
                                  onError={(e) => {
                                    console.error("Error loading plate image:", ticket.carInfo.imagenes?.plateImageUrl)
                                    e.currentTarget.style.display = "none"
                                  }}
                                />
                              </div>
                            )}

                            {/* Imagen del vehículo */}
                            {ticket.carInfo.imagenes?.vehicleImageUrl && (
                              <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Vehículo</p>
                                <img
                                  src={ticket.carInfo.imagenes.vehicleImageUrl || "/placeholder.svg"}
                                  alt="Vehículo"
                                  className="w-full max-w-40 h-24 object-cover rounded border mx-auto"
                                  onError={(e) => {
                                    console.error(
                                      "Error loading vehicle image:",
                                      ticket.carInfo.imagenes?.vehicleImageUrl,
                                    )
                                    e.currentTarget.style.display = "none"
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Metadatos de captura */}
                          {ticket.carInfo.imagenes?.fechaCaptura && (
                            <div className="text-xs text-gray-500 text-center">
                              <p>Capturado: {formatDateTime(ticket.carInfo.imagenes.fechaCaptura)}</p>
                              {ticket.carInfo.imagenes.capturaMetodo && (
                                <p className="capitalize">
                                  Método: {ticket.carInfo.imagenes.capturaMetodo.replace("_", " ")}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Columna 2 y 3: Datos del vehículo */}
                      <div
                        className={`${ticket.carInfo.imagenes?.plateImageUrl || ticket.carInfo.imagenes?.vehicleImageUrl ? "lg:col-span-2" : "lg:col-span-3"} grid grid-cols-1 md:grid-cols-2 gap-3`}
                      >
                        <div className="space-y-2">
                          <div>
                            <span className="text-gray-600 text-sm">Placa:</span>
                            <span className="font-medium ml-2 text-lg">
                              {formatDataWithFallback(ticket.carInfo.placa)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 text-sm">Vehículo:</span>
                            <span className="font-medium ml-2">
                              {formatDataWithFallback(ticket.carInfo.marca)}{" "}
                              {formatDataWithFallback(ticket.carInfo.modelo)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 text-sm">Color:</span>
                            <span className="font-medium ml-2">{formatDataWithFallback(ticket.carInfo.color)}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <span className="text-gray-600 text-sm">Propietario:</span>
                            <span className="font-medium ml-2">
                              {formatDataWithFallback(ticket.carInfo.nombreDueño)}
                            </span>
                          </div>
                          {ticket.carInfo.telefono &&
                            ticket.carInfo.telefono !== "Por definir" &&
                            ticket.carInfo.telefono !== "Dato no proporcionado" && (
                              <div>
                                <span className="text-gray-600 text-sm">Teléfono:</span>
                                <span className="font-medium ml-2">{ticket.carInfo.telefono}</span>
                              </div>
                            )}
                          {(ticket.carInfo.horaIngreso || ticket.carInfo.fechaRegistro || ticket.horaOcupacion) && (
                            <div>
                              <span className="text-gray-600 text-sm">Ingreso:</span>
                              <span className="font-medium ml-2 text-sm">
                                {formatDateTime(
                                  ticket.carInfo.fechaRegistro || ticket.carInfo.horaIngreso || ticket.horaOcupacion,
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón de salida */}
                <Button
                  onClick={() => handleVehicleExit(ticket.codigoTicket)}
                  disabled={isProcessing === ticket.codigoTicket}
                  className="w-full"
                  variant="default"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isProcessing === ticket.codigoTicket ? "Procesando Salida..." : "Procesar Salida y Liberar Espacio"}
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
