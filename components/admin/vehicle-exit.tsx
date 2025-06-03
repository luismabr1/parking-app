"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { LogOut, Car, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDateTime } from "@/lib/utils"

interface PaidTicket {
  _id: string
  codigoTicket: string
  estado: string
  horaOcupacion?: string
  montoCalculado: number
  carInfo?: {
    placa: string
    marca: string
    modelo: string
    color: string
    nombreDueño: string
    telefono: string
  }
}

export default function VehicleExit() {
  const [paidTickets, setPaidTickets] = useState<PaidTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchPaidTickets()

    // Actualizar automáticamente cada 30 segundos
    const interval = setInterval(() => {
      fetchPaidTickets()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchPaidTickets = async () => {
    try {
      setIsLoading(true)
      // Agregar timestamp para evitar cache
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
        setPaidTickets(data)
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

      // Agregar timestamp para evitar cache
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
        // IMPORTANTE: Refrescar la lista inmediatamente después del éxito
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
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay vehículos pagados pendientes de salida</p>
              {searchTerm && <p className="text-sm">No se encontraron resultados para &quot;{searchTerm}&quot;</p>}
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div key={ticket._id} className="border rounded-lg p-4 space-y-3">
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

                {ticket.carInfo && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Car className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium text-green-800">Vehículo a Retirar</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Placa:</span>
                        <span className="font-medium ml-2">{ticket.carInfo.placa}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Vehículo:</span>
                        <span className="font-medium ml-2">
                          {ticket.carInfo.marca} {ticket.carInfo.modelo}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Color:</span>
                        <span className="font-medium ml-2">{ticket.carInfo.color}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Propietario:</span>
                        <span className="font-medium ml-2">{ticket.carInfo.nombreDueño}</span>
                      </div>
                    </div>
                  </div>
                )}

                {ticket.horaOcupacion && (
                  <div className="text-sm text-gray-500">
                    <p>Ingreso: {formatDateTime(ticket.horaOcupacion)}</p>
                  </div>
                )}

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
