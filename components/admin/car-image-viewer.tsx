"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Edit, Save, X, ImageIcon, Eye, EyeOff, Info, RefreshCw, Upload, Check } from "lucide-react"
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

  // Estados para manejo de imágenes
  const [isUploadingPlate, setIsUploadingPlate] = useState(false)
  const [isUploadingVehicle, setIsUploadingVehicle] = useState(false)
  const [newPlateImage, setNewPlateImage] = useState<string | null>(null)
  const [newVehicleImage, setNewVehicleImage] = useState<string | null>(null)
  const [uploadedUrls, setUploadedUrls] = useState<{
    plateUrl?: string
    vehicleUrl?: string
  }>({})

  const plateFileInputRef = useRef<HTMLInputElement>(null)
  const vehicleFileInputRef = useRef<HTMLInputElement>(null)

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle file upload for plate
  const handlePlateFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) {
      setMessage("Por favor seleccione un archivo de imagen válido.")
      return
    }

    setIsUploadingPlate(true)
    setMessage("Subiendo imagen de placa...")

    try {
      const formData = new FormData()
      formData.append("image", file)
      formData.append("type", "plate")
      formData.append("method", "auto")

      const response = await fetch("/api/admin/process-vehicle", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success && result.imageUrl) {
        setUploadedUrls((prev) => ({ ...prev, plateUrl: result.imageUrl }))
        setNewPlateImage(result.imageUrl)
        setMessage("✅ Imagen de placa subida correctamente")
        setTimeout(() => setMessage(""), 3000)
      } else {
        throw new Error(result.message || "Error subiendo imagen")
      }
    } catch (error) {
      console.error("Error uploading plate image:", error)
      setMessage("❌ Error subiendo imagen de placa")
      setTimeout(() => setMessage(""), 5000)
    } finally {
      setIsUploadingPlate(false)
    }
  }, [])

  // Handle file upload for vehicle
  const handleVehicleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) {
      setMessage("Por favor seleccione un archivo de imagen válido.")
      return
    }

    setIsUploadingVehicle(true)
    setMessage("Subiendo imagen de vehículo...")

    try {
      const formData = new FormData()
      formData.append("image", file)
      formData.append("type", "vehicle")
      formData.append("method", "auto")

      const response = await fetch("/api/admin/process-vehicle", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success && result.imageUrl) {
        setUploadedUrls((prev) => ({ ...prev, vehicleUrl: result.imageUrl }))
        setNewVehicleImage(result.imageUrl)
        setMessage("✅ Imagen de vehículo subida correctamente")
        setTimeout(() => setMessage(""), 3000)
      } else {
        throw new Error(result.message || "Error subiendo imagen")
      }
    } catch (error) {
      console.error("Error uploading vehicle image:", error)
      setMessage("❌ Error subiendo imagen de vehículo")
      setTimeout(() => setMessage(""), 5000)
    } finally {
      setIsUploadingVehicle(false)
    }
  }, [])

  // Handle save
  const handleSave = async () => {
    setIsLoading(true)
    setMessage("Guardando cambios...")

    try {
      const updateData = {
        placa: editData.placa,
        marca: editData.marca,
        modelo: editData.modelo,
        color: editData.color,
        nombreDueño: editData.nombreDueño,
        telefono: editData.telefono,
        ...(uploadedUrls.plateUrl && { plateImageUrl: uploadedUrls.plateUrl }),
        ...(uploadedUrls.vehicleUrl && { vehicleImageUrl: uploadedUrls.vehicleUrl }),
      }

      console.log("🔄 Enviando datos de actualización:", updateData)

      const response = await fetch(`/api/admin/cars/${car._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("✅ Información actualizada correctamente")
        setUploadedUrls({})
        setNewPlateImage(null)
        setNewVehicleImage(null)
        setIsEditing(false)
        onUpdate()
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage(`❌ ${data.error || data.message || "Error al actualizar"}`)
        setTimeout(() => setMessage(""), 5000)
      }
    } catch (error) {
      console.error("Error saving changes:", error)
      setMessage("❌ Error de conexión")
      setTimeout(() => setMessage(""), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    setEditData({
      placa: car.placa,
      marca: car.marca,
      modelo: car.modelo,
      color: car.color,
      nombreDueño: car.nombreDueño,
      telefono: car.telefono,
    })
    setUploadedUrls({})
    setNewPlateImage(null)
    setNewVehicleImage(null)
    setIsEditing(false)
    setMessage("")
  }

  // Confidence utilities
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

  // Check if there are changes to save
  const hasChanges = () => {
    const dataChanged = Object.keys(editData).some(
      (key) => editData[key as keyof typeof editData] !== car[key as keyof Car],
    )
    const imagesChanged = uploadedUrls.plateUrl || uploadedUrls.vehicleUrl
    return dataChanged || imagesChanged
  }

  return (
    <div className="space-y-6">
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
                  <Button onClick={handleSave} disabled={isLoading || !hasChanges()} size="sm">
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

          {/* Edit Fields */}
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

          {/* Image Upload Section */}
          {isEditing && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-lg font-medium mb-4">Actualizar Imágenes</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Plate Image */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Imagen de Placa</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <ImageWithFallback
                      src={newPlateImage || car.imagenes?.plateImageUrl || "/placeholder.svg"}
                      alt="Imagen de placa"
                      className="w-full h-32 object-cover rounded-lg mb-3"
                      fallback="/placeholder.svg"
                    />
                    <input
                      ref={plateFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePlateFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => plateFileInputRef.current?.click()}
                      disabled={isUploadingPlate}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      {isUploadingPlate ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {isUploadingPlate ? "Subiendo..." : "Cambiar Imagen de Placa"}
                    </Button>
                    {newPlateImage && (
                      <div className="mt-2 flex items-center text-sm text-green-600">
                        <Check className="h-4 w-4 mr-1" />
                        Nueva imagen cargada
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle Image */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Imagen del Vehículo</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <ImageWithFallback
                      src={newVehicleImage || car.imagenes?.vehicleImageUrl || "/placeholder.svg"}
                      alt="Imagen del vehículo"
                      className="w-full h-32 object-cover rounded-lg mb-3"
                      fallback="/placeholder.svg"
                    />
                    <input
                      ref={vehicleFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleVehicleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => vehicleFileInputRef.current?.click()}
                      disabled={isUploadingVehicle}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      {isUploadingVehicle ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {isUploadingVehicle ? "Subiendo..." : "Cambiar Imagen del Vehículo"}
                    </Button>
                    {newVehicleImage && (
                      <div className="mt-2 flex items-center text-sm text-green-600">
                        <Check className="h-4 w-4 mr-1" />
                        Nueva imagen cargada
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Existing Images (Non-editing View) */}
          {!isEditing && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-lg font-medium mb-4">Imágenes</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label>Imagen de Placa</Label>
                  <ImageWithFallback
                    src={car.imagenes?.plateImageUrl || "/placeholder.svg"}
                    alt={`Placa de ${car.placa}`}
                    className="w-full h-48 object-cover rounded-lg border mt-2"
                    fallback="/placeholder.svg"
                  />
                  {car.imagenes?.plateImageUrl && (
                    <Badge className={`mt-2 text-white ${getConfidenceColor(car.imagenes.confianzaPlaca)}`}>
                      {getConfidenceText(car.imagenes.confianzaPlaca)}
                    </Badge>
                  )}
                </div>
                <div>
                  <Label>Imagen del Vehículo</Label>
                  <ImageWithFallback
                    src={car.imagenes?.vehicleImageUrl || "/placeholder.svg"}
                    alt={`Vehículo de ${car.placa}`}
                    className="w-full h-48 object-cover rounded-lg border mt-2"
                    fallback="/placeholder.svg"
                  />
                  {car.imagenes?.vehicleImageUrl && (
                    <Badge className={`mt-2 text-white ${getConfidenceColor(car.imagenes.confianzaVehiculo)}`}>
                      {getConfidenceText(car.imagenes.confianzaVehiculo)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-xs text-gray-500">Ticket</Label>
                <p className="font-medium">{car.ticketAsociado}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Estado</Label>
                <Badge variant={car.estado === "estacionado_confirmado" ? "default" : "secondary"}>{car.estado}</Badge>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Hora de Ingreso</Label>
                <p>{car.horaIngreso ? formatDateTime(car.horaIngreso) : "Sin fecha"}</p>
              </div>
            </div>
          </div>

          {car.imagenes && showDetails && (
            <Card className="mt-4">
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
        </CardContent>
      </Card>
    </div>
  )
}
