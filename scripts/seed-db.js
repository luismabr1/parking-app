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

// Lista de bancos venezolanos
const venezuelanBanks = [
  { code: "0102", name: "Banco de Venezuela (BDV)" },
  { code: "0105", name: "Banco Mercantil" },
  { code: "0108", name: "BBVA Provincial" },
  { code: "0134", name: "Banesco" },
  { code: "0115", name: "Banco Exterior" },
  { code: "0116", name: "Banco Occidental de Descuento (BOD)" },
  { code: "0191", name: "Banco Nacional de Crédito (BNC)" },
  { code: "0114", name: "Bancaribe" },
  { code: "0138", name: "Banco Plaza" },
  { code: "0171", name: "Banco Activo" },
  { code: "0128", name: "Banco Caroní" },
  { code: "0151", name: "Banco Fondo Común (BFC)" },
  { code: "0168", name: "Bancrecer" },
  { code: "0104", name: "Banco Venezolano de Crédito (BVC)" },
  { code: "0137", name: "Sofitasa" },
  { code: "0166", name: "Banco Agrícola de Venezuela" },
  { code: "0172", name: "Banavap" },
  { code: "0169", name: "Mi Banco" },
  { code: "0163", name: "Banco del Tesoro" },
  { code: "0175", name: "Banco Bicentenario del Pueblo" },
  { code: "0177", name: "Banco de la Fuerza Armada Nacional Bolivariana (BanFANB)" },
  { code: "0174", name: "Banco Universal" },
  { code: "0000", name: "Otros Bancos (Genérico)" },
]

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
    await db.createCollection("banks")

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
        banco: "Banco de Venezuela (BDV)",
        cedula: "J-12345678-9",
        telefono: "0414-1234567",
      },
      transferencia: {
        banco: "Banco de Venezuela (BDV)",
        cedula: "J-12345678-9",
        telefono: "0212-1234567",
        numeroCuenta: "0102-0000-00-0000000000",
      },
    }

    await db.collection("company_settings").deleteMany({})
    await db.collection("company_settings").insertOne(companySettings)
    console.log("✅ Configuración de empresa insertada")

    // Insertar bancos venezolanos
    await db.collection("banks").deleteMany({})
    await db.collection("banks").insertMany(venezuelanBanks)
    console.log(`✅ ${venezuelanBanks.length} bancos insertados`)

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
