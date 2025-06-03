import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Opt out of caching for this route
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function PUT(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    const { paymentId } = await request.json()

    if (!paymentId) {
      return NextResponse.json({ message: "ID de pago requerido" }, { status: 400 })
    }

    // Buscar el pago
    const payment = await db.collection("pagos").findOne({ _id: new ObjectId(paymentId) })

    if (!payment) {
      return NextResponse.json({ message: "Pago no encontrado" }, { status: 404 })
    }

    // Actualizar el estado del pago
    await db.collection("pagos").updateOne(
      { _id: new ObjectId(paymentId) },
      {
        $set: {
          estado: "validado",
          estadoValidacion: "validado",
          fechaValidacion: new Date(),
        },
      },
    )

    // Actualizar el estado del ticket
    await db
      .collection("tickets")
      .updateOne({ codigoTicket: payment.codigoTicket }, { $set: { estado: "pagado_validado" } })

    // Buscar y actualizar el carro asociado si existe
    const car = await db.collection("cars").findOne({
      ticketAsociado: payment.codigoTicket,
      estado: { $in: ["estacionado", "pago_pendiente"] },
    })

    if (car) {
      // Actualizar estado del carro
      await db.collection("cars").updateOne({ _id: car._id }, { $set: { estado: "pagado" } })

      // Actualizar el historial
      await db.collection("car_history").updateOne(
        { carId: car._id.toString() },
        {
          $set: {
            estado: "pagado",
            horaSalida: new Date(),
            montoTotal: payment.montoPagado,
            pagoId: paymentId,
          },
        },
      )
    }

    // Set cache control headers
    const response = NextResponse.json({ message: "Pago validado exitosamente" })
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    response.headers.set("Surrogate-Control", "no-store")

    return response
  } catch (error) {
    console.error("Error validating payment:", error)
    return NextResponse.json({ message: "Error al validar el pago" }, { status: 500 })
  }
}
