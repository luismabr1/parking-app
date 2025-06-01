import type { Metadata } from "next"
import { notFound } from "next/navigation"
import TicketDetails from "@/components/ticket-details"
import { getTicketDetails } from "@/lib/ticket-service"

export const metadata: Metadata = {
  title: "Detalles del Ticket",
  description: "Detalles y pago de ticket de estacionamiento",
}

export default async function TicketPage({ params }: { params: { code: string } }) {
  const { code } = params

  try {
    const ticketDetails = await getTicketDetails(code)

    if (!ticketDetails) {
      notFound()
    }

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Detalles del Ticket</h1>
            <p className="text-lg text-gray-600">Revise los detalles y proceda al pago</p>
          </div>

          <TicketDetails ticket={ticketDetails} />

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Sistema de Estacionamiento</p>
          </div>
        </div>
      </main>
    )
  } catch (error) {
    notFound()
  }
}
