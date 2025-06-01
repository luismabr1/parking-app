import { type NextRequest, NextResponse } from "next/server"
import { getTicketDetails } from "@/lib/ticket-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json({ message: "Código de ticket requerido" }, { status: 400 })
    }

    const ticket = await getTicketDetails(code)

    if (!ticket) {
      return NextResponse.json({ message: "Ticket no encontrado o ya ha sido pagado" }, { status: 404 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error("Error fetching ticket details:", error)
    return NextResponse.json({ message: "Error al buscar el ticket" }, { status: 500 })
  }
}
