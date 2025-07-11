import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    // Solo obtener tickets que estén realmente disponibles
    const availableTickets = await db
      .collection("tickets")
      .find({
        estado: "disponible",
        // Asegurar que no tengan información de carro asociada
        $or: [{ carInfo: { $exists: false } }, { carInfo: null }],
      })
      .sort({ codigoTicket: 1 })
      .toArray()

    if (process.env.NODE_ENV === "development") {
      console.log(`🎫 DEBUG: Found ${availableTickets.length} truly available tickets`)
      availableTickets.forEach((ticket) => {
        console.log(`🎫 DEBUG: Available ticket: ${ticket.codigoTicket} - Estado: ${ticket.estado}`)
      })
    }

    const response = NextResponse.json(availableTickets)
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error) {
    console.error("Error fetching available tickets:", error)
    return NextResponse.json({ message: "Error al obtener tickets disponibles" }, { status: 500 })
  }
}
