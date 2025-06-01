import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    const pendingPayments = await db
      .collection("pagos")
      .aggregate([
        {
          $match: { estadoValidacion: "pendiente" },
        },
        {
          $lookup: {
            from: "tickets",
            localField: "ticketId",
            foreignField: "_id",
            as: "ticket",
          },
        },
        {
          $unwind: "$ticket",
        },
        {
          $project: {
            _id: 1,
            codigoTicket: 1,
            referenciaTransferencia: 1,
            banco: 1,
            telefono: 1,
            numeroIdentidad: 1,
            montoPagado: 1,
            fechaPago: 1,
            estadoValidacion: 1,
            montoCalculado: "$ticket.montoCalculado",
          },
        },
        {
          $sort: { fechaPago: -1 },
        },
      ])
      .toArray()

    return NextResponse.json(pendingPayments)
  } catch (error) {
    console.error("Error fetching pending payments:", error)
    return NextResponse.json({ message: "Error al obtener pagos pendientes" }, { status: 500 })
  }
}
