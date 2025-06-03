import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export const fetchCache = "force-no-store"

export async function POST(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    const { ticketCode } = await request.json()

    if (!ticketCode) {
      return NextResponse.json({ message: "Código de ticket requerido" }, { status: 400 })
    }

    console.log(`🚗 Confirmando estacionamiento para ticket: ${ticketCode}`)

    // Buscar el ticket
    const ticket = await db.collection("tickets").findOne({ codigoTicket: ticketCode })

    if (!ticket) {
      return NextResponse.json({ message: "Ticket no encontrado" }, { status: 404 })
    }

    // Verificar que el ticket esté en estado ocupado
    if (ticket.estado !== "ocupado") {
      return NextResponse.json(
        { message: "El ticket debe estar en estado ocupado para confirmar el estacionamiento" },
        { status: 400 },
      )
    }

    // Buscar el carro asociado
    const car = await db.collection("cars").findOne({
      ticketAsociado: ticketCode,
      estado: "estacionado",
    })

    if (!car) {
      return NextResponse.json({ message: "No se encontró el carro asociado a este ticket" }, { status: 404 })
    }

    console.log(`✅ Carro encontrado: ${car.placa} - ${car.marca} ${car.modelo}`)

    // Actualizar el ticket a estado "estacionado_confirmado" para que pueda ser pagado
    await db.collection("tickets").updateOne(
      { codigoTicket: ticketCode },
      {
        $set: {
          estado: "estacionado_confirmado",
          horaOcupacion: new Date(), // Marcar el momento de confirmación como inicio del cobro
        },
      },
    )

    // Crear entrada en el historial si no existe
    const existingHistory = await db.collection("car_history").findOne({
      ticketAsociado: ticketCode,
      estado: "activo",
    })

    if (!existingHistory) {
      await db.collection("car_history").insertOne({
        carId: car._id.toString(),
        placa: car.placa,
        marca: car.marca,
        modelo: car.modelo,
        color: car.color,
        nombreDueño: car.nombreDueño,
        telefono: car.telefono,
        ticketAsociado: ticketCode,
        horaIngreso: new Date(),
        horaSalida: null,
        montoTotal: 0,
        pagoId: null,
        estado: "activo",
        fechaRegistro: new Date(),
      })
    }

    console.log(`✅ Estacionamiento confirmado para ticket ${ticketCode}`)

    const response = NextResponse.json({
      message: `Estacionamiento confirmado. El cliente ya puede buscar el ticket ${ticketCode} y realizar el pago.`,
      ticketCode,
      carInfo: {
        placa: car.placa,
        marca: car.marca,
        modelo: car.modelo,
        propietario: car.nombreDueño,
      },
    })

    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    return response
  } catch (error) {
    console.error("Error confirming parking:", error)
    return NextResponse.json({ message: "Error al confirmar el estacionamiento" }, { status: 500 })
  }
}
