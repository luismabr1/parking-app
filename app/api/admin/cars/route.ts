import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("parking")

    const cars = await db.collection("cars").find({}).sort({ fechaRegistro: -1 }).toArray()

    return NextResponse.json(cars)
  } catch (error) {
    console.error("Error fetching cars:", error)
    return NextResponse.json({ message: "Error al obtener carros" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const carData = await request.json()

    const client = await clientPromise
    const db = client.db("parking")

    // Verificar que el ticket esté disponible
    const ticket = await db.collection("tickets").findOne({
      codigoTicket: carData.ticketAsociado,
      estado: "disponible",
    })

    if (!ticket) {
      return NextResponse.json({ message: "El ticket seleccionado no está disponible" }, { status: 400 })
    }

    // Verificar que la placa no esté ya registrada y activa
    const existingCar = await db.collection("cars").findOne({
      placa: carData.placa,
      estado: "estacionado",
    })

    if (existingCar) {
      return NextResponse.json({ message: "Ya existe un carro con esta placa estacionado" }, { status: 400 })
    }

    // Crear el registro del carro
    const newCar = {
      ...carData,
      horaIngreso: new Date(),
      estado: "estacionado",
      fechaRegistro: new Date(),
    }

    const carResult = await db.collection("cars").insertOne(newCar)

    // Actualizar el ticket a ocupado
    await db.collection("tickets").updateOne(
      { codigoTicket: carData.ticketAsociado },
      {
        $set: {
          estado: "ocupado",
          horaOcupacion: new Date(),
        },
      },
    )

    // Crear entrada en el historial
    await db.collection("car_history").insertOne({
      carId: carResult.insertedId,
      placa: carData.placa,
      marca: carData.marca,
      modelo: carData.modelo,
      color: carData.color,
      nombreDueño: carData.nombreDueño,
      telefono: carData.telefono,
      ticketAsociado: carData.ticketAsociado,
      horaIngreso: new Date(),
      horaSalida: null,
      montoTotal: 0,
      pagoId: null,
      estado: "activo",
      fechaRegistro: new Date(),
    })

    return NextResponse.json({
      message: "Carro registrado exitosamente",
      carId: carResult.insertedId,
    })
  } catch (error) {
    console.error("Error registering car:", error)
    return NextResponse.json({ message: "Error al registrar el carro" }, { status: 500 })
  }
}
