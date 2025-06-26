import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// Opt out of caching for this route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("parking");

    const {
      codigoTicket,
      tipoPago,
      referenciaTransferencia,
      banco,
      telefono,
      numeroIdentidad,
      montoPagado,
      tiempoSalida,
    } = await request.json();

    if (!codigoTicket || !tipoPago || montoPagado === undefined || montoPagado <= 0) {
      return NextResponse.json({ message: "Código de ticket, tipo de pago y monto válido son requeridos" }, { status: 400 });
    }

    if ((tipoPago === "pago_movil" || tipoPago === "transferencia")) {
      if (
        !referenciaTransferencia?.trim() ||
        !banco?.trim() ||
        !telefono?.trim() ||
        !numeroIdentidad?.trim()
      ) {
        return NextResponse.json({ message: "Todos los campos son requeridos y no pueden estar vacíos para pagos electrónicos" }, { status: 400 });
      }
    }

    const ticket = await db.collection("tickets").findOne({ codigoTicket });

    if (!ticket) {
      return NextResponse.json({ message: "Ticket no encontrado" }, { status: 404 });
    }

    if (ticket.estado === "pagado_validado" || ticket.estado === "salido") {
      return NextResponse.json({ message: "Este ticket ya ha sido pagado" }, { status: 400 });
    }

    if (ticket.estado === "disponible") {
      return NextResponse.json({ message: "Este ticket no tiene un vehículo asignado" }, { status: 400 });
    }

    const companySettings = await db.collection("company_settings").findOne({});
    const tasaCambio = companySettings?.tarifas?.tasaCambio || 35.0;

    let montoEnBs = 0;
    let montoEnUsd = 0;

    // Interpret montoPagado based on payment type
    if (tipoPago === "efectivo_usd") {
      montoEnUsd = Number(montoPagado); // montoPagado is in USD
      montoEnBs = Number((montoEnUsd * tasaCambio).toFixed(2)); // Convert to Bs
    } else if (tipoPago === "efectivo_bs") {
      montoEnBs = Number(montoPagado); // montoPagado is in Bs
      montoEnUsd = Number((montoEnBs / tasaCambio).toFixed(6)); // Convert to USD
    } else if (tipoPago === "pago_movil" || tipoPago === "transferencia") {
      montoEnBs = Number(montoPagado); // Assume Bs for electronic payments
      montoEnUsd = Number((montoEnBs / tasaCambio).toFixed(6));
    } else {
      return NextResponse.json({ message: "Tipo de pago no válido" }, { status: 400 });
    }

    // Validate payment amount against calculated amount
    const montoCalculadoBs = (ticket.montoCalculado || 0) * tasaCambio;
    const tolerance = 0.1; // 10% tolerance for cash payments
    if (
      Math.abs(montoEnBs - montoCalculadoBs) > tolerance &&
      !(tipoPago.startsWith("efectivo") && montoEnBs >= montoCalculadoBs - tolerance)
    ) {
      return NextResponse.json(
        { message: `El monto pagado (${formatCurrency(montoEnBs, "VES")} Bs) no coincide con el monto calculado (${formatCurrency(montoCalculadoBs, "VES")} Bs). Por favor, verifique el monto e intente de nuevo.` },
        { status: 400 }
      );
    }

    // Buscar carro con estados actualizados
    const car = await db.collection("cars").findOne({
      ticketAsociado: codigoTicket,
      estado: { $in: ["estacionado", "estacionado_confirmado", "pago_pendiente", "pago_pendiente_taquilla", "pago_pendiente_validacion"] },
    });

    let tiempoSalidaEstimado = null;
    if (tiempoSalida && tiempoSalida !== "now") {
      const minutesToAdd =
        {
          "5min": 5,
          "10min": 10,
          "15min": 15,
          "20min": 20,
          "30min": 30,
          "45min": 45,
          "60min": 60,
        }[tiempoSalida] || 0;

      if (minutesToAdd > 0) {
        tiempoSalidaEstimado = new Date(Date.now() + minutesToAdd * 60000);
      }
    }

    const pagoData = {
      ticketId: ticket._id.toString(),
      codigoTicket,
      tipoPago,
      referenciaTransferencia: referenciaTransferencia || null,
      banco: banco || null,
      telefono: telefono || null,
      numeroIdentidad: numeroIdentidad || null,
      montoPagado: montoEnBs,
      montoPagadoUsd: montoEnUsd,
      montoCalculado: ticket.montoCalculado || 0,
      tasaCambioUsada: tasaCambio,
      fechaPago: new Date(),
      estado: "pendiente_validacion",
      estadoValidacion: "pendiente",
      tiempoSalida: tiempoSalida || "now",
      tiempoSalidaEstimado,
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
    };

    const pagoResult = await db.collection("pagos").insertOne(pagoData);
    console.log("Pago registrado:", pagoData);

    const nuevoEstadoTicket = tipoPago.startsWith("efectivo") ? "pagado_pendiente_taquilla" : "pagado_pendiente_validacion";

    await db.collection("tickets").updateOne(
      { codigoTicket },
      {
        $set: {
          estado: nuevoEstadoTicket,
          ultimoPagoId: pagoResult.insertedId.toString(),
          tipoPago,
          tiempoSalida: tiempoSalida || "now",
          tiempoSalidaEstimado,
          horaSalida: tiempoSalida === "now" ? new Date() : undefined,
        },
      }
    );

    if (car) {
      await db.collection("cars").updateOne(
        { _id: car._id },
        { $set: { estado: tipoPago.startsWith("efectivo") ? "pago_pendiente_taquilla" : "pago_pendiente_validacion" } }
      );
    }

    // Update car_history with initial payment data, handling potential missing car
    const carId = car?._id.toString();
    if (carId) {
      const existingHistory = await db.collection("car_history").findOne({ carId });
      if (!existingHistory) {
        console.error(`❌ No car_history record found for carId: ${carId}`);
        return NextResponse.json({ message: "Error: Car history record not found" }, { status: 500 });
      }
      await db.collection("car_history").updateOne(
        { carId },
        {
          $set: {
            estado: "pagado_pendiente_verificacion",
            pagoData: pagoData,
            ticketData: ticket,
            fecha_pago: new Date(),
            horaSalida: tiempoSalida === "now" ? new Date() : undefined,
          },
          $setOnInsert: {
            carId,
            placa: car.placa,
            marca: car.marca,
            modelo: car.modelo,
            color: car.color,
            nombreDueño: car.nombreDueño,
            telefono: car.telefono,
            ticketAsociado: codigoTicket,
            horaIngreso: car.horaIngreso,
            fechaRegistro: new Date(),
          },
        },
        { upsert: true }
      );
      console.log(`✅ Car history updated for payment on carId: ${carId}`);
    } else {
      console.warn(`⚠️ No car found for ticket ${codigoTicket}, skipping car_history update`);
    }

    const response = NextResponse.json({
      message: "Pago registrado exitosamente",
      pagoId: pagoResult.insertedId,
      tipoPago,
      montoEnBs,
      montoEnUsd,
      requiresValidation: !tipoPago.startsWith("efectivo"),
    });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Surrogate-Control", "no-store");

    return response;
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ message: "Error al procesar el pago" }, { status: 500 });
  }
}