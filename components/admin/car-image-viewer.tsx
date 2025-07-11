"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/utils"
import { ArrowLeft, Save, Upload, Camera, CheckCircle, AlertCircle } from "lucide-react"
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
  const [editForm, setEditForm] = useState({
    placa: car.placa,
    marca: car.marca,
    modelo: car.modelo,
    color: car.color,
    nombreDueño: car.nombreDueño,
    telefono: car.telefono,
    nota: car.nota || "",
  })

  const [capturedImages, setCapturedImages] = useState<{
    plate?: string
    vehicle?: string
  }>({})

  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")

  const plateFileInputRef = useRef<HTMLInputElement>(null)
  const vehicleFileInputRef = useRef<HTMLInputElement>(null)

  const showMessage = useCallback((msg: string, type: "success" | "error") => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => {
      setMessage("")
      setMessageType("")
    }, 3000)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: "plate" | "vehicle") => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCapturedImages((prev) => ({ ...prev, [type]: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const uploadToCloudinary = useCallback(async (imageUrl: string, type: "plate" | "vehicle") => {
    setIsUploadingImage(true)
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const formData = new FormData()
      formData.append("image", blob)
      formData.append("type", type)
      formData.append("method", "camara_desktop")

      const uploadResponse = await fetch("/api/admin/process-vehicle", {
        method: "POST",
        body: formData,
      })

      const result = await uploadResponse.json()
      if (result.success) {
        return result.imageUrl
      } else {
        throw new Error(result.message || "Error subiendo imagen")
      }
    } catch (err) {
      console.error(`Error subiendo ${type}:`, err)
      return null
    } finally {
      setIsUploadingImage(false)
    }
  }, [])

  const handleSave = useCallback(async () => {
    if (isSaving || isUploadingImage) return

    setIsSaving(true)
    setMessage("")
    setMessageType("")

    try {
      // Preparar datos para enviar
      const updateData: any = { ...editForm }

      // Subir imágenes si hay nuevas capturas
      if (capturedImages.plate) {
        const plateUrl = await uploadToCloudinary(capturedImages.plate, "plate")
        if (plateUrl) {
          updateData.plateImageUrl = plateUrl
        }
      }

      if (capturedImages.vehicle) {
        const vehicleUrl = await uploadToCloudinary(capturedImages.vehicle, "vehicle")
        if (vehicleUrl) {
          updateData.vehicleImageUrl = vehicleUrl
        }
      }

      const response = await fetch(`/api/admin/cars/${car._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        showMessage("✅ Vehículo actualizado correctamente", "success")
        setTimeout(() => {
          onUpdate()
        }, 1000)
      } else {
        const errorData = await response.json()
        showMessage(`❌ Error: ${errorData.message || "Error al actualizar"}`, "error")
      }
    } catch (error) {
      console.error("Error updating car:", error)
      showMessage("❌ Error de conexión", "error")
    } finally {
      setIsSaving(false)
    }
  }, [car._id, editForm, capturedImages, isSaving, isUploadingImage, uploadToCloudinary, showMessage, onUpdate])

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "estacionado":
        return <Badge variant="secondary">Pendiente Confirmación</Badge>
      case "estacionado_confirmado":
        return <Badge variant="default">Confirmado</Badge>
      case "pago_pendiente_validacion":
        return <Badge variant="destructive">Pago Pendiente</Badge>
      case "pagado_validado":
        return <Badge variant="outline">Pagado - Listo para Salir</Badge>
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  const isFormDisabled = isSaving || isUploadingImage

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button onClick={onClose} variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <CardTitle className="flex items-center space-x-2">
                <span>Editar Vehículo: {car.placa}</span>
                {getStatusBadge(car.estado)}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <Alert variant={messageType === "error" ? "destructive" : "default"}>
              <div className="flex items-center">
                {messageType === "success" ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                <AlertDescription>{message}</AlertDescription>
              </div>
            </Alert>
          )}

          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nota">Nota del Parquero</Label>
              <Textarea
                id="nota"
                name="nota"
                value={editForm.nota}
                onChange={handleInputChange}
                placeholder="Información adicional sobre el vehículo..."
                className="resize-none"
                rows={2}
                disabled={isFormDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="placa">Placa</Label>
              <Input
                id="placa"
                name="placa"
                value={editForm.placa}
                onChange={handleInputChange}
                disabled={isFormDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                name="marca"
                value={editForm.marca}
                onChange={handleInputChange}
                disabled={isFormDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Input
                id="modelo"
                name="modelo"
                value={editForm.modelo}
                onChange={handleInputChange}
                disabled={isFormDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                name="color"
                value={editForm.color}
                onChange={handleInputChange}
                disabled={isFormDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombreDueño">Nombre del Dueño</Label>
              <Input
                id="nombreDueño"
                name="nombreDueño"
                value={editForm.nombreDueño}
                onChange={handleInputChange}
                disabled={isFormDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                value={editForm.telefono}
                onChange={handleInputChange}
                disabled={isFormDisabled}
              />
            </div>
          </div>

          {/* Información del ticket */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Ticket:</span> {car.ticketAsociado}
              </div>
              <div>
                <span className="font-medium">Ingreso:</span>{" "}
                {car.horaIngreso ? formatDateTime(car.horaIngreso) : "Sin fecha"}
              </div>
            </div>
          </div>

          {/* Sección de imágenes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Imágenes del Vehículo</h3>

            {/* Imágenes existentes */}
            {(car.imagenes?.plateImageUrl || car.imagenes?.vehicleImageUrl) && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Imágenes Actuales</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {car.imagenes?.plateImageUrl && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Placa Actual</Label>
                      <ImageWithFallback
                        src={car.imagenes.plateImageUrl || "/placeholder.svg"}
                        alt="Placa actual"
                        className="w-full h-40 object-cover rounded border"
                        fallback="/placeholder.svg"
                      />
                      {car.imagenes.confianzaPlaca && (
                        <p className="text-xs text-gray-500 mt-1">
                          Confianza: {Math.round(car.imagenes.confianzaPlaca * 100)}%
                        </p>
                      )}
                    </div>
                  )}
                  {car.imagenes?.vehicleImageUrl && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Vehículo Actual</Label>
                      <ImageWithFallback
                        src={car.imagenes.vehicleImageUrl || "/placeholder.svg"}
                        alt="Vehículo actual"
                        className="w-full h-40 object-cover rounded border"
                        fallback="/placeholder.svg"
                      />
                      {car.imagenes.confianzaVehiculo && (
                        <p className="text-xs text-gray-500 mt-1">
                          Confianza: {Math.round(car.imagenes.confianzaVehiculo * 100)}%
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nuevas imágenes capturadas */}
            {(capturedImages.plate || capturedImages.vehicle) && (
              <div>
                <Label className="text-sm font-medium text-green-600">Nuevas Imágenes</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {capturedImages.plate && (
                    <div>
                      <Label className="text-xs text-green-600">Nueva Placa</Label>
                      <ImageWithFallback
                        src={capturedImages.plate || "/placeholder.svg"}
                        alt="Nueva placa"
                        className="w-full h-40 object-cover rounded border border-green-500"
                        fallback="/placeholder.svg"
                      />
                    </div>
                  )}
                  {capturedImages.vehicle && (
                    <div>
                      <Label className="text-xs text-green-600">Nuevo Vehículo</Label>
                      <ImageWithFallback
                        src={capturedImages.vehicle || "/placeholder.svg"}
                        alt="Nuevo vehículo"
                        className="w-full h-40 object-cover rounded border border-green-500"
                        fallback="/placeholder.svg"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botones para subir nuevas imágenes */}
            <div>
              <Label className="text-sm font-medium">Subir Nuevas Imágenes</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <input
                    ref={plateFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "plate")}
                    className="hidden"
                    disabled={isFormDisabled}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => plateFileInputRef.current?.click()}
                    className="w-full"
                    disabled={isFormDisabled}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {capturedImages.plate ? "Cambiar Imagen de Placa" : "Subir Imagen de Placa"}
                  </Button>
                </div>
                <div>
                  <input
                    ref={vehicleFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "vehicle")}
                    className="hidden"
                    disabled={isFormDisabled}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => vehicleFileInputRef.current?.click()}
                    className="w-full"
                    disabled={isFormDisabled}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {capturedImages.vehicle ? "Cambiar Imagen de Vehículo" : "Subir Imagen de Vehículo"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de guardar */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button onClick={onClose} variant="outline" disabled={isFormDisabled}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isFormDisabled}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Guardando..." : isUploadingImage ? "Subiendo..." : "Guardar Cambios"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CarImageViewer
