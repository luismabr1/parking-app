"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TicketSearch() {
  const [ticketCode, setTicketCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!ticketCode.trim()) {
      setError("Por favor ingresa un código de ticket")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const cleanTicketCode = ticketCode.trim().toUpperCase()
      console.log(`🔍 Búsqueda: Verificando ticket ${cleanTicketCode}`)

      // Usar directamente la ruta del ticket para verificar si existe
      const response = await fetch(`/api/ticket/${cleanTicketCode}`)

      if (response.ok) {
        const ticket = await response.json()
        console.log(`✅ Búsqueda: Ticket encontrado, redirigiendo a: /ticket/${ticket.codigoTicket}`)
        // Redirigir a la página de detalles del ticket
        router.push(`/ticket/${ticket.codigoTicket}`)
      } else {
        const errorData = await response.json()
        console.log(`❌ Búsqueda: Error para ${cleanTicketCode}:`, errorData)
        setError(errorData.message || "Error al buscar el ticket")
      }
    } catch (err) {
      console.error("❌ Búsqueda: Error de conexión:", err)
      setError("Error de conexión. Por favor intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Buscar Ticket</CardTitle>
        <p className="text-gray-600">Ingresa tu código de ticket para ver los detalles de pago</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="ticketCode" className="text-sm font-medium">
              Código de Ticket
            </label>
            <Input
              id="ticketCode"
              type="text"
              placeholder="Ej. PARK001, TEST001"
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value)}
              className="text-center text-lg font-mono"
              disabled={isLoading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading || !ticketCode.trim()}>
            <Search className="mr-2 h-5 w-5" />
            {isLoading ? "Buscando..." : "Buscar Ticket"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Códigos de ejemplo para pruebas:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {["TEST001", "TEST002", "ABC123", "XYZ789", "PARK001"].map((code) => (
              <button
                key={code}
                onClick={() => setTicketCode(code)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded font-mono"
                disabled={isLoading}
              >
                {code}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">PARK001 ahora tiene un carro asignado y debería funcionar</p>
        </div>
      </CardContent>
    </Card>
  )
}
