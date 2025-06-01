import { type NextRequest, NextResponse } from "next/server"
import { createPayment } from "@/lib/ticket-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = [
      "codigoTicket",
      "referenciaTransferencia",
      "banco",
      "telefono",
      "numeroIdentidad",
      "montoPagado",
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ message: `El campo ${field} es requerido` }, { status: 400 })
      }
    }

    // Validate amount is a positive number
    if (typeof body.montoPagado !== "number" || body.montoPagado <= 0) {
      return NextResponse.json({ message: "El monto pagado debe ser un número positivo" }, { status: 400 })
    }

    const result = await createPayment(body)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error processing payment:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al procesar el pago" },
      { status: 500 },
    )
  }
}
