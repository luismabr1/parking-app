import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatSafeDate } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  try {
    // Verificar si el amount es un número válido
    if (typeof amount !== "number" || isNaN(amount)) {
      return "$0.00"
    }

    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  } catch (error) {
    console.error("Error formatting currency:", error)
    return `$${amount.toFixed(2)}`
  }
}

export function formatDateTime(date: any): string {
  return formatSafeDate(date)
}

export function calculateParkingFee(entryTime: Date | string): number {
  try {
    const entryDate = typeof entryTime === "string" ? new Date(entryTime) : entryTime

    if (!entryDate || isNaN(entryDate.getTime())) {
      console.error("Invalid entry time:", entryTime)
      return 1.5 // Tarifa mínima por defecto
    }

    const now = new Date()
    const diffInMs = now.getTime() - entryDate.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)

    // Tarifa: $3 por hora, mínimo $1.50 (30 minutos)
    const fee = Math.max(diffInHours * 3, 1.5)
    return Math.round(fee * 100) / 100 // Redondear a 2 decimales
  } catch (error) {
    console.error("Error calculating parking fee:", error)
    return 1.5 // Tarifa mínima por defecto
  }
}
