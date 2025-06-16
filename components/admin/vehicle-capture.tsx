"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Camera,
  RotateCcw,
  Check,
  X,
  Car,
  CreditCard,
  AlertTriangle,
  Settings,
  RefreshCw,
  Smartphone,
  Copy,
  CheckCircle2,
  Bug,
  Trash2,
  FileText,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useOCRService } from "@/lib/ocr-service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

type CaptureStep = "plate" | "vehicle" | "processing" | "completed"
type OCRMethod = "auto" | "tesseract" | "python"

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
  const [vehicleResult, setVehicleResult] = useState<{
    marca: string
    modelo: string
    color: string
    confidence: number
  } | null>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [streamActive, setStreamActive] = useState(false)
  const [ocrMethod, setOcrMethod] = useState<OCRMethod>("tesseract")
  const [ocrStatus, setOcrStatus] = useState<string>("")
  const [showSettings, setShowSettings] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment")
  const [retryCount, setRetryCount] = useState(0)
  const [useFileInput, setUseFileInput] = useState(false)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>("")
  const [copySuccess, setCopySuccess] = useState(false)
  const [forceLegacyMode, setForceLegacyMode] = useState(false)
  const [simulationMode, setSimulationMode] = useState(false)
  const [showLogs, setShowLogs] = useState(true) // Mostrar logs por defecto

  const { processPlate, processVehicle, cleanup } = useOCRService()

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mountedRef = useRef(true)
  const diagnosticIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current && showLogs) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [debugInfo, showLogs])

  // Agregar debug info - mantener historial completo
  const addDebugInfo = useCallback((info: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `${timestamp}: ${info}`
    console.log("🔍 DEBUG:", logEntry)
    if (mountedRef.current) {
      setDebugInfo((prev) => [...prev.slice(-100), logEntry]) // Mantener últimos 100 logs
    }
  }, [])

  // Limpiar logs manualmente
  const clearDebugInfo = useCallback(() => {
    setDebugInfo([])
    addDebugInfo("🧹 Logs limpiados manualmente")
  }, [addDebugInfo])

  // Función para copiar logs al portapapeles
  const copyLogsToClipboard = useCallback(() => {
    const logText = debugInfo.join("\n")
    navigator.clipboard
      .writeText(logText)
      .then(() => {
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
        addDebugInfo("📋 Logs copiados al portapapeles")
      })
      .catch((err) => {
        addDebugInfo(`❌ Error copiando logs: ${err}`)
      })
  }, [debugInfo, addDebugInfo])

  // Función de diagnóstico continuo
  const startDiagnostics = useCallback(() => {
    if (diagnosticIntervalRef.current) {
      clearInterval(diagnosticIntervalRef.current)
    }

    diagnosticIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !streamRef.current) return

      const video = videoRef.current
      const stream = streamRef.current

      // Diagnóstico detallado del video
      addDebugInfo(`🔍 DIAGNÓSTICO: readyState=${video.readyState}, paused=${video.paused}`)
      addDebugInfo(
        `🔍 DIMENSIONES: video=${video.videoWidth}x${video.videoHeight}, element=${video.clientWidth}x${video.clientHeight}`,
      )
      addDebugInfo(`🔍 TIEMPO: currentTime=${video.currentTime.toFixed(2)}, duration=${video.duration}`)

      // Diagnóstico del stream
      const tracks = stream.getVideoTracks()
      if (tracks.length > 0) {
        const track = tracks[0]
        const settings = track.getSettings()
        addDebugInfo(`🔍 TRACK: enabled=${track.enabled}, readyState=${track.readyState}, muted=${track.muted}`)
        addDebugInfo(`🔍 SETTINGS: ${settings.width}x${settings.height}, frameRate=${settings.frameRate}`)
        addDebugInfo(`🔍 DEVICE: ${settings.deviceId?.slice(0, 8)}..., facing=${settings.facingMode}`)
      }

      // Verificar si el video está realmente renderizando contenido
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        const canvas = document.createElement("canvas")
        canvas.width = Math.min(video.videoWidth, 100)
        canvas.height = Math.min(video.videoHeight, 100)
        const ctx = canvas.getContext("2d")

        if (ctx) {
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const pixels = imageData.data

            let totalBrightness = 0
            let nonZeroPixels = 0

            for (let i = 0; i < pixels.length; i += 4) {
              const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3
              totalBrightness += brightness
              if (brightness > 0) nonZeroPixels++
            }

            const avgBrightness = totalBrightness / (pixels.length / 4)
            const pixelRatio = nonZeroPixels / (pixels.length / 4)

            addDebugInfo(
              `🔍 CONTENIDO: brillo=${avgBrightness.toFixed(2)}, píxeles_no_cero=${(pixelRatio * 100).toFixed(1)}%`,
            )

            if (avgBrightness < 5 && pixelRatio < 0.1) {
              addDebugInfo(`⚠️ VIDEO RENDERIZANDO NEGRO - brillo muy bajo`)
            }
          } catch (err) {
            addDebugInfo(`❌ Error analizando contenido: ${err}`)
          }
        }
      }
    }, 3000) // Cada 3 segundos para no saturar
  }, [addDebugInfo])

  const stopDiagnostics = useCallback(() => {
    if (diagnosticIntervalRef.current) {
      clearInterval(diagnosticIntervalRef.current)
      diagnosticIntervalRef.current = null
    }
  }, [])

  // Cleanup al desmontar
  useEffect(() => {
    mountedRef.current = true
    addDebugInfo("🚀 Iniciando VehicleCapture - Logs en tiempo real activados")
    return () => {
      mountedRef.current = false
      stopDiagnostics()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      cleanup()
    }
  }, [cleanup, stopDiagnostics, addDebugInfo])

  // Detectar cámaras disponibles
  useEffect(() => {
    const detectCameras = async () => {
      try {
        addDebugInfo("🔍 Detectando cámaras disponibles...")

        // Solicitar permisos primero
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true })
        tempStream.getTracks().forEach((track) => track.stop())

        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((device) => device.kind === "videoinput")

        setAvailableCameras(videoDevices)
        addDebugInfo(`📹 ${videoDevices.length} cámaras detectadas`)

        videoDevices.forEach((device, index) => {
          addDebugInfo(`  ${index + 1}: ${device.label || `Cámara ${index + 1}`} (${device.deviceId.slice(0, 8)}...)`)
        })

        // Seleccionar cámara trasera por defecto
        const backCamera = videoDevices.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("rear") ||
            device.label.toLowerCase().includes("environment") ||
            device.label.toLowerCase().includes("camera2 0"),
        )

        if (backCamera) {
          setSelectedCameraId(backCamera.deviceId)
          addDebugInfo(`✅ Cámara trasera seleccionada: ${backCamera.label}`)
        } else if (videoDevices.length > 0) {
          setSelectedCameraId(videoDevices[0].deviceId)
          addDebugInfo(`✅ Primera cámara seleccionada: ${videoDevices[0].label}`)
        }
      } catch (err) {
        addDebugInfo(`❌ Error detectando cámaras: ${err}`)
        setUseFileInput(true)
      }
    }

    detectCameras()
  }, [addDebugInfo])

  // Detectar capacidades del dispositivo
  useEffect(() => {
    addDebugInfo("🚀 Iniciando sistema de captura con diagnóstico avanzado")

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Su navegador no soporta acceso a la cámara")
      addDebugInfo("❌ getUserMedia no disponible")
      setUseFileInput(true)
      return
    }

    addDebugInfo("✅ getUserMedia disponible")

    const isSecure = location.protocol === "https:" || location.hostname === "localhost"
    addDebugInfo(`🔒 Protocolo seguro: ${isSecure ? "Sí" : "No"} (${location.protocol})`)

    // Detectar tipo de dispositivo y navegador
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)
    const isAndroid = /android/.test(userAgent)
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isChrome = /chrome/.test(userAgent)
    const isFirefox = /firefox/.test(userAgent)
    const isSamsung = /samsung/.test(userAgent)

    addDebugInfo(`📱 Dispositivo: ${isMobile ? "Móvil" : "Desktop"}`)
    addDebugInfo(`🤖 OS: ${isAndroid ? "Android" : isIOS ? "iOS" : "Otro"}`)
    addDebugInfo(`🌐 Navegador: ${isChrome ? "Chrome" : isFirefox ? "Firefox" : "Otro"}`)
    if (isSamsung) addDebugInfo(`📱 Samsung Internet detectado`)

    // Verificar soporte de hardware acceleration
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    addDebugInfo(`🎮 WebGL: ${gl ? "Disponible" : "No disponible"}`)

    if (typeof WebAssembly === "object") {
      addDebugInfo("✅ WebAssembly soportado - Tesseract.js disponible")
    } else {
      addDebugInfo("⚠️ WebAssembly no soportado - Solo API remota")
    }
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
      addDebugInfo(`🎬 Iniciando cámara (intento ${retryCount + 1})`)

      // Limpiar stream anterior
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        addDebugInfo("🧹 Stream anterior limpiado")
      }

      stopDiagnostics()

      // Configuraciones específicas por dispositivo
      const constraints = []

      // Modo legacy forzado (más compatible)
      if (forceLegacyMode) {
        addDebugInfo("🔧 Usando modo legacy forzado")
        constraints.push({
          video: true,
          audio: false,
        })
      }
      // Si tenemos una cámara específica seleccionada
      else if (selectedCameraId) {
        addDebugInfo(`🎯 Usando cámara específica: ${selectedCameraId.slice(0, 8)}...`)

        constraints.push({
          video: {
            deviceId: { exact: selectedCameraId },
            width: { min: 320, ideal: 640, max: 1920 },
            height: { min: 240, ideal: 480, max: 1080 },
            frameRate: { ideal: 30 },
          },
        })

        constraints.push({
          video: {
            deviceId: selectedCameraId,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        })

        constraints.push({
          video: {
            deviceId: selectedCameraId,
          },
        })
      }

      // Configuraciones por facingMode
      if (!forceLegacyMode) {
        constraints.push(
          {
            video: {
              facingMode: { exact: cameraFacing },
              width: { min: 320, ideal: 640, max: 1920 },
              height: { min: 240, ideal: 480, max: 1080 },
              frameRate: { ideal: 30 },
            },
          },
          {
            video: {
              facingMode: cameraFacing,
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
          },
          {
            video: {
              facingMode: cameraFacing,
            },
          },
          {
            video: true,
          },
        )
      }

      let stream: MediaStream | null = null
      let lastError: Error | null = null

      for (let i = 0; i < constraints.length; i++) {
        if (!mountedRef.current) {
          addDebugInfo("❌ Componente desmontado durante configuración")
          return
        }

        try {
          addDebugInfo(`🔄 Probando configuración ${i + 1}/${constraints.length}`)
          addDebugInfo(`📐 Constraint: ${JSON.stringify(constraints[i].video)}`)

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

      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        const settings = videoTrack.getSettings()
        const capabilities = videoTrack.getCapabilities()

        addDebugInfo(`📹 TRACK CONFIGURADO:`)
        addDebugInfo(`  - Dimensiones: ${settings.width}x${settings.height}`)
        addDebugInfo(`  - FrameRate: ${settings.frameRate}`)
        addDebugInfo(`  - FacingMode: ${settings.facingMode}`)
        addDebugInfo(`  - DeviceId: ${settings.deviceId?.slice(0, 8)}...`)
        addDebugInfo(`  - Estado: ${videoTrack.readyState}`)
        addDebugInfo(`  - Enabled: ${videoTrack.enabled}`)
        addDebugInfo(`  - Muted: ${videoTrack.muted}`)
      }

      setIsCapturing(true)
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (!videoRef.current || !mountedRef.current) {
        addDebugInfo("❌ Elemento video no encontrado")
        stream.getTracks().forEach((track) => track.stop())
        setError("Error: elemento de video no disponible")
        return
      }

      const video = videoRef.current

      addDebugInfo("🎬 CONFIGURANDO VIDEO ELEMENT:")

      // Limpiar configuraciones anteriores
      video.srcObject = null
      video.removeAttribute("style")

      // Configurar video element con propiedades específicas
      video.setAttribute("playsinline", "true")
      video.setAttribute("webkit-playsinline", "true")
      video.setAttribute("x5-playsinline", "true")
      video.setAttribute("x5-video-player-type", "h5")
      video.muted = true
      video.autoplay = true
      video.controls = false
      video.playsInline = true

      addDebugInfo(`  - playsinline: ${video.getAttribute("playsinline")}`)
      addDebugInfo(`  - webkit-playsinline: ${video.getAttribute("webkit-playsinline")}`)
      addDebugInfo(`  - muted: ${video.muted}`)
      addDebugInfo(`  - autoplay: ${video.autoplay}`)

      // Aplicar estilos CSS específicos
      video.style.width = "100%"
      video.style.height = "auto"
      video.style.objectFit = "cover"
      video.style.backgroundColor = "black"
      video.style.position = "relative"
      video.style.zIndex = "10"

      addDebugInfo("📹 Asignando srcObject...")
      video.srcObject = stream
      streamRef.current = stream

      addDebugInfo("📹 Forzando load del video...")
      video.load()

      // Esperar a que el video esté listo con verificaciones exhaustivas
      try {
        await new Promise<void>((resolve, reject) => {
          if (!video || !mountedRef.current) {
            reject(new Error("Video element perdido durante setup"))
            return
          }

          let resolved = false
          let checkCount = 0
          const maxChecks = 60 // 12 segundos máximo

          const checkVideoReady = () => {
            if (!mountedRef.current || resolved) return

            checkCount++
            const readyState = video.readyState
            const videoWidth = video.videoWidth
            const videoHeight = video.videoHeight
            const currentTime = video.currentTime
            const paused = video.paused
            const ended = video.ended

            addDebugInfo(`🔍 Check ${checkCount}: readyState=${readyState}, dimensions=${videoWidth}x${videoHeight}`)
            addDebugInfo(`🔍 Check ${checkCount}: currentTime=${currentTime}, paused=${paused}, ended=${ended}`)

            // Verificar si el video está realmente listo
            if (readyState >= 2 && videoWidth > 0 && videoHeight > 0 && !paused) {
              addDebugInfo(`✅ Video completamente listo: ${videoWidth}x${videoHeight}`)
              resolved = true
              cleanup()
              setVideoReady(true)
              setStreamActive(true)

              // Iniciar diagnósticos continuos
              setTimeout(() => {
                startDiagnostics()
              }, 1000)

              resolve()
              return
            }

            if (checkCount >= maxChecks) {
              addDebugInfo("⏰ Timeout verificando video - continuando de todos modos")
              resolved = true
              cleanup()

              // Marcar como listo aunque no esté perfecto
              setVideoReady(true)
              setStreamActive(true)
              startDiagnostics()
              resolve()
              return
            }

            setTimeout(checkVideoReady, 200)
          }

          const onLoadedMetadata = () => {
            if (!mountedRef.current || resolved) return
            addDebugInfo(
              `📹 METADATA LOADED: ${video.videoWidth}x${video.videoHeight}, readyState: ${video.readyState}`,
            )
            setTimeout(checkVideoReady, 100)
          }

          const onCanPlay = () => {
            if (!mountedRef.current || resolved) return
            addDebugInfo("📹 CAN PLAY - video puede reproducirse")
            setStreamActive(true)
            setTimeout(checkVideoReady, 100)
          }

          const onPlaying = () => {
            if (!mountedRef.current || resolved) return
            addDebugInfo("📹 PLAYING - video está reproduciéndose")
            setStreamActive(true)
            setTimeout(checkVideoReady, 100)
          }

          const onLoadedData = () => {
            if (!mountedRef.current || resolved) return
            addDebugInfo("📹 LOADED DATA - datos del video cargados")
            setTimeout(checkVideoReady, 100)
          }

          const onError = (e: Event) => {
            if (resolved) return
            addDebugInfo(`❌ ERROR EN VIDEO: ${e}`)
            resolved = true
            cleanup()
            reject(new Error("Error cargando video"))
          }

          const cleanup = () => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata)
            video.removeEventListener("loadeddata", onLoadedData)
            video.removeEventListener("canplay", onCanPlay)
            video.removeEventListener("playing", onPlaying)
            video.removeEventListener("error", onError)
          }

          video.addEventListener("loadedmetadata", onLoadedMetadata)
          video.addEventListener("loadeddata", onLoadedData)
          video.addEventListener("canplay", onCanPlay)
          video.addEventListener("playing", onPlaying)
          video.addEventListener("error", onError)

          // Verificar estado actual
          addDebugInfo(
            `📹 Estado inicial: readyState=${video.readyState}, dimensions=${video.videoWidth}x${video.videoHeight}`,
          )

          if (video.readyState >= 1) {
            addDebugInfo("📹 Video ya tiene metadata")
            setTimeout(onLoadedMetadata, 100)
          }

          // Forzar reproducción con manejo detallado
          addDebugInfo("📹 Intentando reproducir video...")
          const playPromise = video.play()

          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                addDebugInfo("📹 Video.play() EXITOSO")
                setTimeout(checkVideoReady, 500)
              })
              .catch((playError) => {
                addDebugInfo(`❌ Error en video.play(): ${playError}`)
                addDebugInfo(`❌ Play error name: ${playError.name}`)
                addDebugInfo(`❌ Play error message: ${playError.message}`)
                // Continuar de todos modos
                setTimeout(checkVideoReady, 500)
              })
          } else {
            addDebugInfo("📹 video.play() no retornó Promise")
            setTimeout(checkVideoReady, 500)
          }
        })

        addDebugInfo("🎉 Cámara iniciada exitosamente")
        setRetryCount(0)
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

      setRetryCount((prev) => prev + 1)

      if (retryCount >= 2) {
        if (!forceLegacyMode) {
          addDebugInfo("🔄 Activando modo legacy")
          setForceLegacyMode(true)
          setTimeout(() => {
            startCamera()
          }, 1000)
        } else {
          addDebugInfo("🔄 Demasiados intentos, activando modo archivo")
          setUseFileInput(true)
          setError(
            "No se pudo acceder a la cámara después de varios intentos. Use el botón de archivo para subir una imagen.",
          )
        }
      } else if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
        setError("Permisos de cámara denegados. Por favor, permita el acceso a la cámara y recargue la página.")
      } else if (errorMessage.includes("NotFoundError") || errorMessage.includes("DevicesNotFoundError")) {
        setError("No se encontró ninguna cámara en el dispositivo.")
        setUseFileInput(true)
      } else if (errorMessage.includes("NotReadableError") || errorMessage.includes("TrackStartError")) {
        setError("La cámara está siendo usada por otra aplicación. Cierre otras apps que usen la cámara.")
      } else if (errorMessage.includes("Timeout")) {
        setError("Timeout iniciando cámara. La cámara puede estar bloqueada por el sistema.")
      } else {
        setError(`Error accediendo a la cámara: ${errorMessage}`)
      }

      setIsCapturing(false)
      console.error("Camera error:", err)
    }
  }, [
    addDebugInfo,
    cleanup,
    cameraFacing,
    retryCount,
    selectedCameraId,
    startDiagnostics,
    stopDiagnostics,
    forceLegacyMode,
  ])

  const stopCamera = useCallback(() => {
    addDebugInfo("🛑 Deteniendo cámara")
    stopDiagnostics()

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
        addDebugInfo(`🔇 Track detenido: ${track.kind}`)
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsCapturing(false)
    setVideoReady(false)
    setStreamActive(false)
  }, [addDebugInfo, stopDiagnostics])

  const switchCamera = useCallback(() => {
    addDebugInfo("🔄 Cambiando cámara")
    stopCamera()

    if (availableCameras.length > 1) {
      const currentIndex = availableCameras.findIndex((cam) => cam.deviceId === selectedCameraId)
      const nextIndex = (currentIndex + 1) % availableCameras.length
      setSelectedCameraId(availableCameras[nextIndex].deviceId)
      addDebugInfo(`📹 Cambiando a: ${availableCameras[nextIndex].label}`)
    } else {
      setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"))
      addDebugInfo(`📹 Cambiando facing mode a: ${cameraFacing === "environment" ? "user" : "environment"}`)
    }

    setTimeout(() => {
      startCamera()
    }, 1000)
  }, [stopCamera, startCamera, addDebugInfo, availableCameras, selectedCameraId, cameraFacing])

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      addDebugInfo(`📁 Archivo seleccionado: ${file.name} (${file.size} bytes)`)

      if (!file.type.startsWith("image/")) {
        setError("Por favor seleccione un archivo de imagen válido")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        addDebugInfo("✅ Imagen cargada desde archivo")
        setCapturedImages((prev) => ({
          ...prev,
          [currentStep]: imageUrl,
        }))
      }
      reader.onerror = () => {
        addDebugInfo("❌ Error leyendo archivo")
        setError("Error leyendo el archivo de imagen")
      }
      reader.readAsDataURL(file)
    },
    [currentStep, addDebugInfo],
  )

  const capturePhoto = useCallback(() => {
    addDebugInfo("📸 INICIANDO CAPTURA DE FOTO")

    if (!videoRef.current || !canvasRef.current) {
      addDebugInfo("❌ Elementos video/canvas no disponibles")
      setError("Error: elementos de captura no disponibles")
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

    // Diagnóstico exhaustivo antes de capturar
    addDebugInfo(`📸 ESTADO PRE-CAPTURA:`)
    addDebugInfo(`  - Video ready: ${videoReady}`)
    addDebugInfo(`  - Stream active: ${streamActive}`)
    addDebugInfo(`  - Video readyState: ${video.readyState}`)
    addDebugInfo(`  - Video dimensions: ${video.videoWidth}x${video.videoHeight}`)
    addDebugInfo(`  - Video element size: ${video.clientWidth}x${video.clientHeight}`)
    addDebugInfo(`  - Video currentTime: ${video.currentTime}`)
    addDebugInfo(`  - Video paused: ${video.paused}`)
    addDebugInfo(`  - Video ended: ${video.ended}`)
    addDebugInfo(`  - Video muted: ${video.muted}`)

    if (!videoReady || !streamActive) {
      addDebugInfo(`❌ Video no está listo: ready=${videoReady}, active=${streamActive}`)
      setError("Error: video no está listo para captura. Espere un momento.")
      return
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      addDebugInfo(`❌ Video sin dimensiones: ${video.videoWidth}x${video.videoHeight}`)
      setError("Error: video no tiene dimensiones válidas")
      return
    }

    if (video.paused || video.ended) {
      addDebugInfo(`❌ Video no está reproduciendo: paused=${video.paused}, ended=${video.ended}`)
      setError("Error: video no está reproduciendo")
      return
    }

    addDebugInfo(`📐 CAPTURANDO: ${video.videoWidth}x${video.videoHeight}`)

    try {
      // Configurar canvas
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      addDebugInfo(`📐 Canvas configurado: ${canvas.width}x${canvas.height}`)

      // Limpiar canvas
      context.clearRect(0, 0, canvas.width, canvas.height)

      // Configurar contexto
      context.save()

      // Aplicar transformaciones si es necesario
      if (cameraFacing === "user") {
        context.scale(-1, 1)
        context.translate(-canvas.width, 0)
        addDebugInfo("🔄 Aplicando transformación para cámara frontal")
      }

      // Dibujar el video en el canvas
      addDebugInfo("🎨 Dibujando video en canvas...")
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      context.restore()

      // Análisis exhaustivo de la imagen capturada
      addDebugInfo("🔍 ANALIZANDO IMAGEN CAPTURADA:")

      const imageData = context.getImageData(0, 0, Math.min(100, canvas.width), Math.min(100, canvas.height))
      const pixels = imageData.data

      let totalBrightness = 0
      let nonZeroPixels = 0
      let maxBrightness = 0
      let minBrightness = 255
      const colorChannels = { r: 0, g: 0, b: 0 }

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]
        const brightness = (r + g + b) / 3

        totalBrightness += brightness
        colorChannels.r += r
        colorChannels.g += g
        colorChannels.b += b

        if (brightness > 0) nonZeroPixels++
        if (brightness > maxBrightness) maxBrightness = brightness
        if (brightness < minBrightness) minBrightness = brightness
      }

      const pixelCount = pixels.length / 4
      const avgBrightness = totalBrightness / pixelCount
      const pixelRatio = nonZeroPixels / pixelCount
      const avgColors = {
        r: colorChannels.r / pixelCount,
        g: colorChannels.g / pixelCount,
        b: colorChannels.b / pixelCount,
      }

      addDebugInfo(`  - Brillo promedio: ${avgBrightness.toFixed(2)}`)
      addDebugInfo(`  - Brillo min/max: ${minBrightness}/${maxBrightness}`)
      addDebugInfo(`  - Píxeles no-cero: ${(pixelRatio * 100).toFixed(1)}%`)
      addDebugInfo(
        `  - Colores promedio: R=${avgColors.r.toFixed(1)}, G=${avgColors.g.toFixed(1)}, B=${avgColors.b.toFixed(1)}`,
      )

      // Verificaciones más estrictas
      if (avgBrightness < 5) {
        addDebugInfo("❌ IMAGEN MUY OSCURA - brillo promedio muy bajo")
        setError("La imagen capturada está muy oscura. Verifique la iluminación.")
        return
      }

      if (pixelRatio < 0.1) {
        addDebugInfo("❌ IMAGEN MAYORMENTE NEGRA - muy pocos píxeles con contenido")
        setError("La imagen capturada está mayormente en negro. Intente cambiar de cámara.")
        return
      }

      if (maxBrightness - minBrightness < 10) {
        addDebugInfo("❌ IMAGEN SIN CONTRASTE - diferencia de brillo muy baja")
        setError("La imagen capturada no tiene suficiente contraste.")
        return
      }

      // Si llegamos aquí, la imagen parece válida
      addDebugInfo("✅ IMAGEN VÁLIDA - procediendo a crear blob")

      canvas.toBlob(
        (blob) => {
          if (!mountedRef.current) return

          if (blob) {
            const imageUrl = URL.createObjectURL(blob)
            addDebugInfo(`✅ FOTO CAPTURADA EXITOSAMENTE:`)
            addDebugInfo(`  - Tamaño: ${blob.size} bytes`)
            addDebugInfo(`  - Brillo: ${avgBrightness.toFixed(2)}`)
            addDebugInfo(`  - Contraste: ${(maxBrightness - minBrightness).toFixed(1)}`)
            addDebugInfo(`  - URL: ${imageUrl.slice(0, 50)}...`)

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
        0.9,
      )
    } catch (captureError) {
      addDebugInfo(`❌ ERROR DURANTE CAPTURA: ${captureError}`)
      setError("Error capturando imagen")
    }
  }, [currentStep, stopCamera, addDebugInfo, videoReady, streamActive, cameraFacing])

  const processPlateImage = useCallback(async () => {
    if (!capturedImages.plate) return

    setIsProcessing(true)
    setError(null)
    setOcrStatus("Preparando imagen...")
    addDebugInfo(`🔍 Iniciando procesamiento OCR de placa con método: ${ocrMethod}`)

    try {
      setOcrStatus("Obteniendo imagen...")
      const response = await fetch(capturedImages.plate)
      const blob = await response.blob()

      addDebugInfo(`📤 Imagen obtenida: ${blob.size} bytes`)

      // Intentar OCR solo si no estamos en modo simulación
      if (!simulationMode) {
        setOcrStatus("Analizando placa con IA...")
        try {
          const ocrResult = await processPlate(blob)

          addDebugInfo(
            `✅ OCR completado con ${ocrResult.method}: ${ocrResult.text} (${Math.round(ocrResult.confidence * 100)}%)`,
          )

          // Si la confianza es buena, usar el resultado
          if (ocrResult.confidence >= 0.6 && ocrResult.text) {
            setPlateData({
              placa: ocrResult.text,
              imageUrl: capturedImages.plate,
              confidence: ocrResult.confidence,
            })
            setCurrentStep("vehicle")
            setOcrStatus("")
            setIsProcessing(false)
            return
          } else {
            addDebugInfo("⚠️ Confianza baja en OCR local, continuando sin reconocimiento")
          }
        } catch (ocrError) {
          addDebugInfo(`⚠️ Error en OCR local: ${ocrError}`)
        }
      } else {
        addDebugInfo("🎭 Modo simulación activado, saltando OCR")
      }

      // Si llegamos aquí, el OCR falló o estamos en modo simulación
      // Simplemente guardar la imagen y continuar sin reconocimiento
      setPlateData({
        placa: "", // Placa vacía para edición manual posterior
        imageUrl: capturedImages.plate,
        confidence: 0,
      })

      setCurrentStep("vehicle")
      setOcrStatus("")
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido"
      addDebugInfo(`💥 Error procesando imagen: ${errorMsg}`)

      // Fallback a guardar solo la imagen
      setPlateData({
        placa: "", // Placa vacía para edición manual posterior
        imageUrl: capturedImages.plate,
        confidence: 0,
      })

      setCurrentStep("vehicle")
      setOcrStatus("")
    } finally {
      setIsProcessing(false)
    }
  }, [capturedImages.plate, addDebugInfo, processPlate, ocrMethod, simulationMode])

  const processVehicleImage = useCallback(async () => {
    if (!capturedImages.vehicle || !plateData) return

    setIsProcessing(true)
    setCurrentStep("processing")
    setOcrStatus("Preparando análisis del vehículo...")
    addDebugInfo("🚗 INICIANDO procesamiento de imagen de vehículo")

    try {
      setOcrStatus("Obteniendo imagen del vehículo...")
      addDebugInfo(`📤 VEHICLE IMAGE URL: ${capturedImages.vehicle.slice(0, 100)}...`)

      const response = await fetch(capturedImages.vehicle)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()
      addDebugInfo(`✅ VEHICLE BLOB: size=${blob.size}, type=${blob.type}`)

      if (blob.size === 0) {
        throw new Error("Vehicle image blob is empty")
      }

      // Verificar que el blob es válido creando una URL temporal
      const testUrl = URL.createObjectURL(blob)
      addDebugInfo(`🔍 VEHICLE BLOB URL TEST: ${testUrl.slice(0, 50)}...`)

      // Limpiar la URL de prueba
      setTimeout(() => URL.revokeObjectURL(testUrl), 1000)

      // Resto del código...
      let vehicleResult = {
        marca: "",
        modelo: "",
        color: "",
        confidence: 0,
      }

      if (!simulationMode) {
        setOcrStatus("Analizando vehículo con IA...")
        try {
          vehicleResult = await processVehicle(blob)
          addDebugInfo(`✅ OCR vehículo completado: ${vehicleResult.marca} ${vehicleResult.modelo}`)
        } catch (ocrError) {
          addDebugInfo(`⚠️ Error en OCR de vehículo: ${ocrError}`)
        }
      }

      // Guardar resultado del vehículo
      setVehicleResult(vehicleResult)

      addDebugInfo(
        `🎯 PROCESAMIENTO COMPLETADO: placa=${plateData.placa}, vehículo=${vehicleResult.marca} ${vehicleResult.modelo}`,
      )

      // Cambiar a paso completado en lugar de llamar onVehicleDetected inmediatamente
      setCurrentStep("completed")
      setOcrStatus("")
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido"
      addDebugInfo(`💥 ERROR VEHICLE PROCESSING: ${errorMsg}`)

      // Fallback pero con logging del problema
      setVehicleResult({
        marca: "",
        modelo: "",
        color: "",
        confidence: 0,
      })

      addDebugInfo(`⚠️ PROCESAMIENTO COMPLETADO CON ERRORES`)

      // Cambiar a paso completado
      setCurrentStep("completed")
      setOcrStatus("")
    } finally {
      setIsProcessing(false)
    }
  }, [capturedImages.vehicle, plateData, addDebugInfo, processVehicle, simulationMode])

  const confirmAndRegister = useCallback(() => {
    if (!plateData || !vehicleResult) {
      addDebugInfo("❌ Datos incompletos para registro")
      return
    }

    const finalData = {
      placa: plateData.placa,
      marca: vehicleResult.marca,
      modelo: vehicleResult.modelo,
      color: vehicleResult.color,
      plateImageUrl: plateData.imageUrl,
      vehicleImageUrl: capturedImages.vehicle || "",
      plateConfidence: plateData.confidence,
      vehicleConfidence: vehicleResult.confidence,
    }

    addDebugInfo(
      `🎯 REGISTRANDO VEHÍCULO: placa=${finalData.placa}, vehicleUrl=${finalData.vehicleImageUrl ? "OK" : "MISSING"}`,
    )
    addDebugInfo("🏁 PROCESO FINALIZADO - enviando datos al formulario")

    onVehicleDetected(finalData)
  }, [plateData, vehicleResult, capturedImages.vehicle, onVehicleDetected, addDebugInfo])

  const retakePhoto = useCallback(() => {
    addDebugInfo("🔄 Retomando foto")
    setCapturedImages((prev) => ({ ...prev, [currentStep]: undefined }))
    setError(null)
    if (!useFileInput) {
      startCamera()
    }
  }, [currentStep, startCamera, addDebugInfo, useFileInput])

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
          description: "Analizando las imágenes con IA",
          icon: <Camera className="h-5 w-5" />,
          frameClass: "",
          frameLabel: "",
        }
      case "completed":
        return {
          title: "3. Proceso Completado",
          description: "Revise los resultados y confirme el registro",
          icon: <CheckCircle2 className="h-5 w-5" />,
          frameClass: "",
          frameLabel: "",
        }
    }
  }

  const stepInfo = getStepInfo()

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Panel principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              {stepInfo.icon}
              <span className="ml-2">{stepInfo.title}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogs(!showLogs)}
                className={showLogs ? "text-blue-600" : "text-gray-400"}
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
                <Settings className="h-4 w-4" />
              </Button>
              <div className="flex space-x-1">
                <Badge variant={currentStep === "plate" ? "default" : plateData ? "secondary" : "outline"}>1</Badge>
                <Badge
                  variant={currentStep === "vehicle" ? "default" : capturedImages.vehicle ? "secondary" : "outline"}
                >
                  2
                </Badge>
                <Badge variant={currentStep === "processing" || currentStep === "completed" ? "default" : "outline"}>
                  3
                </Badge>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Panel de configuración */}
          {showSettings && (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Método de OCR:</label>
                    <Select value={ocrMethod} onValueChange={(value: OCRMethod) => setOcrMethod(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automático (Recomendado)</SelectItem>
                        <SelectItem value="tesseract">Solo Tesseract.js</SelectItem>
                        <SelectItem value="python">Solo API Python</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {availableCameras.length > 1 && (
                    <div>
                      <label className="text-sm font-medium">Cámara:</label>
                      <Select value={selectedCameraId} onValueChange={setSelectedCameraId}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCameras.map((camera) => (
                            <SelectItem key={camera.deviceId} value={camera.deviceId}>
                              {camera.label || `Cámara ${camera.deviceId.slice(0, 8)}...`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useFileInput"
                      checked={useFileInput}
                      onChange={(e) => setUseFileInput(e.target.checked)}
                    />
                    <label htmlFor="useFileInput" className="text-sm">
                      Usar subida de archivos en lugar de cámara
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="forceLegacyMode"
                      checked={forceLegacyMode}
                      onChange={(e) => setForceLegacyMode(e.target.checked)}
                    />
                    <label htmlFor="forceLegacyMode" className="text-sm">
                      Modo legacy (más compatible)
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="simulationMode"
                      checked={simulationMode}
                      onChange={(e) => setSimulationMode(e.target.checked)}
                    />
                    <label htmlFor="simulationMode" className="text-sm">
                      Modo simulación (solo debug)
                    </label>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {retryCount > 0 && retryCount < 3 && !useFileInput && (
                  <div className="mt-2 space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setError(null)
                        startCamera()
                      }}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reintentar
                    </Button>
                    <Button size="sm" variant="outline" onClick={switchCamera}>
                      <Camera className="h-3 w-3 mr-1" />
                      Cambiar Cámara
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setUseFileInput(true)}>
                      <Smartphone className="h-3 w-3 mr-1" />
                      Usar Archivo
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {plateData && currentStep !== "plate" && plateData.placa && (
            <Alert>
              <AlertDescription>
                ✅ <strong>Placa detectada:</strong> {plateData.placa}
                {plateData.confidence > 0 && ` (${Math.round(plateData.confidence * 100)}% confianza)`}
              </AlertDescription>
            </Alert>
          )}

          {vehicleResult && currentStep === "completed" && (
            <Alert>
              <AlertDescription>
                ✅ <strong>Vehículo procesado:</strong> {vehicleResult.marca} {vehicleResult.modelo}{" "}
                {vehicleResult.color}
                {vehicleResult.confidence > 0 && ` (${Math.round(vehicleResult.confidence * 100)}% confianza)`}
              </AlertDescription>
            </Alert>
          )}

          {/* Paso 3: Procesando */}
          {currentStep === "processing" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
              </div>
              <p className="text-sm text-gray-600">Procesando imágenes...</p>
              {ocrStatus && <p className="text-xs text-blue-600">{ocrStatus}</p>}
              <p className="text-xs text-gray-500">Esto puede tomar unos segundos</p>
            </div>
          )}

          {/* Paso 3: Completado */}
          {currentStep === "completed" && (
            <div className="space-y-4">
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold text-green-700">¡Proceso Completado!</h3>
                  <p className="text-sm text-gray-600">Las imágenes han sido procesadas exitosamente</p>
                </div>
              </div>

              {/* Resumen de resultados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plateData && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Imagen de Placa</h4>
                    <img
                      src={plateData.imageUrl || "/placeholder.svg"}
                      alt="Placa capturada"
                      className="w-full h-32 object-cover rounded border"
                    />
                    <p className="text-sm">
                      <strong>Placa:</strong> {plateData.placa || "No detectada"}
                      {plateData.confidence > 0 && ` (${Math.round(plateData.confidence * 100)}%)`}
                    </p>
                  </div>
                )}

                {capturedImages.vehicle && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Imagen de Vehículo</h4>
                    <img
                      src={capturedImages.vehicle || "/placeholder.svg"}
                      alt="Vehículo capturado"
                      className="w-full h-32 object-cover rounded border"
                    />
                    {vehicleResult && (
                      <p className="text-sm">
                        <strong>Vehículo:</strong> {vehicleResult.marca} {vehicleResult.modelo} {vehicleResult.color}
                        {vehicleResult.confidence > 0 && ` (${Math.round(vehicleResult.confidence * 100)}%)`}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex space-x-2">
                <Button onClick={confirmAndRegister} className="flex-1" size="lg">
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar y Registrar
                </Button>
                <Button onClick={goBackToPlate} variant="outline" size="lg">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reiniciar
                </Button>
                <Button onClick={onCancel} variant="outline" size="lg">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Pasos 1 y 2: Captura */}
          {currentStep !== "processing" && currentStep !== "completed" && (
            <>
              {!isCapturing && !capturedImages[currentStep] && (
                <div className="text-center space-y-4">
                  <Camera className="h-16 w-16 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600">{stepInfo.description}</p>

                  {useFileInput ? (
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button onClick={() => fileInputRef.current?.click()} className="w-full" size="lg">
                        <Smartphone className="h-4 w-4 mr-2" />
                        Seleccionar Imagen
                      </Button>
                      <Button
                        onClick={() => {
                          setUseFileInput(false)
                          setError(null)
                        }}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        <Camera className="h-3 w-3 mr-2" />
                        Intentar Cámara Nuevamente
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button onClick={startCamera} className="w-full" size="lg">
                        <Camera className="h-4 w-4 mr-2" />
                        Abrir Cámara {forceLegacyMode ? "(Modo Legacy)" : ""}
                      </Button>
                      {availableCameras.length > 1 && (
                        <Button onClick={switchCamera} variant="outline" className="w-full" size="sm">
                          <RefreshCw className="h-3 w-3 mr-2" />
                          Cambiar Cámara
                        </Button>
                      )}
                      <Button onClick={() => setUseFileInput(true)} variant="outline" className="w-full" size="sm">
                        <Smartphone className="h-3 w-3 mr-2" />
                        Usar Archivo en su Lugar
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    {useFileInput
                      ? "Seleccione una imagen desde su galería o tome una foto"
                      : "Capture imágenes claras para mejor reconocimiento"}
                  </p>
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
                      style={{
                        maxHeight: "300px",
                        minHeight: "200px",
                        objectFit: "cover",
                      }}
                      onLoadedMetadata={() => {
                        addDebugInfo("📹 Video metadata loaded")
                      }}
                      onCanPlay={() => {
                        addDebugInfo("📹 Video can play")
                      }}
                      onPlaying={() => {
                        addDebugInfo("📹 Video is playing")
                      }}
                      onError={(e) => {
                        addDebugInfo(`❌ Video error: ${e}`)
                      }}
                    />

                    {/* Marco de guía */}
                    {stepInfo.frameClass && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div
                          className={`border-2 border-white border-dashed rounded-lg ${stepInfo.frameClass} flex items-center justify-center bg-black bg-opacity-20`}
                        >
                          <span className="text-white text-xs font-medium px-2 py-1 bg-black bg-opacity-50 rounded">
                            {stepInfo.frameLabel}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Indicadores de estado */}
                    <div className="absolute top-2 left-2 space-y-1">
                      <Badge variant={videoReady ? "default" : "secondary"} className="text-xs">
                        {videoReady ? "✅ Video" : "⏳ Video"}
                      </Badge>
                      <Badge variant={streamActive ? "default" : "secondary"} className="text-xs">
                        {streamActive ? "✅ Stream" : "⏳ Stream"}
                      </Badge>
                    </div>

                    {/* Botón de captura */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <Button
                        onClick={capturePhoto}
                        disabled={!videoReady || !streamActive}
                        size="lg"
                        className="rounded-full w-16 h-16 p-0"
                      >
                        <Camera className="h-6 w-6" />
                      </Button>
                    </div>

                    {/* Controles adicionales */}
                    <div className="absolute top-2 right-2 space-y-1">
                      <Button onClick={switchCamera} size="sm" variant="secondary">
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <Button onClick={stopCamera} size="sm" variant="secondary">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <canvas ref={canvasRef} className="hidden" />

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      {videoReady && streamActive
                        ? `Alinee ${currentStep === "plate" ? "la placa" : "el vehículo"} y presione el botón para capturar`
                        : "Preparando cámara..."}
                    </p>
                    {ocrStatus && <p className="text-xs text-blue-600 mt-1">{ocrStatus}</p>}
                  </div>
                </div>
              )}

              {capturedImages[currentStep] && (
                <div className="space-y-4">
                  <div className="text-center">
                    <img
                      src={capturedImages[currentStep] || "/placeholder.svg"}
                      alt={`${currentStep} capturada`}
                      className="max-w-full h-48 mx-auto object-contain rounded-lg border"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={currentStep === "plate" ? processPlateImage : processVehicleImage}
                      disabled={isProcessing}
                      className="flex-1"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Continuar
                        </>
                      )}
                    </Button>
                    <Button onClick={retakePhoto} variant="outline" size="lg">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Retomar
                    </Button>
                    {currentStep === "vehicle" && (
                      <Button onClick={goBackToPlate} variant="outline" size="lg">
                        <X className="h-4 w-4 mr-2" />
                        Volver
                      </Button>
                    )}
                  </div>

                  {ocrStatus && (
                    <div className="text-center">
                      <p className="text-sm text-blue-600">{ocrStatus}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Botón de cancelar */}
          {currentStep !== "completed" && (
            <div className="text-center pt-4">
              <Button onClick={onCancel} variant="ghost" size="sm">
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panel de logs en tiempo real */}
      {showLogs && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <Bug className="h-4 w-4 mr-2" />
                Logs del Sistema ({debugInfo.length})
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyLogsToClipboard}
                  disabled={debugInfo.length === 0}
                  className={copySuccess ? "text-green-600" : ""}
                >
                  {copySuccess ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="outline" onClick={clearDebugInfo} disabled={debugInfo.length === 0}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs max-h-64 overflow-y-auto">
              {debugInfo.length === 0 ? (
                <div className="text-gray-500">No hay logs disponibles</div>
              ) : (
                debugInfo.map((log, index) => (
                  <div key={index} className="mb-1 break-all">
                    {log}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
            {copySuccess && <p className="text-xs text-green-600 mt-2">✅ Logs copiados al portapapeles</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
