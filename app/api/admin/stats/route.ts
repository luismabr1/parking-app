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

    // Obtener estadísticas de pagos pendientes
    const pendingPayments = await db.collection("pagos").countDocuments({
      estado: "pendiente_validacion",
    })

    // Obtener total de personal
    const totalStaff = await db.collection("staff").countDocuments()

    // Obtener pagos de hoy
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayPayments = await db.collection("pagos").countDocuments({
      fechaPago: {
        $gte: today,
        $lt: tomorrow,
      },
    })

    // Obtener estadísticas de tickets
    const totalTickets = await db.collection("tickets").countDocuments()
    const availableTickets = await db.collection("tickets").countDocuments({
      estado: "disponible",
    })

    // Obtener carros estacionados actualmente
    const carsParked = await db.collection("cars").countDocuments({
      estado: "estacionado",
    })

    // Obtener tickets pagados listos para salir
    const paidTickets = await db.collection("tickets").countDocuments({
      estado: "pagado_validado",
    })

    // Set cache control headers
    const response = NextResponse.json({
      pendingPayments,
      totalStaff,
      todayPayments,
      totalTickets,
      availableTickets,
      carsParked,
      paidTickets,
    })

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    response.headers.set("Surrogate-Control", "no-store")

    return response
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ message: "Error al obtener estadísticas" }, { status: 500 })
  }
}
