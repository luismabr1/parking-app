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

// Actualizar la interfaz CompanySettings para incluir los nuevos campos
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
    precioHora: number
    tasaCambio: number
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
  estado: "estacionado" | "pagado" | "salido"
  fechaRegistro: string
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
