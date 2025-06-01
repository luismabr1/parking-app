/**
 * Este script crea datos de ejemplo en la base de datos MongoDB
 *
 * Para ejecutar:
 * 1. Asegúrate de tener configurada la variable MONGODB_URI en .env.local
 * 2. Ejecute: npm run seed
 */

const { MongoClient } = require("mongodb")
require("dotenv").config({ path: ".env.local" })

const uri = process.env.MONGODB_URI

if (!uri) {
  console.error("Error: MONGODB_URI no está definido en las variables de entorno")
  console.error("Asegúrate de tener un archivo .env.local con la variable MONGODB_URI")
  process.exit(1)
}

// Añadir la inicialización de la configuración de la empresa
async function seedDatabase() {
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log("✅ Conectado a MongoDB Atlas")

    const db = client.db("parking")

    // Crear colecciones si no existen
    await db.createCollection("tickets")
    await db.createCollection("pagos")
    await db.createCollection("staff")
    await db.createCollection("company_settings")

    // Limpiar datos existentes
    await db.collection("tickets").deleteMany({})
    await db.collection("pagos").deleteMany({})

    // Crear tickets de ejemplo
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)

    const tickets = [
      {
        codigoTicket: "TEST001",
        horaEntrada: oneHourAgo,
        horaSalida: null,
        estado: "activo",
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "TEST002",
        horaEntrada: twoHoursAgo,
        horaSalida: null,
        estado: "activo",
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "TEST003",
        horaEntrada: threeHoursAgo,
        horaSalida: null,
        estado: "activo",
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "ABC123",
        horaEntrada: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
        horaSalida: null,
        estado: "activo",
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "XYZ789",
        horaEntrada: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
        horaSalida: null,
        estado: "activo",
        montoCalculado: 0,
        ultimoPagoId: null,
      },
    ]

    const result = await db.collection("tickets").insertMany(tickets)
    console.log(`✅ ${result.insertedCount} tickets insertados`)

    // Crear datos de ejemplo para el personal
    const staffMembers = [
      {
        nombre: "Admin",
        apellido: "Sistema",
        email: "admin@estacionamiento.com",
        rol: "administrador",
        fechaCreacion: new Date(),
      },
      {
        nombre: "Operador",
        apellido: "Ejemplo",
        email: "operador@estacionamiento.com",
        rol: "operador",
        fechaCreacion: new Date(),
      },
    ]

    await db.collection("staff").deleteMany({})
    const staffResult = await db.collection("staff").insertMany(staffMembers)
    console.log(`✅ ${staffResult.insertedCount} miembros del personal insertados`)

    // Crear configuración de empresa de ejemplo
    const companySettings = {
      pagoMovil: {
        banco: "Banco Nacional",
        cedula: "J-12345678-9",
        telefono: "0414-1234567",
      },
      transferencia: {
        banco: "Banco de Venezuela",
        cedula: "J-12345678-9",
        telefono: "0212-1234567",
        numeroCuenta: "0102-0000-00-0000000000",
      },
    }

    await db.collection("company_settings").deleteMany({})
    await db.collection("company_settings").insertOne(companySettings)
    console.log("✅ Configuración de empresa insertada")

    console.log("\n🎉 Base de datos inicializada con datos de ejemplo")
    console.log("\n📋 Códigos de tickets disponibles para pruebas:")
    tickets.forEach((ticket, index) => {
      const timeAgo = Math.floor((Date.now() - ticket.horaEntrada.getTime()) / (1000 * 60))
      const estimatedCost = Math.max(timeAgo * 0.05, 1).toFixed(2)
      console.log(`   ${index + 1}. ${ticket.codigoTicket} (${timeAgo} min atrás, ~$${estimatedCost})`)
    })

    console.log("\n💡 Puedes usar cualquiera de estos códigos en la aplicación para probar el flujo de pago.")
    console.log("\n🔐 Acceso al panel de administración:")
    console.log("   URL: http://localhost:3000/admin")
    console.log("   Usuario: admin")
    console.log("   Contraseña: admin123")
    console.log("   (O puedes usar el botón de 'Acceso Rápido')")
  } catch (err) {
    console.error("❌ Error:", err)
  } finally {
    await client.close()
    console.log("\n🔌 Conexión cerrada")
  }
}

seedDatabase()
