import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export const fetchCache = 'force-no-store'

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
          estado: "rechazado",
          estadoValidacion: "rechazado",
          fechaRechazo: new Date(),
        },
      },
    )

    // Actualizar el estado del ticket para permitir nuevo intento
    await db
      .collection("tickets")
      .updateOne({ codigoTicket: payment.codigoTicket }, { $set: { estado: "pago_rechazado" } })

    // Buscar y actualizar el carro asociado si existe
    const car = await db.collection("cars").findOne({
      ticketAsociado: payment.codigoTicket,
      estado: "pago_pendiente",
    })

    if (car) {
      // Volver el carro a estado estacionado para permitir nuevo intento
      await db.collection("cars").updateOne({ _id: car._id }, { $set: { estado: "estacionado" } })
    }

    // Agregar headers para evitar el caché
    const response = NextResponse.json({ message: "Pago rechazado exitosamente" })
    response.headers.set("Cache-Control", "no-store, max-age=0")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error) {
    console.error("Error rejecting payment:", error)
    return NextResponse.json({ message: "Error al rechazar el pago" }, { status: 500 })
  }
}
