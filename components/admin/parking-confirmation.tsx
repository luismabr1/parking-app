"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Car, RefreshCw, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDateTime } from "@/lib/utils"

interface PendingParking {
  _id: string
  codigoTicket: string
  estado: string
  horaOcupacion?: string
  carInfo?: {
    placa: string
    marca: string
    modelo: string
    color: string
    nombreDueño: string
    telefono: string
    horaIngreso: string
  }
}

export default function ParkingConfirmation() {
  const [pendingParkings, setPendingParkings] = useState<PendingParking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchPendingParkings()

    // Actualizar automáticamente cada 15 segundos (más frecuente)
    const interval = setInterval(() => {
      fetchPendingParkings()
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  const fetchPendingParkings = async () => {
    try {
      setIsLoading(true)
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/pending-parkings?t=${timestamp}&_=${Math.random()}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "If-Modified-Since": "0",
          "If-None-Match": "no-match-for-this",
        },
      })
      if (response.ok) {
        const data = await response.json()
        setPendingParkings(data)
      }
    } catch (error) {
      console.error("Error fetching pending parkings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const confirmParking = async (ticketCode: string) => {
    try {
      setConfirmingId(ticketCode)
      setMessage("")

      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/confirm-parking?t=${timestamp}&_=${Math.random()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "If-Modified-Since": "0",
          "If-None-Match": "no-match-for-this",
        },
        body: JSON.stringify({ ticketCode }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ ${data.message}`)
        await fetchPendingParkings()
      } else {
        setMessage(`❌ ${data.message}`)
      }

      setTimeout(() => setMessage(""), 5000)
    } catch (error) {
      setMessage("❌ Error al confirmar el estacionamiento")
      setTimeout(() => setMessage(""), 5000)
    } finally {
      setConfirmingId(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Confirmación de Estacionamiento</CardTitle>
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
        <div>
          <CardTitle>Confirmación de Estacionamiento</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Confirme que los vehículos están correctamente estacionados para habilitar el cobro
          </p>
        </div>
        <Button onClick={fetchPendingParkings} variant="outline" size="sm">
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

        <div className="text-sm text-gray-600">
          <p>
            <strong>Vehículos pendientes de confirmación:</strong> {pendingParkings.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Una vez confirmado, el cliente podrá buscar su ticket y realizar el pago.
          </p>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {pendingParkings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
              <p>No hay vehículos pendientes de confirmación</p>
              <p className="text-sm">Todos los estacionamientos han sido confirmados</p>
            </div>
          ) : (
            pendingParkings.map((parking) => (
              <div key={parking._id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-lg">Espacio: {parking.codigoTicket}</h3>
                    <Badge variant="outline">Pendiente Confirmación</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Registrado</p>
                    <p className="font-medium">
                      {parking.carInfo?.horaIngreso ? formatDateTime(parking.carInfo.horaIngreso) : "Sin fecha"}
                    </p>
                  </div>
                </div>

                {parking.carInfo && (
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Car className="h-4 w-4 text-orange-600" />
                      <h4 className="font-medium text-orange-800">Vehículo a Confirmar</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Placa:</span>
                        <span className="font-medium ml-2">{parking.carInfo.placa}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Vehículo:</span>
                        <span className="font-medium ml-2">
                          {parking.carInfo.marca} {parking.carInfo.modelo}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Color:</span>
                        <span className="font-medium ml-2">{parking.carInfo.color}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Propietario:</span>
                        <span className="font-medium ml-2">{parking.carInfo.nombreDueño}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      ⚠️ El cliente NO puede pagar hasta que confirme el estacionamiento
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => confirmParking(parking.codigoTicket)}
                  disabled={confirmingId === parking.codigoTicket}
                  className="w-full"
                  variant="default"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {confirmingId === parking.codigoTicket
                    ? "Confirmando Estacionamiento..."
                    : "Confirmar que el Vehículo está Estacionado"}
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
