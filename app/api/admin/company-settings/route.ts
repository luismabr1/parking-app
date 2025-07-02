import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    const settings = await db.collection("company_settings").findOne({})

    if (!settings) {
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
      })
    }

    if (!settings.tarifas) {
      settings.tarifas = {
        precioHora: 3.0,
        tasaCambio: 35.0,
      }
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching company settings:", error)
    return NextResponse.json({ message: "Error al obtener la configuración" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    const body = await req.json()
    const settings = body

    if (
      !settings.tarifas ||
      typeof settings.tarifas.precioHora !== "number" ||
      typeof settings.tarifas.tasaCambio !== "number"
    ) {
      return NextResponse.json({ message: "Datos de tarifas inválidos" }, { status: 400 })
    }

    if (settings.tarifas) {
      settings.tarifas.precioHora = Number.parseFloat(settings.tarifas.precioHora.toFixed(2))
      settings.tarifas.tasaCambio = Number.parseFloat(settings.tarifas.tasaCambio.toFixed(2))
    }

    const result = await db.collection("company_settings").updateOne({}, { $set: settings }, { upsert: true })

    return NextResponse.json({
      message: "Configuración guardada exitosamente",
      updated: result.modifiedCount > 0,
      created: result.upsertedCount > 0,
    })
  } catch (error) {
    console.error("Error updating company settings:", error)
    return NextResponse.json({ message: "Error al guardar la configuración" }, { status: 500 })
  }
}
