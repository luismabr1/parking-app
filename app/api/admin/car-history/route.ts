import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""

    const client = await clientPromise
    const db = client.db("parking")

    let query = {}
    if (search) {
      query = {
        $or: [
          { placa: { $regex: search, $options: "i" } },
          { nombreDueño: { $regex: search, $options: "i" } },
          { marca: { $regex: search, $options: "i" } },
          { ticketAsociado: { $regex: search, $options: "i" } },
        ],
      }
    }

    const total = await db.collection("car_history").countDocuments(query)
    const history = await db
      .collection("car_history")
      .find(query)
      .sort({ fechaRegistro: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    return NextResponse.json({
      history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching car history:", error)
    return NextResponse.json({ message: "Error al obtener historial" }, { status: 500 })
  }
}
