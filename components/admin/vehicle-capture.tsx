"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, RotateCcw, Check, X, Car, CreditCard } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface VehicleData {
  placa: string
  marca: string
  modelo: string
  color: string
  plateImageUrl: string
  vehicleImageUrl: string
  plateConfidence: number
  vehicleConfidence: number
}

interface VehicleCaptureProps {
  onVehicleDetected: (vehicleData: VehicleData) => void
  onCancel: () => void
}

type CaptureStep = "plate" | "vehicle" | "processing"

export default function VehicleCapture({ onVehicleDetected, onCancel }: VehicleCaptureProps) {
  const [currentStep, setCurrentStep] = useState<CaptureStep>("plate")
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImages, setCapturedImages] = useState<{
    plate?: string
    vehicle?: string
  }>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plateData, setPlateData] = useState<{
    placa: string
    imageUrl: string
    confidence: number
  } | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCapturing(true)
      }
    } catch (err) {
      setError("No se pudo acceder a la cámara. Verifique los permisos.")
      console.error("Camera error:", err)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCapturing(false)
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const imageUrl = URL.createObjectURL(blob)
          setCapturedImages((prev) => ({
            ...prev,
            [currentStep]: imageUrl,
          }))
          stopCamera()
        }
      },
      "image/jpeg",
      0.8,
    )
  }, [currentStep, stopCamera])

  const processPlateImage = useCallback(async () => {
    if (!capturedImages.plate) return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch(capturedImages.plate)
      const blob = await response.blob()
      const file = new File([blob], "plate-capture.jpg", { type: "image/jpeg" })

      const formData = new FormData()
      formData.append("image", file)
      formData.append("type", "plate")

      const uploadResponse = await fetch("/api/admin/process-vehicle", {
        method: "POST",
        body: formData,
      })

      const result = await uploadResponse.json()

      if (uploadResponse.ok && result.success) {
        setPlateData({
          placa: result.placa,
          imageUrl: result.imageUrl,
          confidence: result.confidence,
        })
        setCurrentStep("vehicle")
      } else {
        setError(result.message || "Error al procesar la placa")
      }
    } catch (err) {
      setError("Error al procesar la imagen de la placa")
      console.error("Processing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }, [capturedImages.plate])

  const processVehicleImage = useCallback(async () => {
    if (!capturedImages.vehicle || !plateData) return

    setIsProcessing(true)
    setCurrentStep("processing")

    try {
      const response = await fetch(capturedImages.vehicle)
      const blob = await response.blob()
      const file = new File([blob], "vehicle-capture.jpg", { type: "image/jpeg" })

      const formData = new FormData()
      formData.append("image", file)
      formData.append("type", "vehicle")

      const uploadResponse = await fetch("/api/admin/process-vehicle", {
        method: "POST",
        body: formData,
      })

      const result = await uploadResponse.json()

      if (uploadResponse.ok && result.success) {
        onVehicleDetected({
          placa: plateData.placa,
          marca: result.marca,
          modelo: result.modelo,
          color: result.color,
          plateImageUrl: plateData.imageUrl,
          vehicleImageUrl: result.imageUrl,
          plateConfidence: plateData.confidence,
          vehicleConfidence: result.confidence,
        })
      } else {
        setError(result.message || "Error al procesar la imagen del vehículo")
        setCurrentStep("vehicle")
      }
    } catch (err) {
      setError("Error al procesar la imagen del vehículo")
      setCurrentStep("vehicle")
      console.error("Processing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }, [capturedImages.vehicle, plateData, onVehicleDetected])

  const retakePhoto = useCallback(() => {
    setCapturedImages((prev) => ({ ...prev, [currentStep]: undefined }))
    setError(null)
    startCamera()
  }, [currentStep, startCamera])

  const goBackToPlate = useCallback(() => {
    setCurrentStep("plate")
    setPlateData(null)
    setCapturedImages({})
    setError(null)
  }, [])

  const getStepInfo = () => {
    switch (currentStep) {
      case "plate":
        return {
          title: "1. Capturar Placa",
          description: "Alinee la placa del vehículo en el marco",
          icon: <CreditCard className="h-5 w-5" />,
          frameClass: "w-48 h-24",
          frameLabel: "Alinee la placa aquí",
        }
      case "vehicle":
        return {
          title: "2. Capturar Vehículo",
          description: "Tome una foto completa del vehículo",
          icon: <Car className="h-5 w-5" />,
          frameClass: "w-64 h-48",
          frameLabel: "Vehículo completo aquí",
        }
      case "processing":
        return {
          title: "3. Procesando...",
          description: "Analizando las imágenes",
          icon: <Camera className="h-5 w-5" />,
          frameClass: "",
          frameLabel: "",
        }
    }
  }

  const stepInfo = getStepInfo()

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            {stepInfo.icon}
            <span className="ml-2">{stepInfo.title}</span>
          </div>
          <div className="flex space-x-1">
            <Badge variant={currentStep === "plate" ? "default" : plateData ? "secondary" : "outline"}>1</Badge>
            <Badge variant={currentStep === "vehicle" ? "default" : "outline"}>2</Badge>
            <Badge variant={currentStep === "processing" ? "default" : "outline"}>3</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {plateData && currentStep !== "plate" && (
          <Alert>
            <AlertDescription>
              ✅ <strong>Placa detectada:</strong> {plateData.placa} ({Math.round(plateData.confidence * 100)}%
              confianza)
            </AlertDescription>
          </Alert>
        )}

        {currentStep === "processing" && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-sm text-gray-600">Procesando imágenes con IA...</p>
            <p className="text-xs text-gray-500">Esto puede tomar unos segundos</p>
          </div>
        )}

        {!isCapturing && !capturedImages[currentStep] && currentStep !== "processing" && (
          <div className="text-center space-y-4">
            <Camera className="h-16 w-16 mx-auto text-gray-400" />
            <p className="text-sm text-gray-600">{stepInfo.description}</p>
            <Button onClick={startCamera} className="w-full">
              <Camera className="h-4 w-4 mr-2" />
              Abrir Cámara
            </Button>
          </div>
        )}

        {isCapturing && (
          <div className="space-y-4">
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" style={{ maxHeight: "300px" }} />
              <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                <div
                  className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${stepInfo.frameClass} border-2 border-yellow-400 rounded`}
                >
                  <span className="absolute -top-6 left-0 text-xs text-yellow-400 font-medium">
                    {stepInfo.frameLabel}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={capturePhoto} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Capturar
              </Button>
              <Button onClick={onCancel} variant="outline">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {capturedImages[currentStep] && currentStep !== "processing" && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={capturedImages[currentStep] || "/placeholder.svg"}
                alt={`Captured ${currentStep}`}
                className="w-full rounded-lg"
                style={{ maxHeight: "300px", objectFit: "contain" }}
              />
            </div>
            <div className="flex space-x-2">
              {currentStep === "plate" && (
                <Button onClick={processPlateImage} disabled={isProcessing} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  {isProcessing ? "Procesando..." : "Procesar Placa"}
                </Button>
              )}
              {currentStep === "vehicle" && (
                <Button onClick={processVehicleImage} disabled={isProcessing} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  {isProcessing ? "Procesando..." : "Procesar Vehículo"}
                </Button>
              )}
              <Button onClick={retakePhoto} variant="outline">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            {currentStep === "vehicle" && (
              <Button onClick={goBackToPlate} variant="ghost" className="w-full">
                ← Volver a capturar placa
              </Button>
            )}
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  )
}
