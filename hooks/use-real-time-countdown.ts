"use client"

import { useState, useEffect } from "react"

interface UseRealTimeCountdownProps {
  tiempoSalida: string
  tiempoSalidaEstimado?: string | null
  fechaPago: string
}

interface CountdownResult {
  displayText: string
  timeInQueue: number
  urgencyLevel: "normal" | "warning" | "urgent" | "critical"
  isOverdue: boolean
}

export function useRealTimeCountdown({
  tiempoSalida,
  tiempoSalidaEstimado,
  fechaPago,
}: UseRealTimeCountdownProps): CountdownResult {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000) // Actualizar cada segundo

    return () => clearInterval(interval)
  }, [])

  // Calcular el tiempo objetivo de salida
  const getTargetTime = () => {
    const paymentTime = new Date(fechaPago)

    if (tiempoSalida === "now") {
      return paymentTime
    }

    // Si hay tiempo estimado específico, usarlo
    if (tiempoSalidaEstimado) {
      return new Date(tiempoSalidaEstimado)
    }

    // Calcular basado en el tiempo seleccionado
    const minutesToAdd =
      {
        "5min": 5,
        "10min": 10,
        "15min": 15,
        "20min": 20,
        "30min": 30,
        "45min": 45,
        "60min": 60,
      }[tiempoSalida] || 0

    return new Date(paymentTime.getTime() + minutesToAdd * 60000)
  }

  const targetTime = getTargetTime()
  const paymentTime = new Date(fechaPago)

  // Calcular tiempo restante en minutos
  const timeRemaining = Math.ceil((targetTime.getTime() - currentTime.getTime()) / 60000)

  // Calcular tiempo en cola (desde el pago hasta ahora)
  const timeInQueue = Math.max(0, Math.floor((currentTime.getTime() - paymentTime.getTime()) / 60000))

  // Determinar nivel de urgencia
  const getUrgencyLevel = (): "normal" | "warning" | "urgent" | "critical" => {
    if (timeRemaining <= 0) return "critical"
    if (timeRemaining <= 2) return "urgent"
    if (timeRemaining <= 5) return "warning"
    return "normal"
  }

  // Generar texto de display
  const getDisplayText = (): string => {
    if (timeRemaining <= 0) {
      const overdue = Math.abs(timeRemaining)
      return `¡ATRASADO ${overdue} min!`
    }

    if (timeRemaining === 1) {
      return "Sale en 1 min"
    }

    return `Sale en ${timeRemaining} min`
  }

  return {
    displayText: getDisplayText(),
    timeInQueue,
    urgencyLevel: getUrgencyLevel(),
    isOverdue: timeRemaining <= 0,
  }
}
