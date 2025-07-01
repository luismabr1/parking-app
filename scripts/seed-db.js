/**
 * Este script inicializa la base de datos MongoDB con la configuración básica
 * Sin datos dummy - listo para datos reales
 *
 * Para ejecutar:
 * 1. Asegúrate de tener configurada la variable MONGODB_URI en .env.local
 * 2. Ejecute: npm run seed
 */

const { MongoClient } = require("mongodb")
require("dotenv").config({ path: ".env" })

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
    console.log("🧹 Limpiando datos existentes...")
    await db.collection("tickets").deleteMany({})
    await db.collection("pagos").deleteMany({})
    await db.collection("cars").deleteMany({})
    await db.collection("car_history").deleteMany({})
    await db.collection("staff").deleteMany({})

    // 1. Insertar configuración unificada de la empresa
    console.log("⚙️ Insertando configuración de la empresa...")
    const companySettings = {
      // Datos generales de la empresa
      nombreEmpresa: "Estacionamiento Central",
      direccion: "Av. Principal, Centro",
      telefono: "+58-212-555-0000",
      email: "info@estacionamiento.com",
      moneda: "VES",
      tarifaPorHora: 2.0,
      tasaCambio: 36.0, // VES por USD
      tiempoGracia: 15, // minutos
      espaciosDisponibles: 50,
      fechaActualizacion: new Date(),

      // Configuración de métodos de pago electrónico
      pagoMovil: {
        banco: "Banco de Venezuela (BDV)",
        cedula: "V-00000000",
        telefono: "0000-0000000",
      },
      transferencia: {
        banco: "Banco de Venezuela (BDV)",
        cedula: "V-00000000",
        telefono: "0000-0000000",
        numeroCuenta: "0102-0000-00-0000000000",
      },
    }

    await db.collection("company_settings").deleteMany({})
    await db.collection("company_settings").insertOne(companySettings)
    console.log("✅ Configuración de empresa insertada")

    // 2. Crear tickets/espacios disponibles (sin asignar)
    console.log("🎫 Creando espacios de estacionamiento...")
    const tickets = []
    for (let i = 1; i <= 50; i++) {
      tickets.push({
        codigoTicket: `PARK${i.toString().padStart(3, "0")}`,
        estado: "disponible",
        fechaCreacion: new Date(),
        horaOcupacion: null,
        horaConfirmacion: null,
        montoCalculado: 0,
        carInfo: null,
        ultimoPagoId: null,
      })
    }

    const result = await db.collection("tickets").insertMany(tickets)
    console.log(`✅ ${result.insertedCount} espacios de estacionamiento creados`)

    // 3. Crear usuario administrador básico
    console.log("👤 Creando usuario administrador...")
    const adminUser = {
      nombre: "Admin",
      apellido: "Sistema",
      email: "admin@estacionamiento.com",
      password: "admin123", // En producción debe estar hasheado
      rol: "administrador",
      fechaCreacion: new Date(),
      activo: true,
    }

    const staffResult = await db.collection("staff").insertOne(adminUser)
    console.log("✅ Usuario administrador creado")

    // 4. Insertar bancos venezolanos
    console.log("🏦 Insertando bancos venezolanos...")
    await db.collection("banks").deleteMany({})
    await db.collection("banks").insertMany(venezuelanBanks)
    console.log(`✅ ${venezuelanBanks.length} bancos insertados`)

    console.log("\n🎉 Base de datos inicializada para datos reales")
    console.log("\n📋 CONFIGURACIÓN BÁSICA:")
    console.log("   🏢 Empresa: Estacionamiento Central")
    console.log("   💰 Tarifa: 2.0 VES/hora")
    console.log("   💱 Tasa de cambio: 36.0 VES/USD")
    console.log("   ⏰ Tiempo de gracia: 15 minutos")
    console.log("   🅿️ Espacios disponibles: 50")

    console.log("\n📋 ESPACIOS CREADOS:")
    console.log("   📝 PARK001-PARK050: Todos disponibles")
    console.log("   ⚠️  Listos para registrar vehículos reales")

    console.log("\n🚗 FLUJO DE TRABAJO:")
    console.log("   1. 📸 Registrar vehículo real con fotos")
    console.log("   2. ✅ Confirmar estacionamiento")
    console.log("   3. 💳 Cliente realiza pago")
    console.log("   4. ✅ Validar pago recibido")
    console.log("   5. 🚪 Procesar salida del vehículo")

    console.log("\n🔐 Acceso al sistema:")
    console.log("   URL: http://localhost:3000/admin")
    console.log("   Usuario: admin")
    console.log("   Contraseña: admin123")

    console.log("\n✨ SISTEMA LIMPIO Y LISTO:")
    console.log("   • Sin datos dummy")
    console.log("   • Configuración básica lista")
    console.log("   • 50 espacios disponibles")
    console.log("   • Bancos venezolanos configurados")
    console.log("   • Listo para datos reales")

    console.log("\n⚠️  IMPORTANTE:")
    console.log("   • Actualiza los datos de pago en Configuración")
    console.log("   • Ajusta tarifas según tus necesidades")
    console.log("   • Cambia la contraseña del administrador")
  } catch (err) {
    console.error("❌ Error:", err)
  } finally {
    await client.close()
    console.log("\n🔌 Conexión cerrada")
  }
}

seedDatabase()
