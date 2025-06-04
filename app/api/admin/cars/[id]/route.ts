import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()

    // Validar que el ID sea válido
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID de vehículo inválido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Preparar los datos para actualizar
    const updateData = {
      placa: body.placa?.trim().toUpperCase(),
      marca: body.marca?.trim(),
      modelo: body.modelo?.trim(),
      color: body.color?.trim(),
      nombreDueño: body.nombreDueño?.trim(),
      telefono: body.telefono?.trim(),
      fechaActualizacion: new Date().toISOString(),
    }

    // Validar campos requeridos
    if (
      !updateData.placa ||
      !updateData.marca ||
      !updateData.modelo ||
      !updateData.color ||
      !updateData.nombreDueño ||
      !updateData.telefono
    ) {
      return NextResponse.json({ message: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Verificar si existe otro vehículo con la misma placa (excluyendo el actual)
    const existingCar = await db.collection("cars").findOne({
      placa: updateData.placa,
      _id: { $ne: new ObjectId(id) },
    })

    if (existingCar) {
      return NextResponse.json(
        { message: `Ya existe un vehículo registrado con la placa ${updateData.placa}` },
        { status: 400 },
      )
    }

    // Actualizar el vehículo
    const result = await db.collection("cars").updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Vehículo no encontrado" }, { status: 404 })
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: "No se realizaron cambios" }, { status: 200 })
    }

    return NextResponse.json(
      {
        message: "Información del vehículo actualizada correctamente",
        modifiedCount: result.modifiedCount,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error updating car:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Validar que el ID sea válido
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID de vehículo inválido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Verificar que el vehículo existe
    const car = await db.collection("cars").findOne({ _id: new ObjectId(id) })

    if (!car) {
      return NextResponse.json({ message: "Vehículo no encontrado" }, { status: 404 })
    }

    // Liberar el ticket asociado
    if (car.ticketAsociado) {
      await db.collection("tickets").updateOne({ codigoTicket: car.ticketAsociado }, { $set: { estado: "disponible" } })
    }

    // Eliminar el vehículo
    const result = await db.collection("cars").deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json(
      {
        message: `Vehículo ${car.placa} eliminado correctamente`,
        ticketLiberado: car.ticketAsociado,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error deleting car:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
