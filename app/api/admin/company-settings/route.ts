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
          precioHoraDiurno: 3.0,
          precioHoraNocturno: 4.0,
          tasaCambio: 35.0,
          horaInicioNocturno: "00:00",
          horaFinNocturno: "06:00",
        },
      })
    }

    // Migrar configuración antigua a nueva estructura si es necesario
    if (settings.tarifas && settings.tarifas.precioHora && !settings.tarifas.precioHoraDiurno) {
      settings.tarifas.precioHoraDiurno = settings.tarifas.precioHora
      settings.tarifas.precioHoraNocturno = settings.tarifas.precioHora * 1.3 // 30% más caro en la noche
      settings.tarifas.horaInicioNocturno = "00:00"
      settings.tarifas.horaFinNocturno = "06:00"
      delete settings.tarifas.precioHora // Remover campo antiguo
    }

    if (!settings.tarifas) {
      settings.tarifas = {
        precioHoraDiurno: 3.0,
        precioHoraNocturno: 4.0,
        tasaCambio: 35.0,
        horaInicioNocturno: "00:00",
        horaFinNocturno: "06:00",
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
      typeof settings.tarifas.precioHoraDiurno !== "number" ||
      typeof settings.tarifas.precioHoraNocturno !== "number" ||
      typeof settings.tarifas.tasaCambio !== "number"
    ) {
      return NextResponse.json({ message: "Datos de tarifas inválidos" }, { status: 400 })
    }

    if (settings.tarifas) {
      settings.tarifas.precioHoraDiurno = Number.parseFloat(settings.tarifas.precioHoraDiurno.toFixed(2))
      settings.tarifas.precioHoraNocturno = Number.parseFloat(settings.tarifas.precioHoraNocturno.toFixed(2))
      settings.tarifas.tasaCambio = Number.parseFloat(settings.tarifas.tasaCambio.toFixed(2))

      // Validar formato de horas
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(settings.tarifas.horaInicioNocturno) || !timeRegex.test(settings.tarifas.horaFinNocturno)) {
        return NextResponse.json({ message: "Formato de hora inválido. Use HH:mm" }, { status: 400 })
      }
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
