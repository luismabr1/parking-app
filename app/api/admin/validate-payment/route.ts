import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { paymentId, currentPrecioHora, currentTasaCambio } = await request.json()

    if (!paymentId) {
      return NextResponse.json({ message: "ID de pago requerido" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("parking") // Usar la base de datos correcta

    console.log("🔍 Validando pago:", paymentId)

    // Buscar el pago en la colección pagos
    const payment = await db.collection("pagos").findOne({
      _id: new ObjectId(paymentId),
    })

    if (!payment) {
      return NextResponse.json({ message: "Pago no encontrado" }, { status: 404 })
    }

    console.log("📋 Pago encontrado:", {
      codigoTicket: payment.codigoTicket,
      estado: payment.estado,
      montoPagado: payment.montoPagado,
    })

    // Verificar que el pago esté pendiente
    if (payment.estado !== "pendiente_validacion") {
      return NextResponse.json({ message: "El pago ya ha sido procesado" }, { status: 400 })
    }

    // Actualizar el estado del pago
    const updatePaymentResult = await db.collection("pagos").updateOne(
      { _id: new ObjectId(paymentId) },
      {
        $set: {
          estado: "validado",
          estadoValidacion: "validado",
          fechaValidacion: new Date(),
          validadoPor: "admin", // Puedes cambiar esto por el ID del admin actual
        },
      },
    )

    console.log("💾 Resultado actualización pago:", updatePaymentResult)

    // Actualizar el estado del ticket asociado
    const updateTicketResult = await db.collection("tickets").updateOne(
      { codigoTicket: payment.codigoTicket },
      {
        $set: {
          estado: "pagado_validado",
          fechaValidacionPago: new Date(),
        },
      },
    )

    console.log("🎫 Resultado actualización ticket:", updateTicketResult)

    if (updatePaymentResult.modifiedCount === 0) {
      return NextResponse.json({ message: "No se pudo actualizar el pago" }, { status: 500 })
    }

    return NextResponse.json({
      message: `Pago del ticket ${payment.codigoTicket} validado exitosamente`,
      codigoTicket: payment.codigoTicket,
    })
  } catch (error) {
    console.error("Error validating payment:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
