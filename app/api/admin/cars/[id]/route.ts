// Agregar método PUT para actualizar datos del vehículo

import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { placa, marca, modelo, color } = await request.json()

    const client = await clientPromise
    const db = client.db("parking")

    const result = await db.collection("cars").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          placa: placa?.toUpperCase() || "",
          marca: marca || "",
          modelo: modelo || "",
          color: color || "",
          lastModified: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating car:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
