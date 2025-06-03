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
        horaConfirmacion: null,
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "PARK002",
        estado: "disponible",
        fechaCreacion: new Date(),
        horaOcupacion: null,
        horaConfirmacion: null,
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "PARK003",
        estado: "disponible",
        fechaCreacion: new Date(),
        horaOcupacion: null,
        horaConfirmacion: null,
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "PARK004",
        estado: "disponible",
        fechaCreacion: new Date(),
        horaOcupacion: null,
        horaConfirmacion: null,
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "PARK005",
        estado: "disponible",
        fechaCreacion: new Date(),
        horaOcupacion: null,
        horaConfirmacion: null,
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      // Tickets con carros registrados pero pendientes de confirmación
      {
        codigoTicket: "PARK006",
        estado: "ocupado",
        fechaCreacion: new Date(),
        horaOcupacion: new Date(Date.now() - 10 * 60 * 1000), // 10 minutos atrás
        horaConfirmacion: null,
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "PARK007",
        estado: "ocupado",
        fechaCreacion: new Date(),
        horaOcupacion: new Date(Date.now() - 15 * 60 * 1000), // 15 minutos atrás
        horaConfirmacion: null,
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      // Tickets confirmados y listos para pagar
      {
        codigoTicket: "TEST001",
        horaEntrada: new Date(Date.now() - 60 * 60 * 1000), // 1 hora atrás
        horaSalida: null,
        estado: "estacionado_confirmado",
        horaOcupacion: new Date(Date.now() - 60 * 60 * 1000),
        horaConfirmacion: new Date(Date.now() - 55 * 60 * 1000), // Confirmado 5 min después
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "TEST002",
        horaEntrada: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        horaSalida: null,
        estado: "estacionado_confirmado",
        horaOcupacion: new Date(Date.now() - 2 * 60 * 60 * 1000),
        horaConfirmacion: new Date(Date.now() - 115 * 60 * 1000), // Confirmado 5 min después
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      // Tickets legacy confirmados (LISTOS PARA PAGAR)
      {
        codigoTicket: "ABC123",
        horaEntrada: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
        horaSalida: null,
        estado: "estacionado_confirmado",
        horaConfirmacion: new Date(Date.now() - 25 * 60 * 1000),
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "XYZ789",
        horaEntrada: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
        horaSalida: null,
        estado: "estacionado_confirmado",
        horaConfirmacion: new Date(Date.now() - 235 * 60 * 1000),
        montoCalculado: 0,
        ultimoPagoId: null,
      },
      {
        codigoTicket: "TEST003",
        horaEntrada: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 horas atrás
        horaSalida: null,
        estado: "estacionado_confirmado",
        horaConfirmacion: new Date(Date.now() - 175 * 60 * 1000),
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
      // Carros confirmados y listos para pagar
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
      // Carros registrados pero pendientes de confirmación
      {
        placa: "DEF456",
        marca: "Ford",
        modelo: "Fiesta",
        color: "Rojo",
        nombreDueño: "Carlos Rodríguez",
        telefono: "0412-5555555",
        ticketAsociado: "PARK006",
        horaIngreso: new Date(Date.now() - 10 * 60 * 1000),
        estado: "registrado",
        fechaRegistro: new Date(),
      },
      {
        placa: "GHI789",
        marca: "Nissan",
        modelo: "Sentra",
        color: "Negro",
        nombreDueño: "Ana López",
        telefono: "0416-7777777",
        ticketAsociado: "PARK007",
        horaIngreso: new Date(Date.now() - 15 * 60 * 1000),
        estado: "registrado",
        fechaRegistro: new Date(),
      },
    ]

    const carsResult = await db.collection("cars").insertMany(exampleCars)
    console.log(`✅ ${carsResult.insertedCount} carros de ejemplo insertados`)

    // Crear entradas en el historial para los carros de ejemplo
    const historyEntries = [
      // Carros confirmados
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
        estado: "estacionado",
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
        estado: "estacionado",
        fechaRegistro: new Date(),
      },
      // Carros pendientes de confirmación
      {
        carId: carsResult.insertedIds[2].toString(),
        placa: "DEF456",
        marca: "Ford",
        modelo: "Fiesta",
        color: "Rojo",
        nombreDueño: "Carlos Rodríguez",
        telefono: "0412-5555555",
        ticketAsociado: "PARK006",
        horaIngreso: new Date(Date.now() - 10 * 60 * 1000),
        horaSalida: null,
        montoTotal: 0,
        pagoId: null,
        estado: "registrado",
        fechaRegistro: new Date(),
      },
      {
        carId: carsResult.insertedIds[3].toString(),
        placa: "GHI789",
        marca: "Nissan",
        modelo: "Sentra",
        color: "Negro",
        nombreDueño: "Ana López",
        telefono: "0416-7777777",
        ticketAsociado: "PARK007",
        horaIngreso: new Date(Date.now() - 15 * 60 * 1000),
        horaSalida: null,
        montoTotal: 0,
        pagoId: null,
        estado: "registrado",
        fechaRegistro: new Date(),
      },
    ]

    await db.collection("car_history").insertMany(historyEntries)
    console.log(`✅ ${historyEntries.length} entradas de historial creadas`)

    console.log("\n🎉 Base de datos inicializada con datos de ejemplo")
    console.log("\n🚗 TICKETS LISTOS PARA PAGAR (confirmados):")
    console.log("   ✅ TEST001: Toyota Corolla (ABC123) - Juan Pérez - $3.00 aprox")
    console.log("   ✅ TEST002: Chevrolet Aveo (XYZ789) - María González - $6.00 aprox")
    console.log("   ✅ ABC123: Ticket legacy - $1.50 aprox (25 min)")
    console.log("   ✅ XYZ789: Ticket legacy - $12.00 aprox (4 horas)")
    console.log("   ✅ TEST003: Ticket legacy - $9.00 aprox (3 horas)")

    console.log("\n⚠️  VEHÍCULOS PENDIENTES DE CONFIRMACIÓN:")
    console.log("   🚗 PARK006: Ford Fiesta (DEF456) - Carlos Rodríguez")
    console.log("   🚗 PARK007: Nissan Sentra (GHI789) - Ana López")
    console.log("   📋 Estos aparecen en la pestaña 'Confirmar' del admin")

    console.log("\n📋 TICKETS DISPONIBLES (sin carros asignados):")
    console.log("   📝 PARK001-PARK005: Disponibles para asignar nuevos carros")
    console.log("   ⚠️  Estos NO se pueden buscar hasta asignar un carro")

    console.log("\n🧪 PRUEBAS RECOMENDADAS:")
    console.log("   1. 🔍 Buscar TEST001, TEST002, ABC123, XYZ789, TEST003")
    console.log("   2. 📋 Confirmar PARK006 y PARK007 en pestaña 'Confirmar'")
    console.log("   3. 💳 Completar proceso de pago para cualquiera")
    console.log("   4. 🚗 Registrar nuevo carro con PARK001 en panel admin")
    console.log("   5. 🚪 Procesar salidas en pestaña 'Salidas'")
    console.log("   6. 📱 Generar y escanear códigos QR")

    console.log("\n🔐 Acceso al panel de administración:")
    console.log("   URL: http://localhost:3000/admin")
    console.log("   Usuario: admin")
    console.log("   Contraseña: admin123")
    console.log("\n🎯 FLUJO COMPLETO:")
    console.log(
      "   1. Registrar carro → 2. Confirmar estacionamiento → 3. Cliente paga → 4. Validar pago → 5. Procesar salida",
    )
  } catch (err) {
    console.error("❌ Error:", err)
  } finally {
    await client.close()
    console.log("\n🔌 Conexión cerrada")
  }
}

seedDatabase()
