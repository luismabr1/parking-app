import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export const fetchCache = "force-no-store"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    // Buscar tickets que están ocupados pero no confirmados como estacionados
    const pendingTickets = await db
      .collection("tickets")
      .find({ estado: "ocupado" })
      .sort({ horaOcupacion: -1 })
      .toArray()

    // Para cada ticket, buscar la información del carro asociado
    const pendingParkings = await Promise.all(
      pendingTickets.map(async (ticket) => {
        const car = await db.collection("cars").findOne({
          ticketAsociado: ticket.codigoTicket,
          estado: "estacionado",
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
                horaIngreso: car.horaIngreso,
              }
            : null,
        }
      }),
    )

    const response = NextResponse.json(pendingParkings)
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error) {
    console.error("Error fetching pending parkings:", error)
    return NextResponse.json({ message: "Error al obtener estacionamientos pendientes" }, { status: 500 })
  }
}
