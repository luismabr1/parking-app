import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    const availableTickets = await db
      .collection("tickets")
      .find({ estado: "disponible" })
      .sort({ codigoTicket: 1 })
      .toArray()

    return NextResponse.json(availableTickets)
  } catch (error) {
    console.error("Error fetching available tickets:", error)
    return NextResponse.json({ message: "Error al obtener tickets disponibles" }, { status: 500 })
  }
}

