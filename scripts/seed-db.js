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
    await db.createCollection("cars")
    await db.createCollection("car_history")

    // Limpiar datos existentes
    await db.collection("tickets").deleteMany({})
    await db.collection("pagos").deleteMany({})
    await db.collection("cars").deleteMany({})
    await db.collection("car_history").deleteMany({})

    // Crear tickets de ejemplo con nuevo formato
    const tickets = [
      // Tickets nuevos disponibles para asignar
      {
        codigoTicket: "PARK001",
        estado: "disponible",
        fechaCreacion: new Date(),
        horaOcupacion: null,
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "PARK002",
        estado: "disponible",
        fechaCreacion: new Date(),
        horaOcupacion: null,
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "PARK003",
        estado: "disponible",
        fechaCreacion: new Date(),
        horaOcupacion: null,
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "PARK004",
        estado: "disponible",
        fechaCreacion: new Date(),
        horaOcupacion: null,
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "PARK005",
        estado: "disponible",
        fechaCreacion: new Date(),
        horaOcupacion: null,
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      // Tickets de prueba con carros asignados (LISTOS PARA PAGAR)
      {
        codigoTicket: "TEST001",
        horaEntrada: new Date(Date.now() - 60 * 60 * 1000), // 1 hora atrás
        horaSalida: null,
        estado: "ocupado", // Estado correcto para que funcione la búsqueda
        horaOcupacion: new Date(Date.now() - 60 * 60 * 1000),
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "TEST002",
        horaEntrada: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        horaSalida: null,
        estado: "ocupado", // Estado correcto para que funcione la búsqueda
        horaOcupacion: new Date(Date.now() - 2 * 60 * 60 * 1000),
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      // Tickets legacy activos (LISTOS PARA PAGAR)
      {
        codigoTicket: "ABC123",
        horaEntrada: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
        horaSalida: null,
        estado: "activo", // Estado legacy
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "XYZ789",
        horaEntrada: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
        horaSalida: null,
        estado: "activo", // Estado legacy
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "TEST003",
        horaEntrada: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 horas atrás
        horaSalida: null,
        estado: "activo", // Estado legacy
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

    // Crear algunos carros de ejemplo correctamente asociados
    const exampleCars = [
      {
        placa: "ABC123",
        marca: "Toyota",
        modelo: "Corolla",
        color: "Blanco",
        nombreDueño: "Juan Pérez",
        telefono: "0414-1234567",
        ticketAsociado: "TEST001",
        horaIngreso: new Date(Date.now() - 60 * 60 * 1000),
        estado: "estacionado",
        fechaRegistro: new Date(),
      },
      {
        placa: "XYZ789",
        marca: "Chevrolet",
        modelo: "Aveo",
        color: "Azul",
        nombreDueño: "María González",
        telefono: "0424-9876543",
        ticketAsociado: "TEST002",
        horaIngreso: new Date(Date.now() - 2 * 60 * 60 * 1000),
        estado: "estacionado",
        fechaRegistro: new Date(),
      },
    ]

    const carsResult = await db.collection("cars").insertMany(exampleCars)
    console.log(`✅ ${carsResult.insertedCount} carros de ejemplo insertados`)

    // Crear entradas en el historial para los carros de ejemplo
    const historyEntries = [
      {
        carId: carsResult.insertedIds[0].toString(),
        placa: "ABC123",
        marca: "Toyota",
        modelo: "Corolla",
        color: "Blanco",
        nombreDueño: "Juan Pérez",
        telefono: "0414-1234567",
        ticketAsociado: "TEST001",
        horaIngreso: new Date(Date.now() - 60 * 60 * 1000),
        horaSalida: null,
        montoTotal: 0,
        pagoId: null,
        estado: "activo",
        fechaRegistro: new Date(),
      },
      {
        carId: carsResult.insertedIds[1].toString(),
        placa: "XYZ789",
        marca: "Chevrolet",
        modelo: "Aveo",
        color: "Azul",
        nombreDueño: "María González",
        telefono: "0424-9876543",
        ticketAsociado: "TEST002",
        horaIngreso: new Date(Date.now() - 2 * 60 * 60 * 1000),
        horaSalida: null,
        montoTotal: 0,
        pagoId: null,
        estado: "activo",
        fechaRegistro: new Date(),
      },
    ]

    await db.collection("car_history").insertMany(historyEntries)
    console.log(`✅ ${historyEntries.length} entradas de historial creadas`)

    console.log("\n🎉 Base de datos inicializada con datos de ejemplo")
    console.log("\n🚗 TICKETS LISTOS PARA PAGAR (con carros asignados):")
    console.log("   ✅ TEST001: Toyota Corolla (ABC123) - Juan Pérez - $3.00 aprox")
    console.log("   ✅ TEST002: Chevrolet Aveo (XYZ789) - María González - $6.00 aprox")
    console.log("   ✅ ABC123: Ticket legacy - $1.50 aprox (30 min)")
    console.log("   ✅ XYZ789: Ticket legacy - $12.00 aprox (4 horas)")
    console.log("   ✅ TEST003: Ticket legacy - $9.00 aprox (3 horas)")

    console.log("\n📋 TICKETS DISPONIBLES (sin carros asignados):")
    console.log("   📝 PARK001-PARK005: Disponibles para asignar nuevos carros")
    console.log("   ⚠️  Estos NO se pueden buscar hasta asignar un carro")

    console.log("\n🧪 PRUEBAS RECOMENDADAS:")
    console.log("   1. 🔍 Buscar TEST001, TEST002, ABC123, XYZ789, TEST003")
    console.log("   2. 💳 Completar proceso de pago para cualquiera")
    console.log("   3. 🚗 Registrar nuevo carro con PARK001 en panel admin")
    console.log("   4. 🔍 Buscar PARK001 después de asignar carro")

    console.log("\n🔐 Acceso al panel de administración:")
    console.log("   URL: http://localhost:3000/admin")
    console.log("   Usuario: admin")
    console.log("   Contraseña: admin123")
  } catch (err) {
    console.error("❌ Error:", err)
  } finally {
    await client.close()
    console.log("\n🔌 Conexión cerrada")
  }
}

seedDatabase()
