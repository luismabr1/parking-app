export interface CarInfo {
  placa: string
  marca: string
  modelo: string
  color: string
  nombreDueño: string
  telefono: string
}

export interface Ticket {
  _id: string
  codigoTicket: string
  horaEntrada?: string
  horaSalida?: string | null
  estado: "activo" | "pagado_pendiente" | "pagado_validado" | "salido" | "pago_rechazado" | "disponible" | "ocupado"
  montoCalculado: number
  ultimoPagoId?: string | null
  // Nuevos campos para el sistema mejorado
  fechaCreacion?: string
  horaOcupacion?: string | null
  // Información del carro asociado
  carInfo?: CarInfo | null
}

export interface Payment {
  _id: string
  ticketId: string
  codigoTicket: string
  referenciaTransferencia: string
  banco: string
  telefono: string
  numeroIdentidad: string
  montoPagado: number
  fechaPago: string
  estadoValidacion: "pendiente" | "validado" | "rechazado"
}

export interface PaymentFormData {
  referenciaTransferencia: string
  banco: string
  telefono: string
  numeroIdentidad: string
  montoPagado: number
}

export interface PendingPayment extends Payment {
  montoCalculado: number
  estado?: string
  tiempoSalida?: string
  tiempoSalidaEstimado?: string
  carInfo?: CarInfo
}

export interface StaffMember {
  _id: string
  nombre: string
  apellido: string
  email: string
  rol: "administrador" | "operador"
  fechaCreacion: string
}

// Actualizar la interfaz CompanySettings para incluir tarifas diurnas y nocturnas
export interface CompanySettings {
  _id?: string
  pagoMovil: {
    banco: string
    cedula: string
    telefono: string
  }
  transferencia: {
    banco: string
    cedula: string
    telefono: string
    numeroCuenta: string
  }
  tarifas: {
    precioHoraDiurno: number
    precioHoraNocturno: number
    tasaCambio: number
    horaInicioNocturno: string // Formato "HH:mm" ej: "00:00"
    horaFinNocturno: string // Formato "HH:mm" ej: "06:00"
  }
}

// Nuevos tipos para el sistema de gestión de carros
export interface Car {
  _id: string
  placa: string
  marca: string
  modelo: string
  color: string
  nombreDueño: string
  telefono: string
  ticketAsociado: string
  horaIngreso: string
  estado: "estacionado_confirmado" | "pagado" | "salido"
  fechaRegistro: string
  nota?: string // Nuevo campo para notas adicionales
  // Nuevos campos para imágenes
  imagenes?: {
    plateImageUrl?: string
    vehicleImageUrl?: string
    fechaCaptura?: string
    capturaMetodo?: "manual" | "camara_movil" | "camara_desktop"
    confianzaPlaca?: number
    confianzaVehiculo?: number
  }
}

export interface CarHistoryItem {
  _id: string
  carId?: string
  placa: string
  marca: string
  modelo: string
  color: string
  nombreDueño: string
  telefono: string
  ticketAsociado: string
  horaIngreso: string
  horaSalida?: string | null
  montoTotal: number
  pagoId?: string | null
  estado: "activo" | "pagado" | "finalizado"
  fechaRegistro: string
  nota?: string // Nuevo campo para notas adicionales
  imagenes?: {
    plateImageUrl?: string
    vehicleImageUrl?: string
    fechaCaptura?: string
    capturaMetodo?: "manual" | "camara_movil" | "camara_desktop"
  }
}

export interface AvailableTicket {
  _id: string
  codigoTicket: string
  estado: string
  fechaCreacion?: string
}

export interface TicketStats {
  total: number
  disponibles: number
  ocupados: number
  pagados: number
}

export interface CarFormData {
  placa: string
  marca: string
  modelo: string
  color: string
  nombreDueño: string
  telefono: string
  ticketAsociado: string
  nota?: string // Nuevo campo para notas adicionales
}

export interface DashboardStats {
  pendingPayments: number
  totalStaff: number
  todayPayments: number
  totalTickets: number
  availableTickets: number
  carsParked: number
}

export interface Bank {
  _id: string
  code: string
  name: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

// Nuevos tipos para imágenes de vehículos
export interface VehicleImages {
  plateImageUrl: string
  vehicleImageUrl: string
  fechaCaptura: string
  capturaMetodo: "manual" | "camara_movil" | "camara_desktop"
  confianzaPlaca?: number
  confianzaVehiculo?: number
  datosDetectados?: {
    placa?: string
    marca?: string
    modelo?: string
    color?: string
  }
}

// Helper functions para validar fechas
export function isValidDate(date: any): boolean {
  if (!date) return false
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj instanceof Date && !isNaN(dateObj.getTime())
}

// Helper function para convertir a Date seguro
export function toSafeDate(date: any): Date | null {
  if (!date) return null
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return isValidDate(dateObj) ? dateObj : null
  } catch {
    return null
  }
}

// Helper function para formatear fechas de forma segura
export function formatSafeDate(date: any): string {
  const safeDate = toSafeDate(date)
  if (!safeDate) return "Fecha no disponible"

  try {
    return new Intl.DateTimeFormat("es-VE", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(safeDate)
  } catch {
    return safeDate.toLocaleDateString()
  }
}

// Nueva función para determinar si una hora está en horario nocturno
export function isNightTime(date: Date, startTime: string, endTime: string): boolean {
  const hour = date.getHours()
  const minute = date.getMinutes()
  const currentTime = hour * 60 + minute // Convertir a minutos desde medianoche

  const [startHour, startMinute] = startTime.split(":").map(Number)
  const [endHour, endMinute] = endTime.split(":").map(Number)

  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute

  // Si el horario nocturno cruza medianoche (ej: 22:00 a 06:00)
  if (startMinutes > endMinutes) {
    return currentTime >= startMinutes || currentTime < endMinutes
  }
  // Si el horario nocturno no cruza medianoche (ej: 00:00 a 06:00)
  else {
    return currentTime >= startMinutes && currentTime < endMinutes
  }
}
