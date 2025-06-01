export interface Ticket {
  _id: string
  codigoTicket: string
  horaEntrada: string
  horaSalida: string | null
  estado: "activo" | "pagado_pendiente" | "pagado_validado" | "salido" | "pago_rechazado"
  montoCalculado: number
  ultimoPagoId: string | null
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
}

export interface StaffMember {
  _id: string
  nombre: string
  apellido: string
  email: string
  rol: "administrador" | "operador"
  fechaCreacion: string
}

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
}
