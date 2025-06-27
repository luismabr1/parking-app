import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const fetchCache = "force-no-store";

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("parking");

    const { ticketCode } = await request.json();
    console.log(`🚗 Confirming parking for ticket: ${ticketCode} at ${new Date().toISOString()}`);

    if (!ticketCode) {
      return NextResponse.json({ message: "Código de ticket requerido" }, { status: 400 });
    }

    const ticket = await db.collection("tickets").findOne({ codigoTicket: ticketCode });
    console.log(`Ticket found: ${JSON.stringify(ticket)}`);

    if (!ticket) {
      return NextResponse.json({ message: "Ticket no encontrado" }, { status: 404 });
    }

    if (ticket.estado !== "ocupado") {
      return NextResponse.json(
        { message: "El ticket debe estar en estado ocupado para confirmar el estacionamiento" },
        { status: 400 },
      );
    }

    const car = await db.collection("cars").findOne({
      ticketAsociado: ticketCode,
      estado: "estacionado_confirmado",
    });
    console.log(`Car found: ${JSON.stringify(car)}`);

    if (!car) {
      return NextResponse.json({ message: "No se encontró el carro asociado a este ticket" }, { status: 404 });
    }

    console.log(`✅ Carro encontrado: ${car.placa} - ${car.marca} ${car.modelo}`);

    // Update cars collection
    await db.collection("cars").updateOne(
      { _id: car._id },
      {
        $set: {
          estado: "estacionado_confirmado",
          horaConfirmacion: new Date(),
        },
      },
    );
    console.log(`Cars updated for ${car._id} to estado: estacionado_confirmado at ${new Date().toISOString()}`);

    // Update tickets collection
    await db.collection("tickets").updateOne(
      { codigoTicket: ticketCode },
      {
        $set: {
          estado: "estacionado_confirmado",
          horaOcupacion: new Date(),
        },
      },
    );
    console.log(`Ticket updated to estado: estacionado_confirmado at ${new Date().toISOString()}`);

    // Update car_history with confirmation data
    const carId = car._id.toString();
    console.log(`Attempting to update car_history with carId: ${carId}`);
    const existingHistory = await db.collection("car_history").findOne({ carId });
    console.log(`Existing car_history record: ${JSON.stringify(existingHistory)}`);

    if (!existingHistory) {
      console.error(`❌ No car_history record found for carId: ${carId}`);
      return NextResponse.json({ message: "Error: Car history record not found" }, { status: 500 });
    }

    const updateResult = await db.collection("car_history").updateOne(
      { carId },
      {
        $set: {
          estado: "estacionado_confirmado",
          fecha_parking_confirmado: new Date(),
          ticketData: ticket,
        },
      },
    );
    console.log(`Car history update result for ${carId}: modifiedCount = ${updateResult.modifiedCount}, matchedCount = ${updateResult.matchedCount}`);

    console.log(`✅ Estacionamiento confirmado para ticket ${ticketCode} at ${new Date().toISOString()}`);

    const response = NextResponse.json({
      message: `Estacionamiento confirmado. El cliente ya puede buscar el ticket ${ticketCode} y realizar el pago.`,
      ticketCode,
      carInfo: {
        placa: car.placa,
        marca: car.marca,
        modelo: car.modelo,
        propietario: car.nombreDueño,
      },
    });

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Surrogate-Control", "no-store");
    response.headers.set("Vary", "*");
    response.headers.set("Last-Modified", new Date().toUTCString());
    response.headers.set("ETag", `"${Date.now()}-${Math.random()}"`);

    return response;
  } catch (error) {
    console.error("Error confirming parking:", error);
    return NextResponse.json({ message: "Error al confirmar el estacionamiento" }, { status: 500 });
  }
}