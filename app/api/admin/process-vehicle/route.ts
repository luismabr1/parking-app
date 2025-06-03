import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const type = formData.get("type") as string // "plate" o "vehicle"

    if (!image) {
      return NextResponse.json({ success: false, message: "No se recibió imagen" }, { status: 400 })
    }

    // Convertir imagen a buffer
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Configurar transformaciones según el tipo
    const transformations =
      type === "plate"
        ? [{ width: 800, height: 400, crop: "limit" }, { quality: "auto" }, { effect: "sharpen" }]
        : [{ width: 1200, height: 800, crop: "limit" }, { quality: "auto" }]

    // Subir imagen a Cloudinary
    const uploadResponse = (await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "image",
            folder: `parking-${type}s`,
            transformation: transformations,
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          },
        )
        .end(buffer)
    })) as any

    if (type === "plate") {
      // Procesar placa
      const plateText = await simulatePlateRecognition(uploadResponse.secure_url)
      return NextResponse.json({
        success: true,
        placa: plateText,
        imageUrl: uploadResponse.secure_url,
        confidence: 0.85,
      })
    } else {
      // Procesar vehículo completo
      const vehicleData = await simulateVehicleRecognition(uploadResponse.secure_url)
      return NextResponse.json({
        success: true,
        marca: vehicleData.marca,
        modelo: vehicleData.modelo,
        color: vehicleData.color,
        imageUrl: uploadResponse.secure_url,
        confidence: vehicleData.confidence,
      })
    }
  } catch (error) {
    console.error("Error processing vehicle:", error)
    return NextResponse.json({ success: false, message: "Error al procesar la imagen" }, { status: 500 })
  }
}

// Función simulada de reconocimiento de placa
async function simulatePlateRecognition(imageUrl: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"

  const randomPlate =
    letters.charAt(Math.floor(Math.random() * letters.length)) +
    letters.charAt(Math.floor(Math.random() * letters.length)) +
    letters.charAt(Math.floor(Math.random() * letters.length)) +
    numbers.charAt(Math.floor(Math.random() * numbers.length)) +
    numbers.charAt(Math.floor(Math.random() * numbers.length)) +
    numbers.charAt(Math.floor(Math.random() * numbers.length))

  return randomPlate
}

// Función simulada de reconocimiento de vehículo
async function simulateVehicleRecognition(imageUrl: string): Promise<{
  marca: string
  modelo: string
  color: string
  confidence: number
}> {
  await new Promise((resolve) => setTimeout(resolve, 3000))

  // Datos simulados basados en marcas populares en Venezuela
  const marcas = ["Toyota", "Chevrolet", "Ford", "Hyundai", "Nissan", "Kia", "Volkswagen", "Renault"]
  const modelos = {
    Toyota: ["Corolla", "Camry", "Yaris", "Hilux", "RAV4"],
    Chevrolet: ["Aveo", "Cruze", "Spark", "Captiva", "Silverado"],
    Ford: ["Fiesta", "Focus", "Escape", "F-150", "EcoSport"],
    Hyundai: ["Accent", "Elantra", "Tucson", "Santa Fe", "i10"],
    Nissan: ["Sentra", "Versa", "X-Trail", "Frontier", "March"],
    Kia: ["Rio", "Cerato", "Sportage", "Sorento", "Picanto"],
    Volkswagen: ["Gol", "Polo", "Jetta", "Tiguan", "Amarok"],
    Renault: ["Logan", "Sandero", "Duster", "Fluence", "Kwid"],
  }
  const colores = ["Blanco", "Negro", "Gris", "Plata", "Azul", "Rojo", "Verde", "Amarillo", "Beige", "Marrón"]

  const marcaSeleccionada = marcas[Math.floor(Math.random() * marcas.length)]
  const modelosDisponibles = modelos[marcaSeleccionada as keyof typeof modelos]
  const modeloSeleccionado = modelosDisponibles[Math.floor(Math.random() * modelosDisponibles.length)]
  const colorSeleccionado = colores[Math.floor(Math.random() * colores.length)]

  return {
    marca: marcaSeleccionada,
    modelo: modeloSeleccionado,
    color: colorSeleccionado,
    confidence: 0.75 + Math.random() * 0.2, // Entre 75% y 95%
  }
}
