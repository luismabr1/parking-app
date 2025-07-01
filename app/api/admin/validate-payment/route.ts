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
    const db = client.db("parking")

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

    const now = new Date()

    // Actualizar el estado del pago
    const updatePaymentResult = await db.collection("pagos").updateOne(
      { _id: new ObjectId(paymentId) },
      {
        $set: {
          estado: "validado",
          estadoValidacion: "validado",
          fechaValidacion: now,
          validadoPor: "admin",
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
          fechaValidacionPago: now,
        },
      },
    )

    console.log("🎫 Resultado actualización ticket:", updateTicketResult)

    // AGREGAR REGISTRO EN CAR_HISTORY
    console.log("📚 Actualizando historial del carro para pago validado...")
    const historyUpdateResult = await db.collection("car_history").updateOne(
      {
        ticketAsociado: payment.codigoTicket,
        activo: true,
      },
      {
        $push: {
          eventos: {
            tipo: "pago_validado",
            fecha: now,
            estado: "pago_confirmado",
            datos: {
              montoPagado: payment.montoPagadoUsd || payment.montoPagado,
              metodoPago: payment.tipoPago,
              referencia: payment.referenciaTransferencia,
              banco: payment.banco,
              validadoPor: "admin",
              fechaConfirmacionPago: now,
              pagoId: payment._id.toString(),
              urlComprobante: payment.urlImagenComprobante,
            },
          },
          pagos: {
            fecha: now,
            monto: payment.montoPagadoUsd || payment.montoPagado,
            metodo: payment.tipoPago,
            referencia: payment.referenciaTransferencia,
            banco: payment.banco,
            estado: "validado",
            pagoId: payment._id.toString(),
            urlComprobante: payment.urlImagenComprobante,
          },
        },
        $set: {
          estadoActual: "pago_confirmado",
          fechaUltimaActualizacion: now,
          montoTotalPagado: payment.montoPagadoUsd || payment.montoPagado,
          fechaConfirmacionPago: now,
        },
      },
    )

    console.log("📚 Historial actualizado - Documentos modificados:", historyUpdateResult.modifiedCount)

    if (updatePaymentResult.modifiedCount === 0) {
      return NextResponse.json({ message: "No se pudo actualizar el pago" }, { status: 500 })
    }

    return NextResponse.json({
      message: `Pago del ticket ${payment.codigoTicket} validado exitosamente`,
      codigoTicket: payment.codigoTicket,
      fechaValidacion: now,
    })
  } catch (error) {
    console.error("Error validating payment:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
