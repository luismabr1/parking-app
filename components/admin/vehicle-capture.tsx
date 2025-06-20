"use client";

import type React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Camera,
  RotateCcw,
  Check,
  X,
  Car,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  Smartphone,
  Copy,
  CheckCircle2,
  FileText,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface VehicleData {
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  plateImageUrl: string;
  vehicleImageUrl: string;
  plateConfidence: number;
  vehicleConfidence: number;
}

interface VehicleCaptureProps {
  onVehicleDetected: (vehicleData: VehicleData) => void;
  onCancel: () => void;
}

type CaptureStep = "plate" | "vehicle" | "assign" | "completed";

export default function VehicleCapture({ onVehicleDetected, onCancel }: VehicleCaptureProps) {
  const [currentStep, setCurrentStep] = useState<CaptureStep>("plate");
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<{
    plate?: string;
    vehicle?: string;
  }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<{
    plateUrl?: string;
    vehicleUrl?: string;
  }>({});
  const [videoReady, setVideoReady] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [useFileInput, setUseFileInput] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [showLogs, setShowLogs] = useState(true);

  const [availableTickets, setAvailableTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string>("");
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false); // To prevent multiple startCamera calls

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current && showLogs) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [debugInfo, showLogs]);

  // Agregar debug info
  const addDebugInfo = useCallback((info: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp}: ${info}`;
    console.log("🔍 DEBUG:", logEntry);
    if (mountedRef.current) {
      setDebugInfo((prev) => [...prev.slice(-50), logEntry]);
    }
  }, []);

  // Limpiar logs manualmente
  const clearDebugInfo = useCallback(() => {
    setDebugInfo([]);
    addDebugInfo("🧹 Logs limpiados manualmente");
  }, [addDebugInfo]);

  // Función para copiar logs al portapapeles
  const copyLogsToClipboard = useCallback(() => {
    const logText = debugInfo.join("\n");
    navigator.clipboard
      .writeText(logText)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        addDebugInfo("📋 Logs copiados al portapapeles");
      })
      .catch((err) => {
        addDebugInfo(`❌ Error copiando logs: ${err}`);
      });
  }, [debugInfo, addDebugInfo]);

  // Cleanup al desmontar
  useEffect(() => {
    mountedRef.current = true;
    addDebugInfo("🚀 Iniciando VehicleCapture simplificado");
    return () => {
      mountedRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [addDebugInfo]);

  // Detectar cámaras disponibles
  useEffect(() => {
    const detectCameras = async () => {
      try {
        addDebugInfo("🔍 Detectando cámaras disponibles...");
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === "videoinput");
        setAvailableCameras(videoDevices);
        addDebugInfo(`📹 ${videoDevices.length} cámaras detectadas: ${videoDevices.map(d => d.label).join(", ")}`);

        // Seleccionar cámara trasera por defecto
        const backCamera = videoDevices.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("rear") ||
            device.label.toLowerCase().includes("environment"),
        );

        if (backCamera) {
          setSelectedCameraId(backCamera.deviceId);
          addDebugInfo(`✅ Cámara trasera seleccionada: ${backCamera.label}`);
        } else if (videoDevices.length > 0) {
          setSelectedCameraId(videoDevices[0].deviceId);
          addDebugInfo(`✅ Primera cámara seleccionada: ${videoDevices[0].label}`);
        } else {
          addDebugInfo("⚠️ No se detectaron cámaras, activando modo archivo");
          setUseFileInput(true);
          setError("No se detectó ninguna cámara. Use el botón de archivo.");
        }
      } catch (err) {
        addDebugInfo(`❌ Error detectando cámaras: ${err}`);
        setUseFileInput(true);
        setError("Error detectando cámaras. Use el botón de archivo.");
      }
    };

    detectCameras();
  }, [addDebugInfo]);

  // Cargar tickets disponibles
  useEffect(() => {
    const fetchAvailableTickets = async () => {
      try {
        const response = await fetch("/api/admin/available-tickets");
        if (response.ok) {
          const tickets = await response.json();
          setAvailableTickets(tickets);
          addDebugInfo(`📋 ${tickets.length} tickets disponibles cargados`);
        }
      } catch (err) {
        addDebugInfo(`❌ Error cargando tickets: ${err}`);
      }
    };

    fetchAvailableTickets();
  }, [addDebugInfo]);

  const startCamera = useCallback(async () => {
    if (!mountedRef.current || hasInitialized.current) return;

    try {
      setError(null);
      setVideoReady(false);
      setStreamActive(false);
      addDebugInfo(`🎬 Iniciando cámara`);

      // Limpiar stream anterior
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const constraints = {
        video: selectedCameraId
          ? { deviceId: selectedCameraId, width: { ideal: 640 }, height: { ideal: 480 } }
          : { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      };

      addDebugInfo(`📐 Usando constraint: ${JSON.stringify(constraints)}`);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      addDebugInfo("✅ Stream obtenido exitosamente");

      if (!videoRef.current || !mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        setError("Error: elemento de video no disponible");
        return;
      }

      const video = videoRef.current;
      video.srcObject = stream;
      streamRef.current = stream;

      video.onloadedmetadata = () => {
        addDebugInfo("📹 Video metadata cargada");
        setVideoReady(true);
      };

      video.oncanplay = () => {
        addDebugInfo("📹 Video listo para reproducir");
        setStreamActive(true);
      };

      video.onerror = () => {
        addDebugInfo("❌ Error en video element");
        setError("Error en el elemento de video");
      };

      await video.play();
      addDebugInfo("🎉 Cámara iniciada exitosamente");
      setIsCapturing(true);
      hasInitialized.current = true; // Mark as initialized
    } catch (err) {
      if (!mountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      addDebugInfo(`💥 Error: ${errorMessage}`);

      setError(`Error accediendo a la cámara: ${errorMessage}`);
      setIsCapturing(false);
    }
  }, [addDebugInfo, selectedCameraId]);

  const stopCamera = useCallback(() => {
    addDebugInfo("🛑 Deteniendo cámara");

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCapturing(false);
    setVideoReady(false);
    setStreamActive(false);
    hasInitialized.current = false; // Allow reinitialization
  }, [addDebugInfo]);

  const switchCamera = useCallback(() => {
    addDebugInfo("🔄 Cambiando cámara");
    stopCamera();

    if (availableCameras.length > 1) {
      const currentIndex = availableCameras.findIndex((cam) => cam.deviceId === selectedCameraId);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      setSelectedCameraId(availableCameras[nextIndex].deviceId);
      addDebugInfo(`📹 Cambiando a: ${availableCameras[nextIndex].label}`);
    }

    setTimeout(() => {
      startCamera();
    }, 1000);
  }, [stopCamera, startCamera, addDebugInfo, availableCameras, selectedCameraId]);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      addDebugInfo(`📁 Archivo seleccionado: ${file.name} (${file.size} bytes)`);

      if (!file.type.startsWith("image/")) {
        setError("Por favor seleccione un archivo de imagen válido");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        addDebugInfo("✅ Imagen cargada desde archivo");
        setCapturedImages((prev) => ({
          ...prev,
          [currentStep]: imageUrl,
        }));
      };
      reader.onerror = () => {
        addDebugInfo("❌ Error leyendo archivo");
        setError("Error leyendo el archivo de imagen");
      };
      reader.readAsDataURL(file);
    },
    [currentStep, addDebugInfo],
  );

  const capturePhoto = useCallback(() => {
    addDebugInfo("📸 Capturando foto");

    if (!videoRef.current || !canvasRef.current) {
      setError("Error: elementos de captura no disponibles");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      setError("Error: no se pudo obtener contexto de canvas");
      return;
    }

    if (!videoReady || !streamActive) {
      setError("Error: video no está listo para captura");
      return;
    }

    // Configurar canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!mountedRef.current || !blob) return;

        const imageUrl = URL.createObjectURL(blob);
        addDebugInfo(`✅ Foto capturada: ${blob.size} bytes`);

        setCapturedImages((prev) => ({
          ...prev,
          [currentStep]: imageUrl,
        }));
        stopCamera();
      },
      "image/jpeg",
      0.9,
    );
  }, [currentStep, stopCamera, addDebugInfo, videoReady, streamActive]);

  // Subir imagen a Cloudinary
  const uploadToCloudinary = useCallback(
    async (imageUrl: string, type: "plate" | "vehicle") => {
      try {
        addDebugInfo(`📤 Subiendo imagen ${type} a Cloudinary...`);

        const response = await fetch(imageUrl);
        const blob = await response.blob();

        const formData = new FormData();
        formData.append("image", blob);
        formData.append("type", type);

        const uploadResponse = await fetch("/api/admin/process-vehicle", {
          method: "POST",
          body: formData,
        });

        const result = await uploadResponse.json();

        if (result.success) {
          addDebugInfo(`✅ Imagen ${type} subida: ${result.imageUrl}`);
          return result.imageUrl;
        } else {
          throw new Error(result.message || "Error subiendo imagen");
        }
      } catch (err) {
        addDebugInfo(`❌ Error subiendo ${type}: ${err}`);
        throw err;
      }
    },
    [addDebugInfo],
  );

  const processImage = useCallback(async () => {
    if (!capturedImages[currentStep]) return;

    setIsUploading(true);
    setError(null);

    try {
      const imageUrl = await uploadToCloudinary(capturedImages[currentStep]!, currentStep);

      setUploadedUrls((prev) => ({
        ...prev,
        [currentStep === "plate" ? "plateUrl" : "vehicleUrl"]: imageUrl,
      }));

      if (currentStep === "plate") {
        setCurrentStep("vehicle");
        addDebugInfo("✅ Placa procesada, continuando con vehículo");
      } else {
        setCurrentStep("assign");
        addDebugInfo("✅ Vehículo procesado, continuando con asignación");
      }
    } catch (err) {
      setError("Error subiendo imagen. Intente nuevamente.");
    } finally {
      setIsUploading(false);
    }
  }, [capturedImages, currentStep, uploadToCloudinary, addDebugInfo]);

  const confirmAndRegister = useCallback(() => {
    const finalData = {
      placa: "",
      marca: "",
      modelo: "",
      color: "",
      plateImageUrl: uploadedUrls.plateUrl || "",
      vehicleImageUrl: uploadedUrls.vehicleUrl || "",
      plateConfidence: 0,
      vehicleConfidence: 0,
    };

    addDebugInfo("🎯 Proceso completado - volviendo al formulario principal");
    onVehicleDetected(finalData);
  }, [uploadedUrls, onVehicleDetected, addDebugInfo]);

  const retakePhoto = useCallback(() => {
    addDebugInfo("🔄 Retomando foto");
    setCapturedImages((prev) => ({ ...prev, [currentStep]: undefined }));
    setError(null);
    if (!useFileInput) {
      startCamera();
    }
  }, [currentStep, startCamera, addDebugInfo, useFileInput]);

  const goBackToPlate = useCallback(() => {
    addDebugInfo("⬅️ Volviendo a captura de placa");
    setCurrentStep("plate");
    setCapturedImages({});
    setUploadedUrls({});
    setError(null);
  }, [addDebugInfo]);

  const getStepInfo = () => {
    switch (currentStep) {
      case "plate":
        return {
          title: "1. Capturar Placa",
          description: "Tome una foto de la placa del vehículo",
          icon: <CreditCard className="h-5 w-5" />,
          frameClass: "", // Remove frame for plate
          frameLabel: "",
        };
      case "vehicle":
        return {
          title: "2. Capturar Vehículo",
          description: "Tome una foto completa del vehículo",
          icon: <Car className="h-5 w-5" />,
          frameClass: "", // Remove frame for vehicle
          frameLabel: "",
        };
      case "assign":
        return {
          title: "3. Asignar Puesto",
          description: "Seleccione el puesto de estacionamiento",
          icon: <Car className="h-5 w-5" />,
          frameClass: "",
          frameLabel: "",
        };
      case "completed":
        return {
          title: "4. Registro Completado",
          description: "Vehículo registrado exitosamente",
          icon: <CheckCircle2 className="h-5 w-5" />,
          frameClass: "",
          frameLabel: "",
        };
    }
  };

  const stepInfo = getStepInfo();

  const createParkingRecord = useCallback(async () => {
    if (!uploadedUrls.plateUrl || !uploadedUrls.vehicleUrl || !selectedTicket) {
      addDebugInfo("❌ Datos incompletos para crear registro");
      return;
    }

    setIsCreatingRecord(true);
    setError(null);

    try {
      addDebugInfo("🚗 Creando registro de estacionamiento...");

      const recordData = {
        placa: "PENDIENTE",
        marca: "Por definir",
        modelo: "Por definir",
        color: "Por definir",
        nombreDueño: "Por definir",
        telefono: "Por definir",
        ticketAsociado: selectedTicket,
        imagenes: {
          plateImageUrl: uploadedUrls.plateUrl,
          vehicleImageUrl: uploadedUrls.vehicleUrl,
          fechaCaptura: new Date(),
          capturaMetodo: "camara_movil",
          confianzaPlaca: 0,
          confianzaVehiculo: 0,
        },
      };

      const response = await fetch("/api/admin/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recordData),
      });

      const result = await response.json();

      if (response.ok) {
        addDebugInfo("✅ Registro creado exitosamente");
        setCurrentStep("completed");
      } else {
        throw new Error(result.message || "Error creando registro");
      }
    } catch (err) {
      addDebugInfo(`❌ Error creando registro: ${err}`);
      setError("Error creando el registro. Intente nuevamente.");
    } finally {
      setIsCreatingRecord(false);
    }
  }, [uploadedUrls, selectedTicket, addDebugInfo]);

  // Iniciar cámara automáticamente cuando el videoRef esté listo
  useEffect(() => {
    addDebugInfo(`📣 useEffect chequeo: videoRef=${!!videoRef.current}, isCapturing=${isCapturing}, streamActive=${streamActive}`);
    if (videoRef.current && !isCapturing && !streamActive && !useFileInput && !hasInitialized.current) {
      addDebugInfo("🎬 Iniciando cámara automáticamente desde useEffect");
      startCamera();
    }
  }, [videoRef, isCapturing, streamActive, startCamera, useFileInput]);

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
              <div className="flex space-x-1">
                <Badge variant={currentStep === "plate" ? "default" : uploadedUrls.plateUrl ? "secondary" : "outline"}>
                  1
                </Badge>
                <Badge
                  variant={currentStep === "vehicle" ? "default" : uploadedUrls.vehicleUrl ? "secondary" : "outline"}
                >
                  2
                </Badge>
                <Badge variant={currentStep === "assign" ? "default" : selectedTicket ? "secondary" : "outline"}>
                  3
                </Badge>
                <Badge variant={currentStep === "completed" ? "default" : "outline"}>4</Badge>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <div className="mt-2 space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setError(null);
                      startCamera();
                    }}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reintentar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setUseFileInput(true)}>
                    <Smartphone className="h-3 w-3 mr-1" />
                    Usar Archivo
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {uploadedUrls.plateUrl && currentStep !== "plate" && (
            <Alert>
              <AlertDescription>
                ✅ <strong>Placa guardada exitosamente</strong>
              </AlertDescription>
            </Alert>
          )}

          {uploadedUrls.vehicleUrl && currentStep === "completed" && (
            <Alert>
              <AlertDescription>
                ✅ <strong>Vehículo guardada exitosamente</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Paso 3: Completado */}
          {currentStep === "completed" && (
            <div className="space-y-4">
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold text-green-700">¡Imágenes Guardadas!</h3>
                  <p className="text-sm text-gray-600">Las fotos han sido subidas a Cloudinary exitosamente</p>
                </div>
              </div>

              {/* Resumen de resultados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uploadedUrls.plateUrl && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Imagen de Placa</h4>
                    <img
                      src={uploadedUrls.plateUrl || "/placeholder.svg"}
                      alt="Placa guardada"
                      className="w-full h-32 object-cover rounded border"
                    />
                    <p className="text-xs text-gray-500 break-all">{uploadedUrls.plateUrl}</p>
                  </div>
                )}

                {uploadedUrls.vehicleUrl && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Imagen de Vehículo</h4>
                    <img
                      src={uploadedUrls.vehicleUrl || "/placeholder.svg"}
                      alt="Vehículo guardada"
                      className="w-full h-32 object-cover rounded border"
                    />
                    <p className="text-xs text-gray-500 break-all">{uploadedUrls.vehicleUrl}</p>
                  </div>
                )}
              </div>

              {/* Botones de acción en vertical */}
              <div className="space-y-2">
                <Button onClick={confirmAndRegister} className="w-full" size="lg">
                  <Check className="h-4 w-4 mr-2" />
                  Continuar con Registro
                </Button>
                <Button onClick={goBackToPlate} variant="outline" className="w-full" size="lg">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reiniciar
                </Button>
                <Button onClick={onCancel} variant="outline" className="w-full" size="lg">
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Paso 3: Asignar Puesto */}
          {currentStep === "assign" && (
            <div className="space-y-4">
              <div className="text-center space-y-4">
                <Car className="h-16 w-16 mx-auto text-blue-500" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-700">Asignar Puesto de Estacionamiento</h3>
                  <p className="text-sm text-gray-600">Seleccione el ticket/puesto donde se estacionará el vehículo</p>
                </div>
              </div>

              {/* Selector de ticket */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Puesto de Estacionamiento:</label>
                <select
                  value={selectedTicket}
                  onChange={(e) => setSelectedTicket(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">Seleccione un puesto disponible</option>
                  {availableTickets.map((ticket) => (
                    <option key={ticket._id} value={ticket.codigoTicket}>
                      {ticket.codigoTicket}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">{availableTickets.length} puestos disponibles</p>
              </div>

              {/* Resumen de imágenes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Placa</h4>
                  <img
                    src={uploadedUrls.plateUrl || "/placeholder.svg"}
                    alt="Placa"
                    className="w-full h-20 object-cover rounded border"
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Vehículo</h4>
                  <img
                    src={uploadedUrls.vehicleUrl || "/placeholder.svg"}
                    alt="Vehículo"
                    className="w-full h-20 object-cover rounded border"
                  />
                </div>
              </div>

              {/* Botones de acción en vertical */}
              <div className="space-y-2">
                <Button
                  onClick={createParkingRecord}
                  disabled={!selectedTicket || isCreatingRecord}
                  className="w-full"
                  size="lg"
                >
                  {isCreatingRecord ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creando Registro...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Confirmar Estacionamiento
                    </>
                  )}
                </Button>
                <Button onClick={goBackToPlate} variant="outline" className="w-full" size="lg">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reiniciar Proceso
                </Button>
                <Button onClick={onCancel} variant="outline" className="w-full" size="lg">
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Pasos 1 y 2: Captura */}
          {currentStep !== "completed" && currentStep !== "assign" && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full rounded-lg bg-black ${isCapturing ? "" : "hidden"}`}
                style={{ height: "250px", objectFit: "cover" }}
                onLoadedData={() => addDebugInfo("🎥 Video element loaded into DOM")}
              />
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
                          setUseFileInput(false);
                          setError(null);
                          startCamera();
                        }}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        <Camera className="h-3 w-3 mr-2" />
                        Usar Cámara
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button onClick={startCamera} className="w-full" size="lg">
                        <Camera className="h-4 w-4 mr-2" />
                        Abrir Cámara
                      </Button>
                      {availableCameras.length > 1 && (
                        <Button onClick={switchCamera} variant="outline" className="w-full" size="sm">
                          <RefreshCw className="h-3 w-3 mr-2" />
                          Cambiar Cámara
                        </Button>
                      )}
                      <Button onClick={() => setUseFileInput(true)} variant="outline" className="w-full" size="sm">
                        <Smartphone className="h-3 w-3 mr-2" />
                        Usar Archivo
                      </Button>
                    </div>
                  )}
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
                      style={{ height: "250px", objectFit: "cover" }}
                    />

                    {/* Indicadores de estado */}
                    <div className="absolute top-2 left-2 space-y-1">
                      <Badge variant={videoReady ? "default" : "secondary"} className="text-xs">
                        {videoReady ? "✅ Video" : "⏳ Video"}
                      </Badge>
                      <Badge variant={streamActive ? "default" : "secondary"} className="text-xs">
                        {streamActive ? "✅ Stream" : "⏳ Stream"}
                      </Badge>
                    </div>

                    {/* Controles en la esquina */}
                    <div className="absolute top-2 right-2 space-y-1">
                      <Button onClick={switchCamera} size="sm" variant="secondary">
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <Button onClick={stopCamera} size="sm" variant="secondary">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Botones principales debajo del video */}
                  <div className="flex space-x-2">
                    <Button onClick={capturePhoto} disabled={!videoReady || !streamActive} className="flex-1" size="lg">
                      <Camera className="h-4 w-4 mr-2" />
                      {videoReady && streamActive ? "Capturar Foto" : "Esperando..."}
                    </Button>
                    <Button onClick={() => setUseFileInput(true)} variant="outline" size="lg">
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>

                  <canvas ref={canvasRef} className="hidden" />

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      {videoReady && streamActive
                        ? `Alinee ${currentStep === "plate" ? "la placa" : "el vehículo"} y presione capturar`
                        : "Preparando cámara..."}
                    </p>
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
                    <Button onClick={processImage} disabled={isUploading} className="flex-1" size="lg">
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Guardar y Continuar
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
                </div>
              )}
            </>
          )}

          {/* Botón de cancelar */}
          {currentStep !== "completed" && currentStep !== "assign" && (
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
                <FileText className="h-4 w-4 mr-2" />
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
  );
}