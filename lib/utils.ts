import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatSafeDate, isNightTime } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Actualizar la función formatCurrency para soportar bolívares
export function formatCurrency(amount: number, currency = "USD"): string {
  try {
    // Verificar si el amount es un número válido
    if (typeof amount !== "number" || isNaN(amount)) {
      return currency === "USD" ? "$0.00" : "Bs. 0,00"
    }

    if (currency === "VES" || currency === "BS") {
      return new Intl.NumberFormat("es-VE", {
        style: "currency",
        currency: "VES",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    }

    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch (error) {
    console.error("Error formatting currency:", error)
    return currency === "USD" ? `$${amount.toFixed(2)}` : `Bs. ${amount.toFixed(2)}`
  }
}

export function formatDateTime(date: any): string {
  return formatSafeDate(date)
}

// Actualizar la función calculateParkingFee para manejar tarifas diurnas y nocturnas
export async function calculateParkingFee(entryTime: Date | string): Promise<{ usd: number; bs: number }> {
  try {
    const entryDate = typeof entryTime === "string" ? new Date(entryTime) : entryTime

    if (!entryDate || isNaN(entryDate.getTime())) {
      console.error("Invalid entry time:", entryTime)
      return { usd: 1.5, bs: 52.5 } // Valores por defecto
    }

    // Obtener la configuración de tarifas
    let precioHoraDiurno = 3.0 // Valor por defecto
    let precioHoraNocturno = 4.0 // Valor por defecto (más caro en la noche)
    let tasaCambio = 35.0 // Valor por defecto
    let horaInicioNocturno = "00:00" // Valor por defecto
    let horaFinNocturno = "06:00" // Valor por defecto

    try {
      const response = await fetch("/api/company-settings")
      if (response.ok) {
        const settings = await response.json()
        precioHoraDiurno = settings.tarifas?.precioHoraDiurno || precioHoraDiurno
        precioHoraNocturno = settings.tarifas?.precioHoraNocturno || precioHoraNocturno
        tasaCambio = settings.tarifas?.tasaCambio || tasaCambio
        horaInicioNocturno = settings.tarifas?.horaInicioNocturno || horaInicioNocturno
        horaFinNocturno = settings.tarifas?.horaFinNocturno || horaFinNocturno
      }
    } catch (error) {
      console.error("Error fetching company settings:", error)
    }

    const now = new Date()
    const diffInMs = now.getTime() - entryDate.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)

    // Calcular tarifa basada en el horario actual
    const currentHour = now.getHours()
    const isNight = isNightTime(now, horaInicioNocturno, horaFinNocturno)
    const precioHora = isNight ? precioHoraNocturno : precioHoraDiurno

    // Tarifa: precioHora por hora, mínimo precioHora/2 (30 minutos)
    const feeUSD = Math.max(diffInHours * precioHora, precioHora / 2)

    // Asegurar precisión de 2 decimales
    const usdAmount = Number.parseFloat(feeUSD.toFixed(2))
    const bsAmount = Number.parseFloat((usdAmount * tasaCambio).toFixed(2))

    return { usd: usdAmount, bs: bsAmount }
  } catch (error) {
    console.error("Error calculating parking fee:", error)
    return { usd: 1.5, bs: 52.5 } // Valores por defecto
  }
}
