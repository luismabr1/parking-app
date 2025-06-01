"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminCompanySettings() {
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
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/company-settings")
      if (response.ok) {
        const data = await response.json()
        // Remove _id if it exists to avoid sending it back
        const { _id, ...settingsWithoutId } = data
        setSettings(settingsWithoutId)
      }
    } catch (err) {
      console.error("Error fetching settings:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage("")

    try {
      // Make sure we don't send _id field
      const settingsToSend = {
        pagoMovil: { ...settings.pagoMovil },
        transferencia: { ...settings.transferencia },
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
                <Input
                  id="pagoMovilBanco"
                  value={settings.pagoMovil.banco}
                  onChange={(e) => updatePagoMovil("banco", e.target.value)}
                  placeholder="Ej. Banco de Venezuela"
                />
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
                <Input
                  id="transferenciaBanco"
                  value={settings.transferencia.banco}
                  onChange={(e) => updateTransferencia("banco", e.target.value)}
                  placeholder="Ej. Banco Nacional"
                />
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

          <Button type="submit" className="w-full h-12 text-lg" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
