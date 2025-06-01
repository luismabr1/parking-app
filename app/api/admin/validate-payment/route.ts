import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest) {
  try {
    const { paymentId } = await request.json()

    if (!paymentId) {
      return NextResponse.json({ message: "ID de pago requerido" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("parking")
    const session = client.startSession()

    try {
      session.startTransaction()

      // Update payment status
      const paymentResult = await db
        .collection("pagos")
        .updateOne({ _id: new ObjectId(paymentId) }, { $set: { estadoValidacion: "validado" } }, { session })

      if (paymentResult.matchedCount === 0) {
        throw new Error("Pago no encontrado")
      }

      // Get payment to find associated ticket
      const payment = await db.collection("pagos").findOne({ _id: new ObjectId(paymentId) }, { session })

      if (payment) {
        // Update ticket status
        await db
          .collection("tickets")
          .updateOne({ _id: payment.ticketId }, { $set: { estado: "pagado_validado" } }, { session })
      }

      await session.commitTransaction()
      return NextResponse.json({ success: true, message: "Pago validado exitosamente" })
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      await session.endSession()
    }
  } catch (error) {
    console.error("Error validating payment:", error)
    return NextResponse.json({ message: "Error al validar el pago" }, { status: 500 })
  }
}
