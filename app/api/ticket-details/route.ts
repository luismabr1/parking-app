import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { calculateParkingFee } from "@/lib/utils"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ticketCode = searchParams.get("code")

    if (!ticketCode) {
      return NextResponse.json({ message: "Código de ticket requerido" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("parking")

    // Buscar el ticket
    const ticket = await db.collection("tickets").findOne({ codigoTicket: ticketCode })

    if (!ticket) {
      return NextResponse.json({ message: "Ticket no encontrado" }, { status: 404 })
    }

    // Verificar si el ticket ya fue pagado y validado
    if (ticket.estado === "pagado_validado" || ticket.estado === "salido") {
      return NextResponse.json({ message: "Este ticket ya ha sido pagado y procesado" }, { status: 404 })
    }

    let montoCalculado = 0
    let horaEntrada = null

    // Determinar la hora de entrada y calcular el monto
    if (ticket.estado === "ocupado" && ticket.horaOcupacion) {
      // Ticket nuevo con carro asignado
      horaEntrada = new Date(ticket.horaOcupacion)
      montoCalculado = calculateParkingFee(horaEntrada)
    } else if (ticket.horaEntrada) {
      // Ticket legacy
      horaEntrada = new Date(ticket.horaEntrada)
      montoCalculado = calculateParkingFee(horaEntrada)
    } else if (ticket.estado === "disponible") {
      // Ticket disponible sin carro asignado
      return NextResponse.json({ message: "Este ticket no tiene un vehículo asignado" }, { status: 404 })
    }

    // Buscar información del carro asociado si existe
    let carInfo = null
    const car = await db.collection("cars").findOne({
      ticketAsociado: ticketCode,
      estado: { $in: ["estacionado", "pago_pendiente"] },
    })

    if (car) {
      carInfo = {
        placa: car.placa,
        marca: car.marca,
        modelo: car.modelo,
        color: car.color,
        nombreDueño: car.nombreDueño,
        telefono: car.telefono,
      }
    }

    // Actualizar el monto calculado en el ticket
    await db.collection("tickets").updateOne({ codigoTicket: ticketCode }, { $set: { montoCalculado } })

    const response = {
      _id: ticket._id,
      codigoTicket: ticket.codigoTicket,
      horaEntrada: horaEntrada?.toISOString() || ticket.horaEntrada,
      horaSalida: ticket.horaSalida,
      estado: ticket.estado,
      montoCalculado,
      ultimoPagoId: ticket.ultimoPagoId,
      carInfo, // Información del carro asociado
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching ticket details:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
