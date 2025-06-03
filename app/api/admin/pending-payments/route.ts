import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    const pendingPayments = await db
      .collection("pagos")
      .find({ estado: "pendiente_validacion" })
      .sort({ fechaPago: -1 })
      .toArray()

    // Agregar headers para evitar el caché
    const response = NextResponse.json(pendingPayments)
    response.headers.set("Cache-Control", "no-store, max-age=0")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error) {
    console.error("Error fetching pending payments:", error)
    return NextResponse.json({ message: "Error al obtener pagos pendientes" }, { status: 500 })
  }
}
