"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TicketSearch() {
  const router = useRouter()
  const [ticketCode, setTicketCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!ticketCode.trim()) {
      setError("Por favor ingrese un código de ticket")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/ticket-details?code=${encodeURIComponent(ticketCode)}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al buscar el ticket")
      }

      // Redirect to ticket details page
      router.push(`/ticket/${ticketCode}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar el ticket")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              id="ticketCode"
              placeholder="Código de ticket (ej. XYZ123)"
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value)}
              className="h-12 text-lg"
              disabled={isLoading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
            {isLoading ? "Buscando..." : "Buscar Ticket"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
