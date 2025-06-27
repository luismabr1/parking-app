import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    console.log("🔍 DEBUG: Handling GET request for /api/admin/company-settings");
    const client = await clientPromise;
    const db = client.db("parking");

    const settings = await db.collection("company_settings").findOne({});

    console.log("🔍 DEBUG: Database query result:", settings);

    if (!settings) {
      console.log("🔍 DEBUG: No settings found, returning default values");
      return NextResponse.json({
        pagoMovil: {
          banco: "",
          cedula: "",
          telefono: "",
        },
        transferencia: {
          banco: "",
          cedula: "",
          telefono: "",
          numeroCuenta: "",
        },
        tarifas: {
          precioHora: 3.0,
          tasaCambio: 35.0,
        },
      });
    }

    if (!settings.tarifas) {
      settings.tarifas = {
        precioHora: 3.0,
        tasaCambio: 35.0,
      };
      console.log("🔍 DEBUG: Added default tarifas to settings:", settings);
    }

    console.log("🔍 DEBUG: Returning settings:", settings);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("🔍 DEBUG: Error fetching company settings:", error);
    return NextResponse.json({ message: "Error al obtener la configuración" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    console.log("🔍 DEBUG: Handling PUT request for /api/admin/company-settings");
    const client = await clientPromise;
    const db = client.db("parking");
    const settings = await request.json();
    console.log("🔍 DEBUG: Received settings data:", settings);

    if (
      !settings.tarifas ||
      typeof settings.tarifas.precioHora !== "number" ||
      typeof settings.tarifas.tasaCambio !== "number"
    ) {
      console.log("🔍 DEBUG: Invalid tarifas data detected");
      return NextResponse.json({ message: "Datos de tarifas inválidos" }, { status: 400 });
    }

    if (settings.tarifas) {
      settings.tarifas.precioHora = Number.parseFloat(settings.tarifas.precioHora.toFixed(2));
      settings.tarifas.tasaCambio = Number.parseFloat(settings.tarifas.tasaCambio.toFixed(2));
      console.log("🔍 DEBUG: Normalized tarifas values:", settings.tarifas);
    }

    const result = await db
      .collection("company_settings")
      .updateOne({}, { $set: settings }, { upsert: true });
    console.log("🔍 DEBUG: Update result:", result);

    return NextResponse.json({
      message: "Configuración guardada exitosamente",
      updated: result.modifiedCount > 0,
      created: result.upsertedCount > 0,
    });
  } catch (error) {
    console.error("🔍 DEBUG: Error updating company settings:", error);
    return NextResponse.json({ message: "Error al guardar la configuración" }, { status: 500 });
  }
}