"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { X, Save, Upload, Eye, EyeOff, ImageIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/utils"
import ImageWithFallback from "../image-with-fallback"

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
  nota?: string
  imagenes?: {
    plateImageUrl?: string
    vehicleImageUrl?: string
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

const CarImageViewer: React.FC<CarImageViewerProps> = ({ car, onClose, onUpdate }) => {
  const [editData, setEditData] = useState({
    placa: car.placa,
    marca: car.marca,
    modelo: car.modelo,
    color: car.color,
    nombreDueño: car.nombreDueño,
    telefono: car.telefono,
    nota: car.nota || "",
  })
  const [newImages, setNewImages] = useState<{
    plateImage?: File
    vehicleImage?: File
    platePreview?: string
    vehiclePreview?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [showImages, setShowImages] = useState(true)

  const plateInputRef = useRef<HTMLInputElement>(null)
  const vehicleInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleImageSelect = useCallback((type: "plate" | "vehicle", file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = e.target?.result as string
      setNewImages((prev) => ({
        ...prev,
        [`${type}Image`]: file,
        [`${type}Preview`]: preview,
      }))
    }
    reader.readAsDataURL(file)
  }, [])

  const handlePlateImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleImageSelect("plate", file)
      }
    },
    [handleImageSelect],
  )

  const handleVehicleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleImageSelect("vehicle", file)
      }
    },
    [handleImageSelect],
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsSubmitting(true)
      setMessage("")

      try {
        const formData = new FormData()

        // Agregar datos del carro
        Object.entries(editData).forEach(([key, value]) => {
          formData.append(key, value)
        })

        formData.append("carId", car._id)

        // Agregar imágenes existentes si no hay nuevas
        if (car.imagenes?.plateImageUrl && !newImages.plateImage) {
          formData.append("plateImageUrl", car.imagenes.plateImageUrl)
        }
        if (car.imagenes?.vehicleImageUrl && !newImages.vehicleImage) {
          formData.append("vehicleImageUrl", car.imagenes.vehicleImageUrl)
        }

        // Agregar nuevas imágenes si existen
        if (newImages.plateImage) {
          formData.append("plateImage", newImages.plateImage)
        }
        if (newImages.vehicleImage) {
          formData.append("vehicleImage", newImages.vehicleImage)
        }

        const response = await fetch("/api/admin/cars", {
          method: "PUT",
          body: formData,
        })

        const result = await response.json()

        if (response.ok) {
          setMessage("✅ Información actualizada correctamente")
          setTimeout(() => {
            onUpdate()
          }, 1500)
        } else {
          setMessage(`❌ ${result.error || "Error al actualizar"}`)
        }
      } catch (error) {
        setMessage("❌ Error de conexión")
      } finally {
        setIsSubmitting(false)
      }
    },
    [editData, newImages, car._id, onUpdate],
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <ImageIcon className="h-5 w-5 mr-2" />
              Editar Vehículo: {car.placa}
            </CardTitle>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant={car.estado === "estacionado_confirmado" ? "default" : "secondary"}>
                {car.estado === "estacionado_confirmado" ? "Confirmado" : "Pendiente"}
              </Badge>
              <span className="text-sm text-gray-500">
                Ticket: {car.ticketAsociado} | Ingreso: {formatDateTime(car.horaIngreso)}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setShowImages(!showImages)} variant="outline" size="sm">
              {showImages ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {message && (
            <Alert variant={message.includes("❌") ? "destructive" : "default"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {/* Imágenes actuales y nuevas */}
          {showImages && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Imágenes del Vehículo</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Imagen de Placa */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Imagen de Placa</Label>
                    <Button onClick={() => plateInputRef.current?.click()} variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Cambiar
                    </Button>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {newImages.platePreview ? (
                      <div className="space-y-2">
                        <p className="text-sm text-green-600 font-medium">Nueva imagen:</p>
                        <ImageWithFallback
                          src={newImages.platePreview || "/placeholder.svg"}
                          alt="Nueva placa"
                          className="w-full h-32 object-cover rounded"
                          fallback="/placeholder.svg"
                        />
                      </div>
                    ) : car.imagenes?.plateImageUrl ? (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Imagen actual:</p>
                        <ImageWithFallback
                          src={car.imagenes.plateImageUrl || "/placeholder.svg"}
                          alt="Placa actual"
                          className="w-full h-32 object-cover rounded"
                          fallback="/placeholder.svg"
                        />
                        {car.imagenes.confianzaPlaca && (
                          <p className="text-xs text-gray-500">
                            Confianza: {Math.round(car.imagenes.confianzaPlaca * 100)}%
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No hay imagen de placa</p>
                      </div>
                    )}
                  </div>

                  <input
                    ref={plateInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePlateImageChange}
                    className="hidden"
                  />
                </div>

                {/* Imagen de Vehículo */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Imagen de Vehículo</Label>
                    <Button onClick={() => vehicleInputRef.current?.click()} variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Cambiar
                    </Button>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {newImages.vehiclePreview ? (
                      <div className="space-y-2">
                        <p className="text-sm text-green-600 font-medium">Nueva imagen:</p>
                        <ImageWithFallback
                          src={newImages.vehiclePreview || "/placeholder.svg"}
                          alt="Nuevo vehículo"
                          className="w-full h-32 object-cover rounded"
                          fallback="/placeholder.svg"
                        />
                      </div>
                    ) : car.imagenes?.vehicleImageUrl ? (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Imagen actual:</p>
                        <ImageWithFallback
                          src={car.imagenes.vehicleImageUrl || "/placeholder.svg"}
                          alt="Vehículo actual"
                          className="w-full h-32 object-cover rounded"
                          fallback="/placeholder.svg"
                        />
                        {car.imagenes.confianzaVehiculo && (
                          <p className="text-xs text-gray-500">
                            Confianza: {Math.round(car.imagenes.confianzaVehiculo * 100)}%
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No hay imagen de vehículo</p>
                      </div>
                    )}
                  </div>

                  <input
                    ref={vehicleInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleVehicleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              {car.imagenes && (
                <div className="text-sm text-gray-500 space-y-1">
                  <p>
                    Fecha de captura:{" "}
                    {car.imagenes.fechaCaptura ? formatDateTime(car.imagenes.fechaCaptura) : "No disponible"}
                  </p>
                  <p>
                    Método:{" "}
                    {car.imagenes.capturaMetodo === "camara_movil"
                      ? "Cámara móvil"
                      : car.imagenes.capturaMetodo === "camara_desktop"
                        ? "Cámara desktop"
                        : "Manual"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Formulario de edición */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold">Información del Vehículo</h3>

            <div className="space-y-2">
              <Label htmlFor="nota">Nota del Parquero</Label>
              <Textarea
                id="nota"
                name="nota"
                value={editData.nota}
                onChange={handleInputChange}
                placeholder="Información adicional sobre el vehículo..."
                className="resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="placa">Placa</Label>
                <Input id="placa" name="placa" value={editData.placa} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marca">Marca</Label>
                <Input id="marca" name="marca" value={editData.marca} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input id="modelo" name="modelo" value={editData.modelo} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input id="color" name="color" value={editData.color} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombreDueño">Nombre del Dueño</Label>
                <Input
                  id="nombreDueño"
                  name="nombreDueño"
                  value={editData.nombreDueño}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" name="telefono" value={editData.telefono} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
              <Button type="button" onClick={onClose} variant="outline" className="flex-1 bg-transparent">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CarImageViewer
