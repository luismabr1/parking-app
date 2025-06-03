"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, RotateCcw, Check, X, Car, CreditCard, AlertTriangle } from "lucide-react"
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
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [plateData, setPlateData] = useState<{
    placa: string
    imageUrl: string
    confidence: number
  } | null>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [streamActive, setStreamActive] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mountedRef = useRef(true)

  // Agregar debug info
  const addDebugInfo = useCallback((info: string) => {
    console.log("🔍 DEBUG:", info)
    if (mountedRef.current) {
      setDebugInfo((prev) => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`])
    }
  }, [])

  // Cleanup al desmontar
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Detectar capacidades del dispositivo
  useEffect(() => {
    addDebugInfo("Iniciando componente de captura")

    // Verificar soporte de getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Su navegador no soporta acceso a la cámara")
      addDebugInfo("❌ getUserMedia no disponible")
      return
    }

    addDebugInfo("✅ getUserMedia disponible")

    // Verificar si estamos en HTTPS o localhost
    const isSecure = location.protocol === "https:" || location.hostname === "localhost"
    addDebugInfo(`🔒 Protocolo seguro: ${isSecure ? "Sí" : "No"} (${location.protocol})`)

    // Enumerar dispositivos disponibles
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter((device) => device.kind === "videoinput")
        addDebugInfo(`📹 Cámaras encontradas: ${videoDevices.length}`)
        videoDevices.forEach((device, index) => {
          addDebugInfo(`  Cámara ${index + 1}: ${device.label || "Sin nombre"}`)
        })
      })
      .catch((err) => {
        addDebugInfo(`❌ Error enumerando dispositivos: ${err.message}`)
      })
  }, [addDebugInfo])

  const startCamera = useCallback(async () => {
    if (!mountedRef.current) {
      addDebugInfo("❌ Componente desmontado, cancelando")
      return
    }

    try {
      setError(null)
      setVideoReady(false)
      setStreamActive(false)
      addDebugInfo("🎬 Intentando iniciar cámara...")

      // Limpiar stream anterior si existe
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        addDebugInfo("🧹 Stream anterior limpiado")
      }

      // Configuraciones progresivas para mayor compatibilidad
      const constraints = [
        // Configuración básica para móviles
        {
          video: {
            facingMode: "environment",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        },
        // Configuración aún más básica
        {
          video: {
            facingMode: "environment",
          },
        },
        // Cualquier cámara disponible
        {
          video: true,
        },
      ]

      let stream: MediaStream | null = null
      let lastError: Error | null = null

      for (let i = 0; i < constraints.length; i++) {
        if (!mountedRef.current) {
          addDebugInfo("❌ Componente desmontado durante configuración")
          return
        }

        try {
          addDebugInfo(`🔄 Probando configuración ${i + 1}/${constraints.length}`)
          stream = await navigator.mediaDevices.getUserMedia(constraints[i])
          addDebugInfo(`✅ Configuración ${i + 1} exitosa`)
          break
        } catch (err) {
          lastError = err as Error
          addDebugInfo(`❌ Configuración ${i + 1} falló: ${err instanceof Error ? err.message : "Error desconocido"}`)
        }
      }

      if (!stream) {
        throw lastError || new Error("No se pudo acceder a ninguna cámara")
      }

      addDebugInfo(`📹 Stream obtenido con ${stream.getVideoTracks().length} tracks de video`)

      // Verificar que el stream tiene tracks activos
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        addDebugInfo(`📹 Track de video: ${videoTrack.label}, estado: ${videoTrack.readyState}`)
      }

      // Mostrar la interfaz de captura primero
      setIsCapturing(true)

      // Esperar un momento para que el DOM se actualice
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verificar que el video element existe
      if (!videoRef.current || !mountedRef.current) {
        addDebugInfo("❌ Elemento video no encontrado")
        stream.getTracks().forEach((track) => track.stop())
        setError("Error: elemento de video no disponible")
        return
      }

      addDebugInfo("✅ Elemento video encontrado")

      // Configurar el stream
      const video = videoRef.current
      video.srcObject = stream
      streamRef.current = stream

      // Esperar a que el video esté completamente listo
      try {
        await new Promise<void>((resolve, reject) => {
          if (!video || !mountedRef.current) {
            reject(new Error("Video element perdido durante setup"))
            return
          }

          const onLoadedMetadata = () => {
            if (!mountedRef.current) return
            addDebugInfo(`📹 Video metadata: ${video.videoWidth}x${video.videoHeight}`)
            addDebugInfo(`📹 Video readyState: ${video.readyState}`)
            cleanup()
            setVideoReady(true)
            resolve()
          }

          const onCanPlay = () => {
            if (!mountedRef.current) return
            addDebugInfo("📹 Video puede reproducirse")
            setStreamActive(true)
          }

          const onPlaying = () => {
            if (!mountedRef.current) return
            addDebugInfo("📹 Video está reproduciéndose")
            setStreamActive(true)
          }

          const onError = (e: Event) => {
            addDebugInfo(`❌ Error en video: ${e}`)
            cleanup()
            reject(new Error("Error cargando video"))
          }

          const onTimeout = () => {
            addDebugInfo("⏰ Timeout cargando video")
            cleanup()
            reject(new Error("Timeout cargando video"))
          }

          const cleanup = () => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata)
            video.removeEventListener("canplay", onCanPlay)
            video.removeEventListener("playing", onPlaying)
            video.removeEventListener("error", onError)
            clearTimeout(timeoutId)
          }

          video.addEventListener("loadedmetadata", onLoadedMetadata)
          video.addEventListener("canplay", onCanPlay)
          video.addEventListener("playing", onPlaying)
          video.addEventListener("error", onError)

          // Timeout más largo para asegurar que el video esté listo
          const timeoutId = setTimeout(onTimeout, 8000)

          // Si el video ya tiene metadata, disparar inmediatamente
          if (video.readyState >= 1) {
            onLoadedMetadata()
          }

          // Forzar reproducción
          video.play().catch((playError) => {
            addDebugInfo(`❌ Error reproduciendo video: ${playError}`)
          })
        })

        addDebugInfo("🎉 Cámara iniciada exitosamente")
      } catch (setupError) {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop())
        }
        throw setupError
      }
    } catch (err) {
      if (!mountedRef.current) return

      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      addDebugInfo(`💥 Error final: ${errorMessage}`)

      // Mensajes de error más específicos
      if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
        setError("Permisos de cámara denegados. Por favor, permita el acceso a la cámara y recargue la página.")
      } else if (errorMessage.includes("NotFoundError") || errorMessage.includes("DevicesNotFoundError")) {
        setError("No se encontró ninguna cámara en el dispositivo.")
      } else if (errorMessage.includes("NotReadableError") || errorMessage.includes("TrackStartError")) {
        setError("La cámara está siendo usada por otra aplicación. Cierre otras apps que usen la cámara.")
      } else if (
        errorMessage.includes("OverconstrainedError") ||
        errorMessage.includes("ConstraintNotSatisfiedError")
      ) {
        setError("La cámara no soporta la configuración solicitada.")
      } else if (errorMessage.includes("elemento de video")) {
        setError("Error interno: elemento de video no disponible. Intente recargar la página.")
      } else {
        setError(`Error accediendo a la cámara: ${errorMessage}`)
      }

      setIsCapturing(false)
      console.error("Camera error:", err)
    }
  }, [addDebugInfo])

  const stopCamera = useCallback(() => {
    addDebugInfo("🛑 Deteniendo cámara")
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
        addDebugInfo(`🔇 Track detenido: ${track.kind}`)
      })
      streamRef.current = null
    }
    setIsCapturing(false)
    setVideoReady(false)
    setStreamActive(false)
  }, [addDebugInfo])

  const capturePhoto = useCallback(() => {
    addDebugInfo("📸 Iniciando captura de foto")

    if (!videoRef.current || !canvasRef.current) {
      addDebugInfo("❌ Elementos video/canvas no disponibles")
      setError("Error: elementos de captura no disponibles")
      return
    }

    if (!videoReady || !streamActive) {
      addDebugInfo(`❌ Video no está listo: ready=${videoReady}, active=${streamActive}`)
      setError("Error: video no está listo para captura. Espere un momento.")
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) {
      addDebugInfo("❌ Contexto 2D no disponible")
      setError("Error: no se pudo obtener contexto de canvas")
      return
    }

    // Verificar que el video tiene dimensiones válidas
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      addDebugInfo(`❌ Video sin dimensiones: ${video.videoWidth}x${video.videoHeight}`)
      setError("Error: video no tiene dimensiones válidas")
      return
    }

    // Verificar que el video está realmente reproduciendo
    if (video.paused || video.ended) {
      addDebugInfo(`❌ Video no está reproduciendo: paused=${video.paused}, ended=${video.ended}`)
      setError("Error: video no está reproduciendo")
      return
    }

    addDebugInfo(`📐 Capturando: ${video.videoWidth}x${video.videoHeight}`)
    addDebugInfo(`📹 Estado del video: readyState=${video.readyState}, currentTime=${video.currentTime}`)

    try {
      // Configurar el canvas con las dimensiones del video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Limpiar el canvas primero
      context.clearRect(0, 0, canvas.width, canvas.height)

      // Dibujar el frame actual del video en el canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Verificar que se dibujó algo (no todo negro)
      const imageData = context.getImageData(0, 0, Math.min(100, canvas.width), Math.min(100, canvas.height))
      const pixels = imageData.data
      let hasNonBlackPixels = false

      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] > 10 || pixels[i + 1] > 10 || pixels[i + 2] > 10) {
          hasNonBlackPixels = true
          break
        }
      }

      if (!hasNonBlackPixels) {
        addDebugInfo("⚠️ Imagen capturada parece estar en negro")
        // Continuar de todos modos, pero avisar
      }

      // Convertir a blob y obtener URL
      canvas.toBlob(
        (blob) => {
          if (!mountedRef.current) return

          if (blob) {
            const imageUrl = URL.createObjectURL(blob)
            addDebugInfo(`✅ Foto capturada: ${blob.size} bytes`)
            setCapturedImages((prev) => ({
              ...prev,
              [currentStep]: imageUrl,
            }))
            stopCamera()
          } else {
            addDebugInfo("❌ Error generando blob")
            setError("Error generando imagen")
          }
        },
        "image/jpeg",
        0.8,
      )
    } catch (captureError) {
      addDebugInfo(`❌ Error durante captura: ${captureError}`)
      setError("Error capturando imagen")
    }
  }, [currentStep, stopCamera, addDebugInfo, videoReady, streamActive])

  const processPlateImage = useCallback(async () => {
    if (!capturedImages.plate) return

    setIsProcessing(true)
    setError(null)
    addDebugInfo("🔍 Procesando imagen de placa")

    try {
      const response = await fetch(capturedImages.plate)
      const blob = await response.blob()
      const file = new File([blob], "plate-capture.jpg", { type: "image/jpeg" })

      const formData = new FormData()
      formData.append("image", file)
      formData.append("type", "plate")

      addDebugInfo(`📤 Enviando imagen: ${file.size} bytes`)

      const uploadResponse = await fetch("/api/admin/process-vehicle", {
        method: "POST",
        body: formData,
      })

      const result = await uploadResponse.json()
      addDebugInfo(`📥 Respuesta recibida: ${uploadResponse.status}`)

      if (uploadResponse.ok && result.success) {
        setPlateData({
          placa: result.placa,
          imageUrl: result.imageUrl,
          confidence: result.confidence,
        })
        setCurrentStep("vehicle")
        addDebugInfo(`✅ Placa detectada: ${result.placa}`)
      } else {
        addDebugInfo(`❌ Error procesando: ${result.message}`)
        setError(result.message || "Error al procesar la placa")
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido"
      addDebugInfo(`💥 Error de red: ${errorMsg}`)
      setError("Error al procesar la imagen de la placa")
      console.error("Processing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }, [capturedImages.plate, addDebugInfo])

  const processVehicleImage = useCallback(async () => {
    if (!capturedImages.vehicle || !plateData) return

    setIsProcessing(true)
    setCurrentStep("processing")
    addDebugInfo("🚗 Procesando imagen de vehículo")

    try {
      const response = await fetch(capturedImages.vehicle)
      const blob = await response.blob()
      const file = new File([blob], "vehicle-capture.jpg", { type: "image/jpeg" })

      const formData = new FormData()
      formData.append("image", file)
      formData.append("type", "vehicle")

      addDebugInfo(`📤 Enviando imagen de vehículo: ${file.size} bytes`)

      const uploadResponse = await fetch("/api/admin/process-vehicle", {
        method: "POST",
        body: formData,
      })

      const result = await uploadResponse.json()
      addDebugInfo(`📥 Respuesta vehículo: ${uploadResponse.status}`)

      if (uploadResponse.ok && result.success) {
        addDebugInfo(`✅ Vehículo detectado: ${result.marca} ${result.modelo}`)
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
        addDebugInfo(`❌ Error procesando vehículo: ${result.message}`)
        setError(result.message || "Error al procesar la imagen del vehículo")
        setCurrentStep("vehicle")
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido"
      addDebugInfo(`💥 Error procesando vehículo: ${errorMsg}`)
      setError("Error al procesar la imagen del vehículo")
      setCurrentStep("vehicle")
      console.error("Processing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }, [capturedImages.vehicle, plateData, onVehicleDetected, addDebugInfo])

  const retakePhoto = useCallback(() => {
    addDebugInfo("🔄 Retomando foto")
    setCapturedImages((prev) => ({ ...prev, [currentStep]: undefined }))
    setError(null)
    startCamera()
  }, [currentStep, startCamera, addDebugInfo])

  const goBackToPlate = useCallback(() => {
    addDebugInfo("⬅️ Volviendo a captura de placa")
    setCurrentStep("plate")
    setPlateData(null)
    setCapturedImages({})
    setError(null)
  }, [addDebugInfo])

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
            <AlertTriangle className="h-4 w-4" />
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

        {/* Panel de debug - siempre visible en producción para diagnosticar */}
        {debugInfo.length > 0 && (
          <Alert>
            <AlertDescription>
              <details>
                <summary className="cursor-pointer font-medium">🔍 Debug Info</summary>
                <div className="mt-2 text-xs space-y-1">
                  {debugInfo.map((info, index) => (
                    <div key={index} className="font-mono">
                      {info}
                    </div>
                  ))}
                </div>
              </details>
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
            <Button onClick={startCamera} className="w-full" size="lg">
              <Camera className="h-4 w-4 mr-2" />
              Abrir Cámara
            </Button>
            <p className="text-xs text-gray-500">Asegúrese de permitir el acceso a la cámara cuando se lo solicite</p>
            <p className="text-xs text-gray-400">Si el problema persiste, recargue la página e intente nuevamente</p>
          </div>
        )}

        {isCapturing && (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg bg-black"
                style={{ maxHeight: "300px", minHeight: "200px" }}
                onLoadedMetadata={() => {
                  addDebugInfo("📹 Video metadata cargada")
                  setVideoReady(true)
                }}
                onCanPlay={() => {
                  addDebugInfo("📹 Video puede reproducirse")
                  setStreamActive(true)
                }}
                onPlaying={() => {
                  addDebugInfo("📹 Video está reproduciéndose")
                  setStreamActive(true)
                }}
                onError={(e) => {
                  addDebugInfo(`❌ Error en video element: ${e}`)
                  setError("Error en el elemento de video")
                }}
              />
              {videoReady && streamActive && (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                  <div
                    className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${stepInfo.frameClass} border-2 border-yellow-400 rounded`}
                  >
                    <span className="absolute -top-6 left-0 text-xs text-yellow-400 font-medium">
                      {stepInfo.frameLabel}
                    </span>
                  </div>
                </div>
              )}
              {(!videoReady || !streamActive) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">
                      {!videoReady ? "Cargando cámara..." : !streamActive ? "Iniciando video..." : "Preparando..."}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Button onClick={capturePhoto} className="flex-1" size="lg" disabled={!videoReady || !streamActive}>
                <Camera className="h-4 w-4 mr-2" />
                {videoReady && streamActive ? "Capturar" : "Esperando..."}
              </Button>
              <Button onClick={onCancel} variant="outline">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {videoReady && streamActive && (
              <p className="text-xs text-center text-green-600">✅ Cámara lista para capturar</p>
            )}
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
                <Button onClick={processPlateImage} disabled={isProcessing} className="flex-1" size="lg">
                  <Check className="h-4 w-4 mr-2" />
                  {isProcessing ? "Procesando..." : "Procesar Placa"}
                </Button>
              )}
              {currentStep === "vehicle" && (
                <Button onClick={processVehicleImage} disabled={isProcessing} className="flex-1" size="lg">
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
