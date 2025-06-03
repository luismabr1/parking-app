import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export const fetchCache = "force-no-store"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    const cars = await db.collection("cars").find({}).sort({ horaIngreso: -1 }).toArray()

    const response = NextResponse.json(cars)
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

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
    const { placa, marca, modelo, color, nombreDueño, telefono, ticketAsociado } = body

    // Verificar si el ticket está disponible
    const ticket = await db.collection("tickets").findOne({
      codigoTicket: ticketAsociado,
      estado: "disponible",
    })

    if (!ticket) {
      return NextResponse.json({ message: "El ticket seleccionado no está disponible" }, { status: 400 })
    }

    // Verificar si la placa ya está registrada y activa
    const existingCar = await db.collection("cars").findOne({
      placa: placa.toUpperCase(),
      estado: "estacionado",
    })

    if (existingCar) {
      return NextResponse.json({ message: "Ya existe un carro con esta placa estacionado" }, { status: 400 })
    }

    // Crear el registro del carro
    const newCar = {
      placa: placa.toUpperCase(),
      marca,
      modelo,
      color,
      nombreDueño,
      telefono,
      ticketAsociado,
      horaIngreso: new Date().toISOString(),
      estado: "estacionado",
    }

    await db.collection("cars").insertOne(newCar)

    // Actualizar el estado del ticket a ocupado
    await db.collection("tickets").updateOne({ codigoTicket: ticketAsociado }, { $set: { estado: "ocupado" } })

    return NextResponse.json({ message: "Carro registrado exitosamente" })
  } catch (error) {
    console.error("Error registering car:", error)
    return NextResponse.json({ message: "Error al registrar el carro" }, { status: 500 })
  }
}
