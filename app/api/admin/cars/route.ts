import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("parking");

    const cars = await db
      .collection("cars")
      .find({ estado: { $in: ["estacionado", "estacionado_confirmado"] } })
      .sort({ horaIngreso: -1 })
      .toArray();

    return NextResponse.json(cars);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching cars:", error);
    }
    return NextResponse.json({ message: "Error al obtener carros" }, { status: 500 });
  }
}

export async function POST(request) {
  return handleCarRequest(request, "POST");
}

export async function PUT(request) {
  return handleCarRequest(request, "PUT");
}

async function handleCarRequest(request, method) {
  try {
    const client = await clientPromise;
    const db = client.db("parking");
    const formData = await request.formData();

    const carId = formData.get("carId")?.toString();
    const isUpdate = method === "PUT" && carId;

    const placa = formData.get("placa")?.toString().toUpperCase() || "";
    const marca = formData.get("marca")?.toString() || "";
    const modelo = formData.get("modelo")?.toString() || "";
    const color = formData.get("color")?.toString() || "";
    const nombreDueño = formData.get("nombreDueño")?.toString() || "";
    const telefono = formData.get("telefono")?.toString() || "";
    const ticketAsociado = formData.get("ticketAsociado")?.toString() || "";

    if (process.env.NODE_ENV === "development") {
      console.log(`${method} request received`, { carId, placa, marca, modelo, color, nombreDueño, telefono, ticketAsociado });
    }

    let existingCar;
    if (isUpdate) {
      existingCar = await db.collection("cars").findOne({ _id: new ObjectId(carId) });
      if (!existingCar) {
        return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
      }
    }

    const now = new Date();
    const carData = {
      placa,
      marca,
      modelo,
      color,
      nombreDueño,
      telefono,
      ticketAsociado,
      horaIngreso: isUpdate ? existingCar.horaIngreso : now,
      estado: isUpdate ? existingCar.estado : "estacionado",
      fechaRegistro: isUpdate ? existingCar.fechaRegistro : now,
      lastModified: now,
      imagenes: {
        ...existingCar?.imagenes || {},
        fechaCaptura: now,
        capturaMetodo: "manual",
      },
    };

    const plateImage = formData.get("plateImage") as File | null;
    const vehicleImage = formData.get("vehicleImage") as File | null;
    const plateImageUrl = formData.get("plateImageUrl")?.toString();
    const vehicleImageUrl = formData.get("vehicleImageUrl")?.toString();

    if (plateImage || vehicleImage || plateImageUrl || vehicleImageUrl) {
      if (plateImage) {
        const plateUploadResponse = await cloudinary.uploader.upload(
          `data:image/jpeg;base64,${await plateImage.arrayBuffer().then(Buffer.from).toString("base64")}`,
          { folder: "parking-plates" }
        );
        carData.imagenes.plateImageUrl = plateUploadResponse.secure_url;
      } else if (plateImageUrl) {
        carData.imagenes.plateImageUrl = plateImageUrl;
      }

      if (vehicleImage) {
        const vehicleUploadResponse = await cloudinary.uploader.upload(
          `data:image/jpeg;base64,${await vehicleImage.arrayBuffer().then(Buffer.from).toString("base64")}`,
          { folder: "parking-vehicles" }
        );
        carData.imagenes.vehicleImageUrl = vehicleUploadResponse.secure_url;
      } else if (vehicleImageUrl) {
        carData.imagenes.vehicleImageUrl = vehicleImageUrl;
      }
    }

    let result;
    if (isUpdate) {
      result = await db.collection("cars").updateOne(
        { _id: new ObjectId(carId) },
        { $set: carData }
      );
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
      }
    } else {
      result = await db.collection("cars").insertOne(carData);
      carData._id = result.insertedId;

      if (ticketAsociado) {
        const updateResult = await db.collection("tickets").updateOne(
          { codigoTicket: ticketAsociado },
          {
            $set: {
              estado: "ocupado",
              carInfo: {
                placa,
                marca,
                modelo,
                color,
                nombreDueño,
                telefono,
                horaIngreso: now.toISOString(),
                fechaRegistro: now.toISOString(),
                imagenes: carData.imagenes,
              },
              horaOcupacion: now.toISOString(),
            },
          },
          { upsert: true }
        );
        if (process.env.NODE_ENV === "development") {
          console.log("🔍 DEBUG - Updated tickets for ticket:", ticketAsociado, updateResult);
        }
      }

      const historyEntry = {
        carId: result.insertedId.toString(),
        placa: carData.placa || "PENDIENTE",
        marca: carData.marca || "Por definir",
        modelo: carData.modelo || "Por definir",
        color: carData.color || "Por definir",
        nombreDueño: carData.nombreDueño || "Por definir",
        telefono: carData.telefono || "Por definir",
        ticketAsociado: carData.ticketAsociado || "",
        estadoActual: "estacionado",
        activo: true,
        completado: false,
        fechaRegistro: now,
        fechaUltimaActualizacion: now,
        datosVehiculo: { ...carData, fechaCreacion: now },
        eventos: [
          {
            tipo: "registro_inicial",
            fecha: now,
            estado: "estacionado",
            datos: {
              metodoRegistro: carData.imagenes.capturaMetodo || "manual",
              imagenes: carData.imagenes || null,
              confianzaPlaca: carData.imagenes.confianzaPlaca || 0,
              confianzaVehiculo: carData.imagenes.confianzaVehiculo || 0,
            },
          },
        ],
        pagos: [],
        pagosRechazados: [],
        montosPendientes: [],
        montoTotalPagado: 0,
      };
      await db.collection("car_history").insertOne(historyEntry);
    }

    const updatedCar = await db.collection("cars").findOne({ _id: isUpdate ? new ObjectId(carId) : result.insertedId });
    return NextResponse.json({ success: true, car: updatedCar });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error handling car request:", error);
    }
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}