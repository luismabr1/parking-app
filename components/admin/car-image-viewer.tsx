"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Edit, Save, X, Camera, ImageIcon, Eye, EyeOff, Info } from "lucide-react"
import { formatDateTime } from "@/lib/utils"

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
  imagenes?: {
    placaUrl?: string
    vehiculoUrl?: string
    fechaCaptura?: string
    capturaMetodo?: "manual" | "camara_movil" | "camara_desktop"
    confianzaPlaca?: number
    confianzaVehiculo?: number
  }
}

interface CarImageViewerProps {
  car: Car
  onClose: () => void
  onUpdate: () => void
}

export default function CarImageViewer({ car, onClose, onUpdate }: CarImageViewerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [showDetails, setShowDetails] = useState(false)

  const [editData, setEditData] = useState({
    placa: car.placa,
    marca: car.marca,
    modelo: car.modelo,
    color: car.color,
    nombreDueño: car.nombreDueño,
    telefono: car.telefono,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch(`/api/admin/cars/${car._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("✅ Información actualizada correctamente")
        setIsEditing(false)
        onUpdate()
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(`❌ ${data.message || "Error al actualizar"}`)
        setTimeout(() => setMessage(""), 5000)
      }
    } catch (error) {
      setMessage("❌ Error de conexión")
      setTimeout(() => setMessage(""), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditData({
      placa: car.placa,
      marca: car.marca,
      modelo: car.modelo,
      color: car.color,
      nombreDueño: car.nombreDueño,
      telefono: car.telefono,
    })
    setIsEditing(false)
  }

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return "bg-gray-500"
    if (confidence >= 0.8) return "bg-green-500"
    if (confidence >= 0.6) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getConfidenceText = (confidence?: number) => {
    if (!confidence) return "Sin datos"
    const percentage = Math.round(confidence * 100)
    if (percentage >= 80) return `${percentage}% - Excelente`
    if (percentage >= 60) return `${percentage}% - Buena`
    return `${percentage}% - Baja`
  }

  const getMethodIcon = (method?: string) => {
    switch (method) {
      case "camara_movil":
        return "📱"
      case "camara_desktop":
        return "💻"
      case "manual":
        return "✋"
      default:
        return "❓"
    }
  }

  const getMethodText = (method?: string) => {
    switch (method) {
      case "camara_movil":
        return "Cámara Móvil"
      case "camara_desktop":
        return "Cámara Desktop"
      case "manual":
        return "Entrada Manual"
      default:
        return "Método Desconocido"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button onClick={onClose} variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <CardTitle className="flex items-center">
                <ImageIcon className="h-5 w-5 mr-2" />
                Vehículo: {car.placa}
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => setShowDetails(!showDetails)} variant="outline" size="sm">
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showDetails ? "Ocultar" : "Detalles"}
              </Button>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button onClick={handleSave} disabled={isLoading} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert variant={message.includes("❌") ? "destructive" : "default"} className="mb-4">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {/* Información del vehículo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Label>Placa</Label>
                {isEditing ? (
                  <Input name="placa" value={editData.placa} onChange={handleInputChange} className="mt-1" />
                ) : (
                  <p className="text-lg font-semibold">{car.placa}</p>
                )}
              </div>

              <div>
                <Label>Marca</Label>
                {isEditing ? (
                  <Input name="marca" value={editData.marca} onChange={handleInputChange} className="mt-1" />
                ) : (
                  <p>{car.marca}</p>
                )}
              </div>

              <div>
                <Label>Modelo</Label>
                {isEditing ? (
                  <Input name="modelo" value={editData.modelo} onChange={handleInputChange} className="mt-1" />
                ) : (
                  <p>{car.modelo}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Color</Label>
                {isEditing ? (
                  <Input name="color" value={editData.color} onChange={handleInputChange} className="mt-1" />
                ) : (
                  <p>{car.color}</p>
                )}
              </div>

              <div>
                <Label>Propietario</Label>
                {isEditing ? (
                  <Input
                    name="nombreDueño"
                    value={editData.nombreDueño}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                ) : (
                  <p>{car.nombreDueño}</p>
                )}
              </div>

              <div>
                <Label>Teléfono</Label>
                {isEditing ? (
                  <Input name="telefono" value={editData.telefono} onChange={handleInputChange} className="mt-1" />
                ) : (
                  <p>{car.telefono}</p>
                )}
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-xs text-gray-500">Ticket</Label>
                <p className="font-medium">{car.ticketAsociado}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Estado</Label>
                <Badge variant={car.estado === "estacionado" ? "default" : "secondary"}>{car.estado}</Badge>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Hora de Ingreso</Label>
                <p>{car.horaIngreso ? formatDateTime(car.horaIngreso) : "Sin fecha"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Imágenes */}
      {car.imagenes && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Imagen de la placa */}
          {car.imagenes.placaUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Camera className="h-4 w-4 mr-2" />
                    Imagen de la Placa
                  </span>
                  <Badge className={`text-white ${getConfidenceColor(car.imagenes.confianzaPlaca)}`}>
                    {getConfidenceText(car.imagenes.confianzaPlaca)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={car.imagenes.placaUrl || "/placeholder.svg"}
                      alt="Placa del vehículo"
                      className="w-full h-48 object-cover rounded-lg border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=200&width=400&text=Imagen+no+disponible"
                      }}
                    />
                  </div>

                  {showDetails && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Confianza:</span>
                        <span>{getConfidenceText(car.imagenes.confianzaPlaca)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">URL:</span>
                        <a
                          href={car.imagenes.placaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate max-w-48"
                        >
                          Ver imagen completa
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Imagen del vehículo */}
          {car.imagenes.vehiculoUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Camera className="h-4 w-4 mr-2" />
                    Imagen del Vehículo
                  </span>
                  <Badge className={`text-white ${getConfidenceColor(car.imagenes.confianzaVehiculo)}`}>
                    {getConfidenceText(car.imagenes.confianzaVehiculo)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={car.imagenes.vehiculoUrl || "/placeholder.svg"}
                      alt="Vehículo completo"
                      className="w-full h-48 object-cover rounded-lg border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=200&width=400&text=Imagen+no+disponible"
                      }}
                    />
                  </div>

                  {showDetails && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Confianza:</span>
                        <span>{getConfidenceText(car.imagenes.confianzaVehiculo)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">URL:</span>
                        <a
                          href={car.imagenes.vehiculoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate max-w-48"
                        >
                          Ver imagen completa
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Metadatos de captura */}
      {car.imagenes && showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Información de Captura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Método de Captura</Label>
                <p className="flex items-center">
                  <span className="mr-2">{getMethodIcon(car.imagenes.capturaMetodo)}</span>
                  {getMethodText(car.imagenes.capturaMetodo)}
                </p>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Fecha de Captura</Label>
                <p>{car.imagenes.fechaCaptura ? formatDateTime(car.imagenes.fechaCaptura) : "No disponible"}</p>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Precisión Promedio</Label>
                <p>
                  {car.imagenes.confianzaPlaca && car.imagenes.confianzaVehiculo
                    ? `${Math.round(((car.imagenes.confianzaPlaca + car.imagenes.confianzaVehiculo) / 2) * 100)}%`
                    : "No disponible"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje si no hay imágenes */}
      {!car.imagenes && (
        <Card>
          <CardContent className="text-center py-8">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-4">No hay imágenes disponibles para este vehículo</p>
            <p className="text-sm text-gray-400">
              Las imágenes se capturan automáticamente cuando se usa la función "Capturar Vehículo"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
