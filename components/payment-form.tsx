"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, ArrowLeft, ArrowRight, RefreshCw, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Ticket, PaymentFormData, CompanySettings } from "@/lib/types";

// Updated interface to include montoBs and tasaCambio
interface TicketWithBs extends Ticket {
  montoBs?: number;
  tasaCambio?: number;
}

interface Bank {
  _id: string;
  code: string;
  name: string;
}

interface PaymentFormProps {
  ticket: TicketWithBs;
}

// Opciones de tiempo de salida
const exitTimeOptions = [
  { value: "now", label: "Ahora", minutes: 0 },
  { value: "5min", label: "En 5 minutos", minutes: 5 },
  { value: "10min", label: "En 10 minutos", minutes: 10 },
  { value: "15min", label: "En 15 minutos", minutes: 15 },
  { value: "20min", label: "En 20 minutos", minutes: 20 },
  { value: "30min", label: "En 30 minutos", minutes: 30 },
  { value: "45min", label: "En 45 minutos", minutes: 45 },
  { value: "60min", label: "En 1 hora", minutes: 60 },
];

export default function PaymentForm({ ticket }: PaymentFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentType, setPaymentType] = useState<"pago_movil" | "transferencia" | "efectivo_bs" | "efectivo_usd" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);

  // Calculate montoBs using ticket.tasaCambio, fallback to companySettings if unavailable
  const tasaCambio = ticket.tasaCambio || (companySettings?.tarifas?.tasaCambio || 1);
  const montoBs = ticket.montoBs || (ticket.montoCalculado * tasaCambio);
  const [formData, setFormData] = useState<PaymentFormData & { tiempoSalida?: string }>({
    referenciaTransferencia: "",
    banco: "",
    telefono: "",
    numeroIdentidad: "",
    montoPagado: montoBs,
    tiempoSalida: "now",
  });

  useEffect(() => {
    Promise.all([fetchCompanySettings(), fetchBanks()])
      .then(() => {
        setLoadingSettings(false);
        setLoadingBanks(false);
      })
      .catch((error) => {
        console.error("Error initializing:", error);
        setLoadingSettings(false);
        setLoadingBanks(false);
      });
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const response = await fetch("/api/company-settings");
      if (response.ok) {
        const data = await response.json();
        setCompanySettings(data);
      } else {
        console.error("Error fetching company settings");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await fetch("/api/banks");
      if (response.ok) {
        const data = await response.json();
        setBanks(data);
      } else {
        console.error("Error fetching banks");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "montoPagado" ? Number.parseFloat(value) || 0 : value,
    }));
    setError(null); // Clear error when user edits
  };

  const handleBankChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      banco: value,
    }));
    setError(null); // Clear error when user edits
  };

  const handleExitTimeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      tiempoSalida: value,
    }));
    setError(null); // Clear error when user edits
  };

  const getExitTimeLabel = (value: string) => {
    const option = exitTimeOptions.find((opt) => opt.value === value);
    return option ? option.label : "Ahora";
  };

  const getExitDateTime = (value: string) => {
    const option = exitTimeOptions.find((opt) => opt.value === value);
    if (!option) return new Date();

    const exitTime = new Date();
    exitTime.setMinutes(exitTime.getMinutes() + option.minutes);
    return exitTime;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/process-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigoTicket: ticket.codigoTicket,
          tipoPago: paymentType,
          ...formData,
          montoPagado: formData.montoPagado,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al procesar el pago");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el pago");
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep((prev) => prev - 1);
  };

  const validateStep = () => {
    if (currentStep === 1 && !paymentType) {
      return "Por favor, seleccione un método de pago.";
    }

    if (currentStep === 3 && (paymentType === "pago_movil" || paymentType === "transferencia")) {
      if (!formData.referenciaTransferencia.trim()) {
        return "La referencia de la transferencia es requerida.";
      }
      if (!formData.banco.trim()) {
        return "Seleccione un banco.";
      }
      if (!formData.telefono.trim()) {
        return "El teléfono es requerido.";
      }
      if (!formData.numeroIdentidad.trim()) {
        return "El número de identidad es requerido.";
      }
      if (formData.montoPagado <= 0) {
        return "El monto pagado debe ser mayor que cero.";
      }
      if (!formData.tiempoSalida) {
        return "Seleccione un tiempo de salida.";
      }
      // Validate montoPagado against ticket.montoCalculado (with tolerance)
      const expectedMontoBs = ticket.montoCalculado * tasaCambio;
      const tolerance = 0.01; // 1% tolerance
      if (Math.abs(formData.montoPagado - expectedMontoBs) > tolerance) {
        return "El monto pagado no coincide con el monto calculado.";
      }
    }

    if (currentStep === 4) {
      if (paymentType?.startsWith("efectivo")) {
        if (formData.montoPagado <= 0) {
          return "El monto pagado debe ser mayor que cero.";
        }
        // Allow overpayment for efectivo with a reasonable limit (e.g., 10% more)
        const expectedMontoBs = ticket.montoCalculado * tasaCambio;
        if (formData.montoPagado < expectedMontoBs || formData.montoPagado > expectedMontoBs * 1.1) {
          return "El monto pagado debe estar entre el monto calculado y un 10% más.";
        }
      }
    }

    return null;
  };

  const isFormValid = () => {
    return !validateStep();
  };

  if (success) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">¡Pago Registrado!</h2>
          <p className="text-lg text-gray-600 mb-4">
            {paymentType?.startsWith("efectivo")
              ? "Su solicitud de pago en efectivo ha sido registrada. Diríjase a la taquilla para completar el pago."
              : "El pago ha sido registrado y está Pendiente de Validación por el personal del estacionamiento."}
          </p>
          {formData.tiempoSalida && formData.tiempoSalida !== "now" && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-center space-x-2 text-blue-800">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Tiempo de salida programado: {getExitTimeLabel(formData.tiempoSalida)}</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Salida estimada:{" "}
                {getExitDateTime(formData.tiempoSalida).toLocaleTimeString("es-VE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
          <Button onClick={() => router.push("/")} className="w-full h-12 text-lg">
            Volver al Inicio
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isLoaded = !loadingSettings && !loadingBanks;

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <div className={`h-2 flex-1 rounded-l-full ${currentStep >= 1 ? "bg-primary" : "bg-gray-200"}`}></div>
            <div className={`h-2 flex-1 ${currentStep >= 2 ? "bg-primary" : "bg-gray-200"}`}></div>
            <div className={`h-2 flex-1 ${currentStep >= 3 ? "bg-primary" : "bg-gray-200"}`}></div>
            <div className={`h-2 flex-1 rounded-r-full ${currentStep >= 4 ? "bg-primary" : "bg-gray-200"}`}></div>
          </div>
          <p className="text-center text-sm text-gray-500">Paso {currentStep} de 4</p>
        </div>

        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-4">Seleccione Método de Pago</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Código de Ticket</p>
                  <p className="text-lg font-medium">{ticket.codigoTicket}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monto a Pagar</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(ticket.montoCalculado)}</p>
                  {ticket.montoBs && (
                    <p className="text-lg text-gray-600">
                      {formatCurrency(ticket.montoBs, "VES")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-center mb-4">Métodos de Pago Disponibles</h3>

              {/* Pago Móvil */}
              {companySettings?.pagoMovil?.banco && (
                <Button
                  onClick={() => {
                    setPaymentType("pago_movil");
                    nextStep();
                  }}
                  variant={paymentType === "pago_movil" ? "default" : "outline"}
                  className="w-full h-16 text-left justify-between"
                >
                  <div>
                    <div className="font-medium">Pago Móvil</div>
                    <div className="text-sm opacity-75">Transferencia instantánea</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {ticket.montoBs ? formatCurrency(ticket.montoBs, "VES") : formatCurrency(ticket.montoCalculado * tasaCambio, "VES")}
                    </div>
                  </div>
                </Button>
              )}

              {/* Transferencia Bancaria */}
              {companySettings?.transferencia?.banco && (
                <Button
                  onClick={() => {
                    setPaymentType("transferencia");
                    nextStep();
                  }}
                  variant={paymentType === "transferencia" ? "default" : "outline"}
                  className="w-full h-16 text-left justify-between"
                >
                  <div>
                    <div className="font-medium">Transferencia Bancaria</div>
                    <div className="text-sm opacity-75">Transferencia tradicional</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {ticket.montoBs ? formatCurrency(ticket.montoBs, "VES") : formatCurrency(ticket.montoCalculado * tasaCambio, "VES")}
                    </div>
                  </div>
                </Button>
              )}

              {/* Efectivo Bolívares */}
              <Button
                onClick={() => {
                  setPaymentType("efectivo_bs");
                  setFormData((prev) => ({ ...prev, montoPagado: ticket.montoBs || (ticket.montoCalculado * tasaCambio) }));
                  nextStep();
                }}
                variant={paymentType === "efectivo_bs" ? "default" : "outline"}
                className="w-full h-16 text-left justify-between"
              >
                <div>
                  <div className="font-medium">Efectivo (Bolívares)</div>
                  <div className="text-sm opacity-75">Pago en taquilla</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    {ticket.montoBs ? formatCurrency(ticket.montoBs, "VES") : formatCurrency(ticket.montoCalculado * tasaCambio, "VES")}
                  </div>
                  <div className="text-sm opacity-75">{formatCurrency(ticket.montoCalculado)}</div>
                </div>
              </Button>

              {/* Efectivo USD */}
              {companySettings?.tarifas?.tasaCambio && (
                <Button
                  onClick={() => {
                    setPaymentType("efectivo_usd");
                    setFormData((prev) => ({ ...prev, montoPagado: ticket.montoCalculado }));
                    nextStep();
                  }}
                  variant={paymentType === "efectivo_usd" ? "default" : "outline"}
                  className="w-full h-16 text-left justify-between"
                >
                  <div>
                    <div className="font-medium">Efectivo (USD)</div>
                    <div className="text-sm opacity-75">Pago en taquilla</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(ticket.montoCalculado)}</div>
                    {ticket.montoBs && (
                      <div className="text-sm opacity-75">{formatCurrency(ticket.montoBs, "VES")}</div>
                    )}
                  </div>
                </Button>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-4">Confirmación de Datos</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Código de Ticket</p>
                  <p className="text-lg font-medium">{ticket.codigoTicket}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monto a Pagar</p>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(ticket.montoCalculado)}</p>
                    {ticket.montoBs && (
                      <p className="text-lg font-medium text-green-500">
                        {formatCurrency(ticket.montoBs, "VES")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {!isLoaded ? (
              <div className="flex justify-center py-4">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-center">Información de Pago</h3>

                {companySettings && (
                  <>
                    {/* Sección de Pago Móvil */}
                    {(companySettings.pagoMovil.banco ||
                      companySettings.pagoMovil.cedula ||
                      companySettings.pagoMovil.telefono) && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700">Pago Móvil</h4>
                        {companySettings.pagoMovil.banco && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Banco:</span>
                            <span className="text-sm font-medium">{companySettings.pagoMovil.banco}</span>
                          </div>
                        )}
                        {companySettings.pagoMovil.cedula && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Cédula/RIF:</span>
                            <span className="text-sm font-medium">{companySettings.pagoMovil.cedula}</span>
                          </div>
                        )}
                        {companySettings.pagoMovil.telefono && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Teléfono:</span>
                            <span className="text-sm font-medium">{companySettings.pagoMovil.telefono}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sección de Transferencia */}
                    {(companySettings.transferencia.banco ||
                      companySettings.transferencia.cedula ||
                      companySettings.transferencia.telefono ||
                      companySettings.transferencia.numeroCuenta) && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700">Transferencia Bancaria</h4>
                        {companySettings.transferencia.banco && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Banco:</span>
                            <span className="text-sm font-medium">{companySettings.transferencia.banco}</span>
                          </div>
                        )}
                        {companySettings.transferencia.cedula && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Cédula/RIF:</span>
                            <span className="text-sm font-medium">{companySettings.transferencia.cedula}</span>
                          </div>
                        )}
                        {companySettings.transferencia.numeroCuenta && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Número de Cuenta:</span>
                            <span className="text-sm font-medium">{companySettings.transferencia.numeroCuenta}</span>
                          </div>
                        )}
                        {companySettings.transferencia.telefono && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Teléfono:</span>
                            <span className="text-sm font-medium">{companySettings.transferencia.telefono}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {!companySettings.pagoMovil.banco && !companySettings.transferencia.banco && (
                      <div className="text-center text-gray-500 py-2">
                        <p>No hay información de pago configurada</p>
                      </div>
                    )}
                  </>
                )}

                <div className="text-sm text-gray-500 text-center pt-2">
                  <p>
                    Realice su pago utilizando los datos bancarios proporcionados y luego registre los detalles de su
                    transferencia.
                  </p>
                </div>
              </div>
            )}

            <Button onClick={nextStep} className="w-full h-12 text-lg">
              Continuar al Pago <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4 text-center">Detalles de Transferencia</h2>

            <div className="space-y-4">
              {/* Selector de tiempo de salida */}
              <div className="space-y-2">
                <Label htmlFor="tiempoSalida" className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  ¿Cuándo planea salir?
                </Label>
                <Select value={formData.tiempoSalida} onValueChange={handleExitTimeChange}>
                  <SelectTrigger id="tiempoSalida" className="h-12 text-lg">
                    <SelectValue placeholder="Seleccione tiempo de salida" />
                  </SelectTrigger>
                  <SelectContent>
                    {exitTimeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Esta información ayudará al personal a gestionar mejor los espacios
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Monto a Pagar</p>
                <div className="text-center p-4 bg-green-50 rounded-lg mb-4">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(ticket.montoCalculado)}</p>
                  {ticket.montoBs && (
                    <p className="text-lg font-medium text-green-500">
                      {formatCurrency(ticket.montoBs, "VES")}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="referenciaTransferencia" className="text-sm font-medium">
                  Referencia de la Transferencia
                </label>
                <Input
                  id="referenciaTransferencia"
                  name="referenciaTransferencia"
                  value={formData.referenciaTransferencia}
                  onChange={handleChange}
                  className="h-12 text-lg"
                  placeholder="Ej. TR123456789"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="banco" className="text-sm font-medium">
                  Banco
                </label>
                <Select value={formData.banco} onValueChange={handleBankChange}>
                  <SelectTrigger id="banco" className="h-12 text-lg">
                    <SelectValue placeholder="Seleccione su banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank.code} value={bank.name}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="telefono" className="text-sm font-medium">
                  Teléfono
                </label>
                <Input
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="h-12 text-lg"
                  placeholder="Ej. 0414-1234567"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="numeroIdentidad" className="text-sm font-medium">
                  Número de Identidad
                </label>
                <Input
                  id="numeroIdentidad"
                  name="numeroIdentidad"
                  value={formData.numeroIdentidad}
                  onChange={handleChange}
                  className="h-12 text-lg"
                  placeholder="Ej. V-12345678"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="montoPagado" className="text-sm font-medium">
                  Monto a Pagar (Bs.)
                </label>
                <Input
                  id="montoPagado"
                  name="montoPagado"
                  type="number"
                  step="0.01"
                  value={formData.montoPagado}
                  onChange={handleChange}
                  className="h-12 text-lg"
                  placeholder="Ej. 36500000.00"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={prevStep} variant="outline" className="flex-1 h-12 text-lg">
                <ArrowLeft className="mr-2 h-5 w-5" /> Anterior
              </Button>
              <Button onClick={nextStep} className="flex-1 h-12 text-lg" disabled={!isFormValid()}>
                Siguiente <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <>
            {paymentType?.startsWith("efectivo") ? (
              <div className="space-y-6">
                <h2 className="text-xl font-bold mb-4 text-center">Pago en Efectivo</h2>
                <div className="bg-blue-50 p-6 rounded-lg text-center">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-lg font-semibold mb-2">Acérquese a la Taquilla</h3>
                  <p className="text-gray-600 mb-4">
                    Para completar su pago en efectivo, diríjase a la taquilla del estacionamiento.
                  </p>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Código de Ticket</p>
                    <p className="text-xl font-bold mb-3">{ticket.codigoTicket}</p>
                    <p className="text-sm text-gray-500 mb-1">Monto a Pagar</p>
                    {paymentType === "efectivo_bs" ? (
                      <div>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(formData.montoPagado, "VES")}</p>
                        <p className="text-lg text-gray-600">{formatCurrency(ticket.montoCalculado)}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(ticket.montoCalculado)}</p>
                        {ticket.montoBs && (
                          <p className="text-lg text-gray-600">{formatCurrency(ticket.montoBs, "VES")}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <Button onClick={handleSubmit} className="w-full h-12 text-lg" disabled={isLoading || !isFormValid()}>
                  {isLoading ? "Registrando..." : "Registrar Solicitud de Pago"}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-xl font-bold mb-4 text-center">Verificación de Pago</h2>
                <div className="bg-green-50 p-6 rounded-lg text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-lg font-semibold mb-2">Revise los Detalles de su Pago</h3>
                  <p className="text-gray-600 mb-4">
                    Por favor, verifique que la información ingresada sea correcta antes de proceder con el registro de
                    la solicitud de pago.
                  </p>
                  <div className="bg-white p-4 rounded-lg space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Código de Ticket</span>
                      <span className="text-sm font-medium">{ticket.codigoTicket}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Método de Pago</span>
                      <span className="text-sm font-medium">
                        {paymentType === "pago_movil" ? "Pago Móvil" : "Transferencia Bancaria"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Referencia</span>
                      <span className="text-sm font-medium">{formData.referenciaTransferencia}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Banco</span>
                      <span className="text-sm font-medium">{formData.banco}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Teléfono</span>
                      <span className="text-sm font-medium">{formData.telefono}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Número de Identidad</span>
                      <span className="text-sm font-medium">{formData.numeroIdentidad}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Monto Pagado (Bs.)</span>
                      <span className="text-sm font-medium">{formatCurrency(formData.montoPagado, "VES")}</span>
                    </div>
                    {formData.tiempoSalida && formData.tiempoSalida !== "now" && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Tiempo de Salida</span>
                        <span className="text-sm font-medium">{getExitTimeLabel(formData.tiempoSalida)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button onClick={handleSubmit} className="w-full h-12 text-lg" disabled={isLoading || !isFormValid()}>
                  {isLoading ? "Registrando..." : "Proceder con el Pago"}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}