// Opt out of caching for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("parking");

    const { ticketCode } = await request.json();

    if (!ticketCode) {
      return NextResponse.json({ message: "Código de ticket requerido" }, { status: 400 });
    }

    console.log(`🚗 Procesando salida para ticket: ${ticketCode}`);

    const ticket = await db.collection("tickets").findOne({ codigoTicket: ticketCode });

    if (!ticket) {
      return NextResponse.json({ message: "Ticket no encontrado" }, { status: 404 });
    }

    if (ticket.estado !== "pagado_validado") {
      return NextResponse.json(
        { message: "El ticket debe estar pagado y validado antes de procesar la salida" },
        { status: 400 }
      );
    }

    const car = await db.collection("cars").findOne({
      ticketAsociado: ticketCode,
      estado: { $in: ["estacionado", "pagado"] },
    });

    if (!car) {
      return NextResponse.json({ message: "No se encontró el carro asociado a este ticket" }, { status: 404 });
    }

    console.log(`✅ Carro encontrado: ${car.placa} - ${car.marca} ${car.modelo}`);

    // Update car_history with exit data and full audit trail
    await db.collection("car_history").updateOne(
      { carId: car._id.toString() },
      {
        $set: {
          estado: "finalizado",
          fecha_salida: new Date(),
          ticketData: ticket,
          pagoData: await db.collection("pagos").findOne({ codigoTicket: ticketCode }),
          carData: car,
        },
      }
    );

    // Eliminar el registro del carro de la colección cars
    await db.collection("cars").deleteOne({ _id: car._id });

    // LIBERAR EL TICKET - volver a estado disponible
    await db.collection("tickets").updateOne(
      { codigoTicket: ticketCode },
      {
        $set: {
          estado: "disponible",
          horaOcupacion: null,
          montoCalculado: 0,
          ultimoPagoId: null,
        },
      }
    );

    console.log(`✅ Ticket ${ticketCode} liberado y disponible para nuevo uso`);

    const response = NextResponse.json({
      message: `Salida procesada exitosamente. El espacio ${ticketCode} está ahora disponible.`,
      ticketCode,
      carInfo: {
        placa: car.placa,
        marca: car.marca,
        modelo: car.modelo,
        propietario: car.nombreDueño,
      },
    });

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Surrogate-Control", "no-store");

    return response;
  } catch (error) {
    console.error("Error processing vehicle exit:", error);
    return NextResponse.json({ message: "Error al procesar la salida del vehículo" }, { status: 500 });
  }
}