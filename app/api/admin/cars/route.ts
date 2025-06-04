import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

// Opt out of caching for this route
export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    const cars = await db.collection("cars").find({}).sort({ fechaRegistro: -1 }).toArray()

    // Agregar headers anti-cache
    const response = NextResponse.json(cars)
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    response.headers.set("Surrogate-Control", "no-store")

    return response
  } catch (error) {
    console.error("Error fetching cars:", error)
    return NextResponse.json({ message: "Error al obtener carros" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    const body = await request.json()
    const {
      placa,
      marca,
      modelo,
      color,
      nombreDueño,
      telefono,
      ticketAsociado,
      imagenes, // Nuevo campo para imágenes
    } = body

    // Validar campos requeridos
    if (!placa || !ticketAsociado) {
      return NextResponse.json({ message: "Placa y ticket son requeridos" }, { status: 400 })
    }

    // Verificar que el ticket existe y está disponible
    const ticket = await db.collection("tickets").findOne({ codigoTicket: ticketAsociado })

    if (!ticket) {
      return NextResponse.json({ message: "Ticket no encontrado" }, { status: 404 })
    }

    if (ticket.estado !== "disponible") {
      return NextResponse.json({ message: "El ticket no está disponible" }, { status: 400 })
    }

    // Verificar que no existe otro carro con la misma placa activo
    const existingCar = await db.collection("cars").findOne({
      placa: placa.toUpperCase(),
      estado: { $in: ["estacionado", "pagado"] },
    })

    if (existingCar) {
      return NextResponse.json({ message: "Ya existe un carro con esta placa estacionado" }, { status: 400 })
    }

    // Crear el registro del carro
    const carData = {
      placa: placa.toUpperCase(),
      marca: marca || "Por definir",
      modelo: modelo || "Por definir",
      color: color || "Por definir",
      nombreDueño: nombreDueño || "Por definir",
      telefono: telefono || "Por definir",
      ticketAsociado,
      horaIngreso: new Date(),
      estado: "estacionado",
      fechaRegistro: new Date(),
      imagenes: imagenes
        ? {
            ...imagenes,
            fechaCaptura: new Date(),
          }
        : undefined,
    }

    const result = await db.collection("cars").insertOne(carData)

    // Actualizar el estado del ticket a ocupado
    await db.collection("tickets").updateOne(
      { codigoTicket: ticketAsociado },
      {
        $set: {
          estado: "ocupado",
          horaOcupacion: new Date(),
          carInfo: {
            placa: placa.toUpperCase(),
            marca: marca || "Por definir",
            modelo: modelo || "Por definir",
            color: color || "Por definir",
            nombreDueño: nombreDueño || "Por definir",
            telefono: telefono || "Por definir",
          },
        },
      },
    )

    // Agregar headers anti-cache
    const response = NextResponse.json({
      message: "Carro registrado exitosamente",
      carId: result.insertedId,
      imagenes: imagenes ? "Imágenes guardadas" : "Sin imágenes",
    })
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    response.headers.set("Surrogate-Control", "no-store")

    return response
  } catch (error) {
    console.error("Error creating car:", error)
    return NextResponse.json({ message: "Error al registrar el carro" }, { status: 500 })
  }
}
