import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    const pendingPayments = await db
      .collection("pagos")
      .find({ estado: "pendiente_validacion" })
      .sort({ fechaPago: -1 })
      .toArray()

    return NextResponse.json(pendingPayments)
  } catch (error) {
    console.error("Error fetching pending payments:", error)
    return NextResponse.json({ message: "Error al obtener pagos pendientes" }, { status: 500 })
  }
}

