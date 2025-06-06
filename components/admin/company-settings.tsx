"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Bank {
  _id: string
  code: string
  name: string
}

export default function AdminCompanySettings() {
  // Actualizar el estado inicial para incluir los nuevos campos
  const [settings, setSettings] = useState({
    pagoMovil: {
      banco: "",
      cedula: "",
      telefono: "",
    },
    transferencia: {
      banco: "",
      cedula: "",
      telefono: "",
      numeroCuenta: "",
    },
    tarifas: {
      precioHora: 3.0,
      tasaCambio: 35.0,
    },
  })

  // Estados para los valores de display (como texto)
  const [displayValues, setDisplayValues] = useState({
    precioHora: "3,00",
    tasaCambio: "35,00",
  })

  const [banks, setBanks] = useState<Bank[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    Promise.all([fetchSettings(), fetchBanks()])
      .then(() => setIsLoading(false))
      .catch((error) => {
        console.error("Error initializing:", error)
        setIsLoading(false)
      })
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/company-settings")
      if (response.ok) {
        const data = await response.json()
        // Remove _id if it exists to avoid sending it back
        const { _id, ...settingsWithoutId } = data
        setSettings(settingsWithoutId)

        // Actualizar los valores de display
        setDisplayValues({
          precioHora: formatNumberForDisplay(settingsWithoutId.tarifas.precioHora),
          tasaCambio: formatNumberForDisplay(settingsWithoutId.tarifas.tasaCambio),
        })
      }
    } catch (err) {
      console.error("Error fetching settings:", err)
    }
  }

  const fetchBanks = async () => {
    try {
      const response = await fetch("/api/banks")
      if (response.ok) {
        const data = await response.json()
        setBanks(data)
      }
    } catch (err) {
      console.error("Error fetching banks:", err)
    }
  }

  // Función para formatear número para mostrar (con coma decimal)
  const formatNumberForDisplay = (num: number): string => {
    return num.toFixed(2).replace(".", ",")
  }

  // Función para convertir texto a número (acepta punto y coma)
  const parseNumberFromText = (text: string): number => {
    // Reemplazar coma por punto para el parsing
    const normalizedText = text.replace(",", ".")
    const parsed = Number.parseFloat(normalizedText)
    return isNaN(parsed) ? 0 : Number.parseFloat(parsed.toFixed(2))
  }

  // Función para validar entrada de texto numérico
  const isValidNumberInput = (text: string): boolean => {
    // Permitir números, punto, coma y un solo separador decimal
    const regex = /^[0-9]*[,.]?[0-9]*$/
    return regex.test(text) && (text.match(/[,.]/g) || []).length <= 1
  }

  // Agregar función para actualizar las tarifas con manejo de texto
  const updateTarifas = (field: string, value: string) => {
    // Validar que la entrada sea válida
    if (!isValidNumberInput(value)) {
      return // No actualizar si la entrada no es válida
    }

    // Actualizar el valor de display
    setDisplayValues((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Convertir a número y actualizar el estado
    const numValue = parseNumberFromText(value)
    setSettings((prev) => ({
      ...prev,
      tarifas: { ...prev.tarifas, [field]: numValue },
    }))
  }

  // Función para manejar cuando el input pierde el foco (blur)
  const handleTarifaBlur = (field: string, value: string) => {
    const numValue = parseNumberFromText(value)
    const formattedValue = formatNumberForDisplay(numValue)

    // Actualizar el valor de display formateado
    setDisplayValues((prev) => ({
      ...prev,
      [field]: formattedValue,
    }))

    // Asegurar que el estado numérico esté actualizado
    setSettings((prev) => ({
      ...prev,
      tarifas: { ...prev.tarifas, [field]: numValue },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage("")

    try {
      // Make sure we don't send _id field
      // Actualizar el objeto settingsToSend en handleSubmit
      const settingsToSend = {
        pagoMovil: { ...settings.pagoMovil },
        transferencia: { ...settings.transferencia },
        tarifas: { ...settings.tarifas },
      }

      const response = await fetch("/api/admin/company-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsToSend),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al guardar la configuración")
      }

      const result = await response.json()
      setMessage(result.message || "Configuración guardada exitosamente")
      setTimeout(() => setMessage(""), 3000)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al guardar la configuración")
    } finally {
      setIsSaving(false)
    }
  }

  const updatePagoMovil = (field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      pagoMovil: { ...prev.pagoMovil, [field]: value },
    }))
  }

  const updateTransferencia = (field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      transferencia: { ...prev.transferencia, [field]: value },
    }))
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Opciones de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Cargando configuración...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Opciones de Pago de la Empresa</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {message && (
            <Alert variant={message.includes("Error") ? "destructive" : "default"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {/* Pago Móvil */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Pago Móvil</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pagoMovilBanco">Banco (Pago Móvil)</Label>
                <Select value={settings.pagoMovil.banco} onValueChange={(value) => updatePagoMovil("banco", value)}>
                  <SelectTrigger id="pagoMovilBanco">
                    <SelectValue placeholder="Seleccione un banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={`pm-${bank.code}`} value={bank.name}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pagoMovilCedula">Cédula o RIF (Pago Móvil)</Label>
                <Input
                  id="pagoMovilCedula"
                  value={settings.pagoMovil.cedula}
                  onChange={(e) => updatePagoMovil("cedula", e.target.value)}
                  placeholder="Ej. V-12345678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pagoMovilTelefono">Teléfono (Pago Móvil)</Label>
                <Input
                  id="pagoMovilTelefono"
                  value={settings.pagoMovil.telefono}
                  onChange={(e) => updatePagoMovil("telefono", e.target.value)}
                  placeholder="Ej. 0414-1234567"
                />
              </div>
            </div>
          </div>

          {/* Transferencia */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Transferencia Bancaria</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transferenciaBanco">Banco (Transferencia)</Label>
                <Select
                  value={settings.transferencia.banco}
                  onValueChange={(value) => updateTransferencia("banco", value)}
                >
                  <SelectTrigger id="transferenciaBanco">
                    <SelectValue placeholder="Seleccione un banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={`tr-${bank.code}`} value={bank.name}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transferenciaCedula">Cédula o RIF (Transferencia)</Label>
                <Input
                  id="transferenciaCedula"
                  value={settings.transferencia.cedula}
                  onChange={(e) => updateTransferencia("cedula", e.target.value)}
                  placeholder="Ej. J-12345678-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transferenciaTelefono">Teléfono (Transferencia)</Label>
                <Input
                  id="transferenciaTelefono"
                  value={settings.transferencia.telefono}
                  onChange={(e) => updateTransferencia("telefono", e.target.value)}
                  placeholder="Ej. 0212-1234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transferenciaCuenta">Número de Cuenta</Label>
                <Input
                  id="transferenciaCuenta"
                  value={settings.transferencia.numeroCuenta}
                  onChange={(e) => updateTransferencia("numeroCuenta", e.target.value)}
                  placeholder="Ej. 0102-0000-00-0000000000"
                />
              </div>
            </div>
          </div>

          {/* Sección de tarifas actualizada */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Configuración de Tarifas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precioHora">Precio por Hora (USD)</Label>
                <Input
                  id="precioHora"
                  type="text"
                  value={displayValues.precioHora}
                  onChange={(e) => updateTarifas("precioHora", e.target.value)}
                  onBlur={(e) => handleTarifaBlur("precioHora", e.target.value)}
                  placeholder="Ej. 3,00"
                />
                <p className="text-xs text-gray-500">
                  Tarifa base por hora de estacionamiento en dólares. Use coma (,) para decimales.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tasaCambio">Tasa de Cambio (Bs. por USD)</Label>
                <Input
                  id="tasaCambio"
                  type="text"
                  value={displayValues.tasaCambio}
                  onChange={(e) => updateTarifas("tasaCambio", e.target.value)}
                  onBlur={(e) => handleTarifaBlur("tasaCambio", e.target.value)}
                  placeholder="Ej. 35,20"
                />
                <p className="text-xs text-gray-500">
                  Tasa de conversión de dólares a bolívares. Use coma (,) para decimales.
                </p>
              </div>
            </div>

            {/* Vista previa de los valores */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Precio por hora:</span>
                  <span className="font-medium ml-2">${settings.tarifas.precioHora.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tasa de cambio:</span>
                  <span className="font-medium ml-2">{formatNumberForDisplay(settings.tarifas.tasaCambio)} Bs/USD</span>
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-lg" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
