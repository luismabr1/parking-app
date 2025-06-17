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
      imagenes, // Campo para imágenes
    } = body

    console.log("🚗 CREATING CAR:", {
      placa,
      ticketAsociado,
      hasImagenes: !!imagenes,
      imagenesKeys: imagenes ? Object.keys(imagenes) : [],
    })

    // Validar campos requeridos - solo ticket es obligatorio
    if (!ticketAsociado) {
      return NextResponse.json({ message: "Ticket es requerido" }, { status: 400 })
    }

    // Si no hay placa, usar placeholder
    const placaFinal = placa && placa.trim() ? placa.toUpperCase() : "PENDIENTE"

    // Log específico para imágenes
    if (imagenes) {
      console.log("📸 IMAGES DATA:", {
        hasPlateImage: !!imagenes.plateImageUrl,
        hasVehicleImage: !!imagenes.vehicleImageUrl,
        plateImageLength: imagenes.plateImageUrl ? imagenes.plateImageUrl.length : 0,
        vehicleImageLength: imagenes.vehicleImageUrl ? imagenes.vehicleImageUrl.length : 0,
        plateImageType: imagenes.plateImageUrl ? imagenes.plateImageUrl.substring(0, 30) : "none",
        vehicleImageType: imagenes.vehicleImageUrl ? imagenes.vehicleImageUrl.substring(0, 30) : "none",
      })
    }

    // Resto del código de validación...
    const ticket = await db.collection("tickets").findOne({ codigoTicket: ticketAsociado })

    if (!ticket) {
      return NextResponse.json({ message: "Ticket no encontrado" }, { status: 404 })
    }

    if (ticket.estado !== "disponible") {
      return NextResponse.json({ message: "El ticket no está disponible" }, { status: 400 })
    }

    const existingCar = await db.collection("cars").findOne({
      placa: placa.toUpperCase(),
      estado: { $in: ["estacionado", "pagado"] },
    })

    if (existingCar) {
      return NextResponse.json({ message: "Ya existe un carro con esta placa estacionado" }, { status: 400 })
    }

    // Crear el registro del carro con logging detallado
    const carData = {
      placa: placaFinal,
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

    console.log("💾 SAVING CAR DATA:", {
      placa: carData.placa,
      hasImagenes: !!carData.imagenes,
      imagenesStructure: carData.imagenes ? Object.keys(carData.imagenes) : [],
    })

    const result = await db.collection("cars").insertOne(carData)

    // Verificar que se guardó correctamente
    const savedCar = await db.collection("cars").findOne({ _id: result.insertedId })
    console.log("✅ CAR SAVED:", {
      id: result.insertedId,
      hasImagenes: !!savedCar?.imagenes,
      imagenesKeys: savedCar?.imagenes ? Object.keys(savedCar.imagenes) : [],
    })

    // Resto del código...
    await db.collection("tickets").updateOne(
      { codigoTicket: ticketAsociado },
      {
        $set: {
          estado: "ocupado",
          horaOcupacion: new Date(),
          carInfo: {
            placa: placaFinal,
            marca: marca || "Por definir",
            modelo: modelo || "Por definir",
            color: color || "Por definir",
            nombreDueño: nombreDueño || "Por definir",
            telefono: telefono || "Por definir",
          },
        },
      },
    )

    const response = NextResponse.json({
      message: "Carro registrado exitosamente",
      carId: result.insertedId,
      imagenes: imagenes ? "Imágenes guardadas" : "Sin imágenes",
      debug: {
        hasImagenes: !!imagenes,
        imagenesKeys: imagenes ? Object.keys(imagenes) : [],
      },
    })

    // Headers anti-cache
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
