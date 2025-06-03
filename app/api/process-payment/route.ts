import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// Opt out of caching for this route
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    const { codigoTicket, referenciaTransferencia, banco, telefono, numeroIdentidad, montoPagado } =
      await request.json()

    // Validar que todos los campos requeridos estén presentes
    if (!codigoTicket || !referenciaTransferencia || !banco || !telefono || !numeroIdentidad || !montoPagado) {
      return NextResponse.json({ message: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Buscar el ticket
    const ticket = await db.collection("tickets").findOne({ codigoTicket })

    if (!ticket) {
      return NextResponse.json({ message: "Ticket no encontrado" }, { status: 404 })
    }

    // Verificar que el ticket esté en estado válido para pago
    if (ticket.estado === "pagado_validado" || ticket.estado === "salido") {
      return NextResponse.json({ message: "Este ticket ya ha sido pagado" }, { status: 400 })
    }

    if (ticket.estado === "disponible") {
      return NextResponse.json({ message: "Este ticket no tiene un vehículo asignado" }, { status: 400 })
    }

    // Buscar información del carro asociado
    const car = await db.collection("cars").findOne({
      ticketAsociado: codigoTicket,
      estado: "estacionado",
    })

    // Crear el registro de pago
    const pagoData = {
      ticketId: ticket._id.toString(),
      codigoTicket,
      referenciaTransferencia,
      banco,
      telefono,
      numeroIdentidad,
      montoPagado: Number(montoPagado),
      montoCalculado: ticket.montoCalculado || 0,
      fechaPago: new Date(),
      estado: "pendiente_validacion",
      estadoValidacion: "pendiente",
      // Incluir información del carro si existe
      carInfo: car
        ? {
            placa: car.placa,
            marca: car.marca,
            modelo: car.modelo,
            color: car.color,
            nombreDueño: car.nombreDueño,
            telefono: car.telefono,
          }
        : null,
    }

    const pagoResult = await db.collection("pagos").insertOne(pagoData)
    console.log("Pago registrado:", pagoResult)

    // Actualizar el estado del ticket
    await db.collection("tickets").updateOne(
      { codigoTicket },
      {
        $set: {
          estado: "pagado_pendiente",
          ultimoPagoId: pagoResult.insertedId.toString(),
        },
      },
    )

    // Si hay un carro asociado, actualizar su estado
    if (car) {
      await db.collection("cars").updateOne({ _id: car._id }, { $set: { estado: "pago_pendiente" } })
    }

    // Set cache control headers
    const response = NextResponse.json({
      message: "Pago registrado exitosamente",
      pagoId: pagoResult.insertedId,
    })
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    response.headers.set("Surrogate-Control", "no-store")

    return response
  } catch (error) {
    console.error("Error processing payment:", error)
    return NextResponse.json({ message: "Error al procesar el pago" }, { status: 500 })
  }
}
