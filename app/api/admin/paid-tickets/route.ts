// Opt out of caching for this route
export const dynamic = "force-dynamic"
export const revalidate = 0

import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export const fetchCache = "force-no-store"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    // Buscar tickets que están pagados y validados
    const paidTickets = await db
      .collection("tickets")
      .find({ estado: "pagado_validado" })
      .sort({ horaOcupacion: -1 })
      .toArray()

    // Para cada ticket, buscar la información del carro asociado y del pago
    const ticketsWithCarInfo = await Promise.all(
      paidTickets.map(async (ticket) => {
        const car = await db.collection("cars").findOne({
          ticketAsociado: ticket.codigoTicket,
          estado: { $in: ["estacionado", "pagado"] },
        })

        // AGREGAR: Buscar el pago para obtener la fecha de pago y tiempos de salida
        const payment = await db.collection("pagos").findOne({
          codigoTicket: ticket.codigoTicket,
          estadoValidacion: "validado",
        })

        return {
          ...ticket,
          carInfo: car
            ? {
                placa: car.placa,
                marca: car.marca,
                modelo: car.modelo,
                color: car.color,
                nombreDueño: car.nombreDueño,
                telefono: car.telefono,
              }
            : null,
          // AGREGAR: Campos de tiempo de salida y fecha de pago
          fechaPago: payment?.fechaPago || ticket.fechaCreacion,
          tiempoSalida: ticket.tiempoSalida || payment?.tiempoSalida,
          tiempoSalidaEstimado: ticket.tiempoSalidaEstimado || payment?.tiempoSalidaEstimado,
        }
      }),
    )

    // Agregar headers anti-cache
    const response = NextResponse.json(ticketsWithCarInfo)
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    response.headers.set("Surrogate-Control", "no-store")

    return response
  } catch (error) {
    console.error("Error fetching paid tickets:", error)
    return NextResponse.json({ message: "Error al obtener tickets pagados" }, { status: 500 })
  }
}
