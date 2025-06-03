"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CarIcon, RefreshCw, Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDateTime } from "@/lib/utils"

interface AvailableTicket {
  _id: string
  codigoTicket: string
  estado: string
}

interface Car {
  _id: string
  placa: string
  marca: string
  modelo: string
  color: string
  nombreDueño: string
  telefono: string
  ticketAsociado: string
  horaIngreso: string
  estado: string
}

interface CarFormData {
  placa: string
  marca: string
  modelo: string
  color: string
  nombreDueño: string
  telefono: string
  ticketAsociado: string
}

export default function CarRegistration() {
  const [cars, setCars] = useState<Car[]>([])
  const [availableTickets, setAvailableTickets] = useState<AvailableTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  const [formData, setFormData] = useState<CarFormData>({
    placa: "",
    marca: "",
    modelo: "",
    color: "",
    nombreDueño: "",
    telefono: "",
    ticketAsociado: "",
  })

  useEffect(() => {
    Promise.all([fetchCars(), fetchAvailableTickets()])
      .then(() => setIsLoading(false))
      .catch(() => setIsLoading(false))
  }, [])

  const fetchCars = async () => {
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/cars?t=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
      if (response.ok) {
        const data = await response.json()
        setCars(data)
      }
    } catch (error) {
      console.error("Error fetching cars:", error)
    }
  }

  const fetchAvailableTickets = async () => {
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/available-tickets?t=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
      if (response.ok) {
        const data = await response.json()
        setAvailableTickets(data)
      }
    } catch (error) {
      console.error("Error fetching available tickets:", error)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      fetchCars()
      fetchAvailableTickets()
    }, 30000) // Actualizar cada 30 segundos

    return () => clearInterval(interval)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTicketChange = (value: string) => {
    setFormData((prev) => ({ ...prev, ticketAsociado: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage("")

    try {
      const response = await fetch("/api/admin/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ ${data.message}`)
        setFormData({
          placa: "",
          marca: "",
          modelo: "",
          color: "",
          nombreDueño: "",
          telefono: "",
          ticketAsociado: "",
        })
        await Promise.all([fetchCars(), fetchAvailableTickets()])
      } else {
        setMessage(`❌ ${data.message}`)
      }

      setTimeout(() => setMessage(""), 5000)
    } catch (error) {
      setMessage("❌ Error al registrar el carro")
      setTimeout(() => setMessage(""), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return Object.values(formData).every((value) => value.trim() !== "")
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registro de Carros</CardTitle>
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
      {/* Formulario de Registro */}
      <Card>
        <CardHeader>
          <CardTitle>Registrar Nuevo Carro</CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert variant={message.includes("❌") ? "destructive" : "default"} className="mb-4">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {availableTickets.length === 0 ? (
            <Alert variant="destructive">
              <AlertDescription>
                No hay tickets disponibles. Debe crear tickets primero en la pestaña &quot;Gestión de Tickets&quot;.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="placa">Placa del Vehículo</Label>
                  <Input
                    id="placa"
                    name="placa"
                    value={formData.placa}
                    onChange={handleInputChange}
                    placeholder="Ej. ABC123"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Input
                    id="marca"
                    name="marca"
                    value={formData.marca}
                    onChange={handleInputChange}
                    placeholder="Ej. Toyota"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleInputChange}
                    placeholder="Ej. Corolla"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    placeholder="Ej. Blanco"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombreDueño">Nombre del Dueño</Label>
                  <Input
                    id="nombreDueño"
                    name="nombreDueño"
                    value={formData.nombreDueño}
                    onChange={handleInputChange}
                    placeholder="Ej. Juan Pérez"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="Ej. 0414-1234567"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticketAsociado">Ticket de Estacionamiento</Label>
                <Select value={formData.ticketAsociado} onValueChange={handleTicketChange}>
                  <SelectTrigger id="ticketAsociado">
                    <SelectValue placeholder="Seleccione un ticket disponible" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTickets.map((ticket) => (
                      <SelectItem key={ticket._id} value={ticket.codigoTicket}>
                        {ticket.codigoTicket}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">Tickets disponibles: {availableTickets.length}</p>
              </div>

              <Button type="submit" className="w-full" disabled={!isFormValid() || isSubmitting}>
                <Plus className="h-4 w-4 mr-2" />
                {isSubmitting ? "Registrando..." : "Registrar Carro"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Lista de Carros Estacionados */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Carros Estacionados Actualmente</CardTitle>
          <Button onClick={fetchCars} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {cars.filter((car) => car.estado === "estacionado").length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay carros estacionados actualmente</p>
              </div>
            ) : (
              cars
                .filter((car) => car.estado === "estacionado")
                .map((car) => (
                  <div
                    key={car._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium text-lg">{car.placa}</p>
                          <p className="text-sm text-gray-600">
                            {car.marca} {car.modelo} - {car.color}
                          </p>
                          <p className="text-sm text-gray-600">
                            Dueño: {car.nombreDueño} | Tel: {car.telefono}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-medium">Ticket: {car.ticketAsociado}</p>
                      <p className="text-sm text-gray-500">
                        Ingreso: {car.horaIngreso ? formatDateTime(car.horaIngreso) : "Sin fecha"}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
