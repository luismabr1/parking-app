"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDateTime } from "@/lib/utils"
import { Car, Clock, RefreshCw, Check, X, Edit3, Camera, ImageIcon, CheckCircle, AlertCircle } from "lucide-react"
import ImageWithFallback from "../image-with-fallback"

interface CarInfo {
  _id: string
  placa: string
  marca: string
  modelo: string
  color: string
  estado: string
  fechaIngreso: string
  ticketAsociado: string
  nombreDueño?: string
  telefono?: string
  horaIngreso?: string
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

interface MobileCarListProps {
  onStatsUpdate?: () => void
}

const MobileCarList: React.FC<MobileCarListProps> = ({ onStatsUpdate }) => {
  const [cars, setCars] = useState<CarInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<CarInfo>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [capturedImages, setCapturedImages] = useState<{
    plate?: string
    vehicle?: string
  }>({})
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")

  const plateFileInputRef = useRef<HTMLInputElement>(null)
  const vehicleFileInputRef = useRef<HTMLInputElement>(null)

  const fetchCars = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/cars")
      if (response.ok) {
        const data = await response.json()
        setCars(data)
      }
    } catch (error) {
      console.error("Error fetching cars:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCars()
  }, [fetchCars])

  const showMessage = useCallback((msg: string, type: "success" | "error") => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => {
      setMessage("")
      setMessageType("")
    }, 3000)
  }, [])

  const handleEditClick = useCallback((car: CarInfo) => {
    setEditingId(car._id)
    setEditForm({
      placa: car.placa,
      marca: car.marca,
      modelo: car.modelo,
      color: car.color,
      nombreDueño: car.nombreDueño || "",
      telefono: car.telefono || "",
      nota: car.nota || "",
    })
    setCapturedImages({})
    setMessage("")
    setMessageType("")
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditForm({})
    setCapturedImages({})
    setMessage("")
    setMessageType("")
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
      formData.append("method", "camara_movil")

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

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || isSaving || isUploadingImage) return

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

      const response = await fetch(`/api/admin/cars/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        await fetchCars()
        if (onStatsUpdate && typeof onStatsUpdate === "function") {
          onStatsUpdate()
        }
        setEditingId(null)
        setEditForm({})
        setCapturedImages({})
        showMessage("✅ Vehículo actualizado correctamente", "success")
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
  }, [
    editingId,
    editForm,
    capturedImages,
    fetchCars,
    onStatsUpdate,
    isSaving,
    isUploadingImage,
    uploadToCloudinary,
    showMessage,
  ])

  const handleInputChange = useCallback((field: keyof CarInfo, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }, [])

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Carros Estacionados</h3>
        <Button variant="outline" size="sm" onClick={fetchCars} disabled={isFormDisabled}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

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

      {cars.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No hay carros estacionados</p>
          </CardContent>
        </Card>
      ) : (
        cars.map((car) => (
          <Card key={car._id} className={editingId === car._id ? "ring-2 ring-blue-500" : ""}>
            <CardContent className="p-4">
              {editingId === car._id ? (
                // Modo edición
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      <Input
                        value={editForm.placa || ""}
                        onChange={(e) => handleInputChange("placa", e.target.value)}
                        className="h-8 w-24 text-sm font-semibold"
                        placeholder="Placa"
                        disabled={isFormDisabled}
                      />
                    </div>
                    {getStatusBadge(car.estado)}
                  </div>

                  {/* Campo Nota - Primero */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Nota del Parquero</Label>
                    <Input
                      value={editForm.nota || ""}
                      onChange={(e) => handleInputChange("nota", e.target.value)}
                      className="h-8 text-sm"
                      placeholder="Información adicional..."
                      disabled={isFormDisabled}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={editForm.marca || ""}
                      onChange={(e) => handleInputChange("marca", e.target.value)}
                      className="h-8 text-sm"
                      placeholder="Marca"
                      disabled={isFormDisabled}
                    />
                    <Input
                      value={editForm.modelo || ""}
                      onChange={(e) => handleInputChange("modelo", e.target.value)}
                      className="h-8 text-sm"
                      placeholder="Modelo"
                      disabled={isFormDisabled}
                    />
                  </div>

                  <Input
                    value={editForm.color || ""}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Color"
                    disabled={isFormDisabled}
                  />

                  <Input
                    value={editForm.nombreDueño || ""}
                    onChange={(e) => handleInputChange("nombreDueño", e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Nombre del dueño"
                    disabled={isFormDisabled}
                  />

                  <Input
                    value={editForm.telefono || ""}
                    onChange={(e) => handleInputChange("telefono", e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Teléfono"
                    disabled={isFormDisabled}
                  />

                  {/* Sección de imágenes */}
                  <div className="space-y-3 pt-2 border-t">
                    <Label className="text-sm font-medium">Imágenes</Label>

                    {/* Imágenes existentes */}
                    {(car.imagenes?.plateImageUrl || car.imagenes?.vehicleImageUrl) && (
                      <div className="grid grid-cols-2 gap-2">
                        {car.imagenes?.plateImageUrl && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Placa Actual</Label>
                            <ImageWithFallback
                              src={car.imagenes.plateImageUrl || "/placeholder.svg"}
                              alt="Placa actual"
                              className="w-full h-20 object-cover rounded border"
                              fallback="/placeholder.svg"
                            />
                          </div>
                        )}
                        {car.imagenes?.vehicleImageUrl && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Vehículo Actual</Label>
                            <ImageWithFallback
                              src={car.imagenes.vehicleImageUrl || "/placeholder.svg"}
                              alt="Vehículo actual"
                              className="w-full h-20 object-cover rounded border"
                              fallback="/placeholder.svg"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Nuevas imágenes capturadas */}
                    {(capturedImages.plate || capturedImages.vehicle) && (
                      <div className="grid grid-cols-2 gap-2">
                        {capturedImages.plate && (
                          <div>
                            <Label className="text-xs text-green-600">Nueva Placa</Label>
                            <ImageWithFallback
                              src={capturedImages.plate || "/placeholder.svg"}
                              alt="Nueva placa"
                              className="w-full h-20 object-cover rounded border border-green-500"
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
                              className="w-full h-20 object-cover rounded border border-green-500"
                              fallback="/placeholder.svg"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botones para subir imágenes */}
                    <div className="grid grid-cols-2 gap-2">
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
                          size="sm"
                          onClick={() => plateFileInputRef.current?.click()}
                          className="w-full h-8 text-xs"
                          disabled={isFormDisabled}
                        >
                          <Camera className="h-3 w-3 mr-1" />
                          {capturedImages.plate ? "Cambiar Placa" : "Foto Placa"}
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
                          size="sm"
                          onClick={() => vehicleFileInputRef.current?.click()}
                          className="w-full h-8 text-xs"
                          disabled={isFormDisabled}
                        >
                          <ImageIcon className="h-3 w-3 mr-1" />
                          {capturedImages.vehicle ? "Cambiar Vehículo" : "Foto Vehículo"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Ingreso: {car.horaIngreso ? formatDateTime(car.horaIngreso) : "Sin fecha"}</span>
                    </div>
                    <p>Ticket: {car.ticketAsociado}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={handleSaveEdit} disabled={isFormDisabled} className="flex-1">
                      <Check className="h-4 w-4 mr-1" />
                      {isSaving ? "Guardando..." : isUploadingImage ? "Subiendo..." : "Guardar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isFormDisabled}
                      className="flex-1 bg-transparent"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                // Modo visualización
                <div onClick={() => handleEditClick(car)} className="cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      <span className="font-semibold">{car.placa}</span>
                      <Edit3 className="h-3 w-3 text-muted-foreground" />
                    </div>
                    {getStatusBadge(car.estado)}
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    {car.nota && <p className="text-blue-600 font-medium">📝 {car.nota}</p>}
                    <p>
                      {car.marca} {car.modelo} - {car.color}
                    </p>
                    {car.nombreDueño && <p>Dueño: {car.nombreDueño}</p>}
                    {car.telefono && <p>Teléfono: {car.telefono}</p>}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Ingreso: {car.horaIngreso ? formatDateTime(car.horaIngreso) : "Sin fecha"}</span>
                    </div>
                    <p>Ticket: {car.ticketAsociado}</p>

                    {/* Vista previa de imágenes */}
                    {(car.imagenes?.plateImageUrl || car.imagenes?.vehicleImageUrl) && (
                      <div className="flex gap-2 mt-2">
                        {car.imagenes?.plateImageUrl && (
                          <div className="flex-1">
                            <ImageWithFallback
                              src={car.imagenes.plateImageUrl || "/placeholder.svg"}
                              alt="Placa"
                              className="w-full h-16 object-cover rounded border"
                              fallback="/placeholder.svg"
                            />
                            <p className="text-xs text-center mt-1">Placa</p>
                          </div>
                        )}
                        {car.imagenes?.vehicleImageUrl && (
                          <div className="flex-1">
                            <ImageWithFallback
                              src={car.imagenes.vehicleImageUrl || "/placeholder.svg"}
                              alt="Vehículo"
                              className="w-full h-16 object-cover rounded border"
                              fallback="/placeholder.svg"
                            />
                            <p className="text-xs text-center mt-1">Vehículo</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

MobileCarList.displayName = "MobileCarList"

export default React.memo(MobileCarList)
