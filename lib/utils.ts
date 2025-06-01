import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

export function calculateParkingFee(entryTime: Date): number {
  const now = new Date()
  const diffMs = now.getTime() - entryTime.getTime()
  const diffMinutes = Math.ceil(diffMs / (1000 * 60))

  // Rate: $0.05 per minute (adjust as needed)
  const rate = 0.05
  return Math.max(diffMinutes * rate, 1) // Minimum fee of $1
}
