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
      montoPagado, // Raw amount from form (Bs for efectivo_bs, USD for efectivo_usd)
      tiempoSalida,
    } = await request.json();

    // Validar que todos los campos requeridos estén presentes
    if (!codigoTicket || !tipoPago || montoPagado === undefined) {
      return NextResponse.json({ message: "Código de ticket, tipo de pago y monto son requeridos" }, { status: 400 });
    }

    // Para pagos electrónicos, validar campos adicionales
    if (
      (tipoPago === "pago_movil" || tipoPago === "transferencia") &&
      (!referenciaTransferencia || !banco || !telefono || !numeroIdentidad)
    ) {
      return NextResponse.json({ message: "Todos los campos son requeridos para pagos electrónicos" }, { status: 400 });
    }

    // Buscar el ticket
    const ticket = await db.collection("tickets").findOne({ codigoTicket });

    if (!ticket) {
      return NextResponse.json({ message: "Ticket no encontrado" }, { status: 404 });
    }

    // Verificar que el ticket esté en estado válido para pago
    if (ticket.estado === "pagado_validado" || ticket.estado === "salido") {
      return NextResponse.json({ message: "Este ticket ya ha sido pagado" }, { status: 400 });
    }

    if (ticket.estado === "disponible") {
      return NextResponse.json({ message: "Este ticket no tiene un vehículo asignado" }, { status: 400 });
    }

    // Obtener configuración de la empresa para cálculos
    const companySettings = await db.collection("company_settings").findOne({});
    const tasaCambio = companySettings?.tarifas?.tasaCambio || 35.0;

    // Calcular montos según el tipo de pago using raw montoPagado
    let montoEnBs = 0;
    let montoEnUsd = 0;

    switch (tipoPago) {
      case "efectivo_bs":
        montoEnBs = Number(montoPagado); // Use raw montoPagado as Bs
        montoEnUsd = Number((montoEnBs / tasaCambio).toFixed(6)); // Convert to USD
        break;
      case "efectivo_usd":
        montoEnUsd = Number(montoPagado); // Use raw montoPagado as USD
        montoEnBs = Number((montoEnUsd * tasaCambio).toFixed(2)); // Convert to Bs
        break;
      case "pago_movil":
      case "transferencia":
        montoEnBs = Number(montoPagado); // Assume Bs for electronic payments
        montoEnUsd = Number((montoEnBs / tasaCambio).toFixed(6)); // Convert to USD
        break;
      default:
        return NextResponse.json({ message: "Tipo de pago no válido" }, { status: 400 });
    }

    // Buscar información del carro asociado
    const car = await db.collection("cars").findOne({
      ticketAsociado: codigoTicket,
      estado: "estacionado",
    });

    // Calcular tiempo de salida estimado
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

    // Crear el registro de pago
    const pagoData = {
      ticketId: ticket._id.toString(),
      codigoTicket,
      tipoPago,
      referenciaTransferencia: referenciaTransferencia || null,
      banco: banco || null,
      telefono: telefono || null,
      numeroIdentidad: numeroIdentidad || null,
      montoPagado: montoEnBs, // Store in Bs
      montoPagadoUsd: montoEnUsd, // Store in USD
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
    console.log("Pago registrado:", pagoData); // Log the full data for debugging

    // Actualizar el estado del ticket
    const nuevoEstadoTicket = "pagado_pendiente";

    await db.collection("tickets").updateOne(
      { codigoTicket },
      {
        $set: {
          estado: nuevoEstadoTicket,
          ultimoPagoId: pagoResult.insertedId.toString(),
          tipoPago,
          tiempoSalida: tiempoSalida || "now",
          tiempoSalidaEstimado,
        },
      }
    );

    // Si hay un carro asociado, actualizar su estado
    if (car) {
      await db.collection("cars").updateOne(
        { _id: car._id },
        { $set: { estado: "pago_pendiente" } }
      );
    }

    // Set cache control headers
    const response = NextResponse.json({
      message: "Pago registrado exitosamente",
      pagoId: pagoResult.insertedId,
      tipoPago,
      montoEnBs,
      montoEnUsd,
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