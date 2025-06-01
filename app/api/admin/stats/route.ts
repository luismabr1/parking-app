import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    // Get pending payments count
    const pendingPayments = await db.collection("pagos").countDocuments({
      estadoValidacion: "pendiente",
    })

    // Get total staff count
    const totalStaff = await db.collection("staff").countDocuments()

    // Get today's payments count
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayPayments = await db.collection("pagos").countDocuments({
      fechaPago: { $gte: today },
    })

    return NextResponse.json({
      pendingPayments,
      totalStaff,
      todayPayments,
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ message: "Error al obtener estadísticas" }, { status: 500 })
  }
}
