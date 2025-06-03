import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export const fetchCache = 'force-no-store'

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

    // Para cada ticket, buscar la información del carro asociado
    const ticketsWithCarInfo = await Promise.all(
      paidTickets.map(async (ticket) => {
        const car = await db.collection("cars").findOne({
          ticketAsociado: ticket.codigoTicket,
          estado: { $in: ["estacionado", "pagado"] },
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
        }
      }),
    )

    return NextResponse.json(ticketsWithCarInfo)
  } catch (error) {
    console.error("Error fetching paid tickets:", error)
    return NextResponse.json({ message: "Error al obtener tickets pagados" }, { status: 500 })
  }
}
