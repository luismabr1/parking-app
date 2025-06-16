import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    // Buscar tickets en estado "ocupado" (pendientes de confirmación)
    const pendingParkings = await db
      .collection("tickets")
      .find({ estado: "ocupado" })
      .sort({ horaOcupacion: -1 })
      .toArray()

    const response = NextResponse.json(pendingParkings)

    // Headers anti-cache más agresivos
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    response.headers.set("Surrogate-Control", "no-store")
    response.headers.set("Vary", "*")
    response.headers.set("Last-Modified", new Date().toUTCString())
    response.headers.set("ETag", `"${Date.now()}-${Math.random()}"`)

    return response
  } catch (error) {
    console.error("Error fetching pending parkings:", error)
    return NextResponse.json({ message: "Error al obtener estacionamientos pendientes" }, { status: 500 })
  }
}
