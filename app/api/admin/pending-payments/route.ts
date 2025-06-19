import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// Opt out of caching for this route
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("parking");

    // Buscar pagos pendientes con información completa del ticket y carro
    const pendingPayments = await db
      .collection("pagos")
      .aggregate([
        {
          $match: { estado: "pendiente_validacion" },
        },
        {
          $lookup: {
            from: "tickets",
            localField: "codigoTicket",
            foreignField: "codigoTicket",
            as: "ticketInfo",
          },
        },
        {
          $unwind: {
            path: "$ticketInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "cars", // Join with the cars collection
            localField: "codigoTicket", // Use codigoTicket to match ticketAsociado
            foreignField: "ticketAsociado",
            as: "carInfoFull",
          },
        },
        {
          $unwind: {
            path: "$carInfoFull",
            preserveNullAndEmptyArrays: true,
          },
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
            estado: 1,
            estadoValidacion: 1,
            // Merge carInfo from pagos with full data from cars, using ticketInfo.carInfo as fallback
            carInfo: {
              $mergeObjects: [
                {
                  placa: { $ifNull: ["$carInfo.placa", "$ticketInfo.carInfo.placa", "Dato no proporcionado"] },
                  marca: { $ifNull: ["$carInfo.marca", "$ticketInfo.carInfo.marca", "Por definir"] },
                  modelo: { $ifNull: ["$carInfo.modelo", "$ticketInfo.carInfo.modelo", "Por definir"] },
                  color: { $ifNull: ["$carInfo.color", "$ticketInfo.carInfo.color", "Por definir"] },
                  nombreDueño: { $ifNull: ["$carInfo.nombreDueño", "$ticketInfo.carInfo.nombreDueño", "Por definir"] },
                  telefono: { $ifNull: ["$carInfo.telefono", "$ticketInfo.carInfo.telefono", "Por definir"] },
                },
                "$carInfoFull", // This will include imagenes from cars
              ],
            },
            // AGREGAR: Campos de tiempo de salida (primero del pago, luego del ticket como fallback)
            tiempoSalida: { $ifNull: ["$tiempoSalida", "$ticketInfo.tiempoSalida"] },
            tiempoSalidaEstimado: { $ifNull: ["$tiempoSalidaEstimado", "$ticketInfo.tiempoSalidaEstimado"] },
            // Información del ticket
            montoCalculado: "$ticketInfo.montoCalculado",
          },
        },
        {
          $sort: { fechaPago: -1 },
        },
      ])
      .toArray();

    // Debugging log
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 DEBUG: Pending Payments Response", pendingPayments);
    }

    // Set cache control headers
    const response = NextResponse.json(pendingPayments);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Surrogate-Control", "no-store");

    return response;
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    return NextResponse.json({ message: "Error al obtener pagos pendientes" }, { status: 500 });
  }
}