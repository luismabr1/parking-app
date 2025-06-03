import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// Opt out of caching for this route
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    const pendingPayments = await db
      .collection("pagos")
      .find({ estado: "pendiente_validacion" })
      .sort({ fechaPago: -1 })
      .toArray()

    // Set cache control headers
    const response = NextResponse.json(pendingPayments)
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    response.headers.set("Surrogate-Control", "no-store")

    return response
  } catch (error) {
    console.error("Error fetching pending payments:", error)
    return NextResponse.json({ message: "Error al obtener pagos pendientes" }, { status: 500 })
  }
}
