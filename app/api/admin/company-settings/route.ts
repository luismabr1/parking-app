import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    let settings = await db.collection("company_settings").findOne({})

    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = {
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
      }

      await db.collection("company_settings").insertOne(defaultSettings)
      settings = defaultSettings
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching company settings:", error)
    return NextResponse.json({ message: "Error al obtener la configuración" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const settings = await request.json()

    // Remove _id field if it exists to avoid MongoDB immutable field error
    const { _id, ...settingsWithoutId } = settings

    const client = await clientPromise
    const db = client.db("parking")

    // Check if settings document exists
    const existingSettings = await db.collection("company_settings").findOne({})

    if (existingSettings) {
      // Update existing document using updateOne with $set
      const result = await db
        .collection("company_settings")
        .updateOne({ _id: existingSettings._id }, { $set: settingsWithoutId })

      if (result.matchedCount === 0) {
        throw new Error("No se pudo actualizar la configuración")
      }
    } else {
      // Insert new document if none exists
      await db.collection("company_settings").insertOne(settingsWithoutId)
    }

    return NextResponse.json({ success: true, message: "Configuración actualizada exitosamente" })
  } catch (error) {
    console.error("Error updating company settings:", error)
    return NextResponse.json({ message: "Error al actualizar la configuración" }, { status: 500 })
  }
}
