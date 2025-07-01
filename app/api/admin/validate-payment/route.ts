import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest) {
  try {
    console.log("🔄 Iniciando validación de pago...")

    const body = await request.json()
    const { paymentId, currentPrecioHora, currentTasaCambio } = body

    console.log("📥 Datos recibidos para validación:", {
      paymentId,
      currentPrecioHora,
      currentTasaCambio,
    })

    // Validar parámetros requeridos
    if (!paymentId) {
      console.log("❌ Falta parámetro: paymentId")
      return NextResponse.json({ message: "Falta parámetro requerido: paymentId" }, { status: 400 })
    }

    if (!currentPrecioHora) {
      console.log("❌ Falta parámetro: currentPrecioHora")
      return NextResponse.json({ message: "Falta parámetro requerido: currentPrecioHora" }, { status: 400 })
    }

    if (!currentTasaCambio) {
      console.log("❌ Falta parámetro: currentTasaCambio")
      return NextResponse.json({ message: "Falta parámetro requerido: currentTasaCambio" }, { status: 400 })
    }

    console.log("🔍 Validando parámetros:")
    console.log(`- paymentId: ${paymentId}`)
    console.log(`- currentPrecioHora: ${currentPrecioHora}`)
    console.log(`- currentTasaCambio: ${currentTasaCambio}`)

    const { db } = await connectToDatabase()

    // Buscar el pago
    console.log(`🔍 Buscando pago con ID: ${paymentId}`)
    const payment = await db.collection("pagos").findOne({
      _id: new ObjectId(paymentId),
    })

    if (!payment) {
      console.log("❌ Pago no encontrado")
      return NextResponse.json({ message: "Pago no encontrado" }, { status: 404 })
    }

    console.log("✅ Pago encontrado:", {
      id: payment._id,
      codigoTicket: payment.codigoTicket,
      estado: payment.estado,
      estadoValidacion: payment.estadoValidacion,
      tipoPago: payment.tipoPago,
      montoPagado: payment.montoPagado,
    })

    // Validar estado del pago
    const validStates = ["pendiente_validacion", "pendiente"]
    const currentState = payment.estadoValidacion || payment.estado

    if (!validStates.includes(currentState)) {
      console.log(`❌ Estado de pago inválido: ${currentState}`)
      return NextResponse.json(
        { message: `Estado de pago inválido: ${currentState}. Estados válidos: ${validStates.join(", ")}` },
        { status: 400 },
      )
    }

    // Actualizar el pago como validado
    const updateResult = await db.collection("pagos").updateOne(
      { _id: new ObjectId(paymentId) },
      {
        $set: {
          estado: "validado",
          estadoValidacion: "validado",
          fechaValidacion: new Date(),
          validadoPor: "admin", // En producción, usar el usuario actual
          precioHoraValidacion: currentPrecioHora,
          tasaCambioValidacion: currentTasaCambio,
        },
      },
    )

    if (updateResult.matchedCount === 0) {
      console.log("❌ No se pudo actualizar el pago")
      return NextResponse.json({ message: "No se pudo actualizar el pago" }, { status: 500 })
    }

    // Actualizar el estado del vehículo
    const carUpdateResult = await db.collection("cars").updateOne(
      { ticketAsociado: payment.codigoTicket },
      {
        $set: {
          estado: "pagado_validado",
          fechaPagoValidado: new Date(),
          lastModified: new Date(),
        },
      },
    )

    // Actualizar el estado del ticket
    const ticketUpdateResult = await db.collection("tickets").updateOne(
      { codigoTicket: payment.codigoTicket },
      {
        $set: {
          estado: "pagado_validado",
          fechaValidacionPago: new Date(),
        },
      },
    )

    console.log("✅ Pago validado exitosamente")
    console.log(`- Pago actualizado: ${updateResult.modifiedCount > 0 ? "Sí" : "No"}`)
    console.log(`- Vehículo actualizado: ${carUpdateResult.modifiedCount > 0 ? "Sí" : "No"}`)
    console.log(`- Ticket actualizado: ${ticketUpdateResult.modifiedCount > 0 ? "Sí" : "No"}`)

    return NextResponse.json({
      message: "Pago validado correctamente",
      paymentId,
      codigoTicket: payment.codigoTicket,
      fechaValidacion: new Date(),
    })
  } catch (error) {
    console.error("❌ Error validating payment:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
