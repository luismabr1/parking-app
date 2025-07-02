# Sistema de Estacionamiento - Aplicación Web Completa

Una aplicación web integral para la gestión completa de estacionamientos con registro de vehículos, control de espacios, procesamiento de pagos, tarifas diurnas/nocturnas y panel de administración avanzado.

## 🚀 Características Principales

### Para Clientes
- **Búsqueda de Tickets**: Los clientes pueden buscar sus tickets usando el código único
- **Cálculo Automático Inteligente**: El sistema calcula automáticamente el monto a pagar basado en el tiempo de estacionamiento y aplica tarifas diurnas o nocturnas según la hora
- **Proceso de Pago Guiado**: Formulario paso a paso para registrar transferencias bancarias
- **Información Bancaria Dinámica**: Muestra los datos bancarios configurados por la empresa
- **Confirmación de Pago**: Los clientes reciben confirmación inmediata del registro de su pago

### Para Personal del Estacionamiento
- **Panel de Administración Completo**: Interfaz integral para gestionar todo el sistema
- **Gestión de Espacios**: Crear y administrar tickets de estacionamiento (hasta 100 por lote)
- **Registro de Vehículos**: Sistema completo para registrar carros con datos del vehículo y propietario
- **Confirmación de Estacionamiento**: Verificar que el vehículo está correctamente estacionado antes de habilitar pagos
- **Control de Ocupación**: Asignación automática de espacios y control de disponibilidad
- **Gestión de Pagos**: Validar o rechazar pagos pendientes con información detallada
- **Salida de Vehículos**: Procesar la salida y liberar espacios automáticamente
- **Códigos QR**: Generar, imprimir y escanear códigos QR para cada espacio
- **Historial Completo**: Registro histórico de todos los vehículos que han usado el estacionamiento
- **Gestión de Personal**: Crear, editar y eliminar cuentas de personal
- **Configuración Avanzada de Empresa**: 
  - Configurar datos bancarios para pago móvil y transferencias
  - **Tarifas Diurnas y Nocturnas**: Configurar diferentes precios según la hora del día
  - **Horarios Personalizables**: Definir exactamente cuándo aplica cada tarifa
- **Estadísticas en Tiempo Real**: Dashboard con 8 métricas importantes y actualización automática
- **Búsqueda Avanzada**: Filtros y búsqueda en el historial de vehículos

## 🌙 Nueva Funcionalidad: Tarifas Diurnas y Nocturnas

### Características del Sistema de Tarifas
- **Tarifa Diurna**: Precio estándar durante el día
- **Tarifa Nocturna**: Precio diferenciado (generalmente más alto) durante la noche
- **Horarios Configurables**: Define exactamente cuándo inicia y termina el horario nocturno
- **Aplicación Automática**: El sistema aplica automáticamente la tarifa correcta según la hora actual
- **Cálculo Inteligente**: Considera la hora de salida para determinar qué tarifa aplicar

### Configuración de Horarios
- **Formato**: Usa formato de 24 horas (HH:mm)
- **Ejemplo**: Nocturno de 00:00 a 06:00 (medianoche a 6 AM)
- **Flexibilidad**: Puede configurar cualquier rango horario
- **Cruce de Medianoche**: Soporta horarios que cruzan medianoche

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Base de Datos**: MongoDB Atlas
- **Autenticación**: Sistema personalizado para administradores
- **Deployment**: Optimizado para Vercel

## 📋 Prerrequisitos

- Node.js 18+ instalado
- Cuenta en MongoDB Atlas (gratuita)
- Editor de código (VS Code recomendado)

## 🔧 Instalación

### 1. Clonar o Descargar el Proyecto

\`\`\`bash
# Si tienes el código en un repositorio
git clone <url-del-repositorio>
cd sistema-estacionamiento

# O simplemente descomprime los archivos en una carpeta
\`\`\`

### 2. Instalar Dependencias

\`\`\`bash
npm install
\`\`\`

### 3. Configurar MongoDB Atlas

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea una cuenta gratuita si no tienes una
3. Crea un nuevo cluster (usa el tier gratuito)
4. Configura un usuario de base de datos:
   - Ve a "Database Access"
   - Crea un nuevo usuario con permisos de lectura/escritura
5. Configura el acceso de red:
   - Ve a "Network Access"
   - Añade tu IP actual o usa `0.0.0.0/0` para acceso desde cualquier IP (solo para desarrollo)
6. Obtén la cadena de conexión:
   - Ve a "Clusters" → "Connect" → "Connect your application"
   - Copia la cadena de conexión

### 4. Configurar Variables de Entorno

\`\`\`bash
# Copia el archivo de ejemplo
cp .env.local.example .env.local

# Edita .env.local y reemplaza con tu cadena de conexión real
MONGODB_URI=mongodb+srv://tuusuario:tupassword@cluster0.abc123.mongodb.net/parking?retryWrites=true&w=majority
\`\`\`

### 5. Inicializar la Base de Datos

\`\`\`bash
npm run seed
\`\`\`

Este comando creará:
- **Espacios de estacionamiento**: 50 tickets disponibles (PARK001-PARK050)
- **Tickets de ejemplo**: 2 tickets con vehículos estacionados (TEST001-TEST002)
- **Usuarios del personal**: admin y operador
- **Configuración inicial**: Datos bancarios y tarifas diurnas/nocturnas
- **Bancos venezolanos**: Lista completa de bancos para el dropdown
- **Carros de ejemplo**: 2 vehículos registrados para demostración

### 6. Ejecutar la Aplicación

\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en: http://localhost:3000

## 🎯 Cómo Usar el Sistema

### Para Clientes

1. **Acceder a la Aplicación**
   - Ve a http://localhost:3000
   - Verás la página principal con el formulario de búsqueda

2. **Buscar Ticket**
   - Ingresa tu código de ticket (puedes usar TEST001 o TEST002)
   - Haz clic en "Buscar Ticket"

3. **Revisar Detalles**
   - Verifica el código del ticket y el monto calculado
   - **Nota**: El monto se calcula automáticamente considerando si es horario diurno o nocturno
   - Haz clic en "Pagar Ahora"

4. **Proceso de Pago**
   - **Paso 1**: Confirma los datos y revisa la información bancaria de la empresa
   - **Paso 2**: Realiza tu transferencia/pago móvil y completa el formulario con los detalles
   - **Paso 3**: Confirma la información y envía el pago

5. **Confirmación**
   - Recibirás confirmación de que el pago fue registrado
   - El pago quedará pendiente de validación por el personal

### Para Personal del Estacionamiento

1. **Acceder al Panel de Administración**
   - Ve a http://localhost:3000/admin
   - Usa las credenciales:
     - Usuario: `admin`
     - Contraseña: `admin123`
   - O usa el botón "Acceso Rápido (Demo)"

2. **Dashboard Principal**
   - Ve estadísticas en tiempo real (6 métricas principales)
   - Navega entre las 7 pestañas disponibles
   - Las estadísticas se actualizan automáticamente cada 30 segundos

3. **Configuración de Tarifas** (Pestaña "Config" - NUEVA FUNCIONALIDAD)
   - **Configurar Tarifa Diurna**: Precio estándar durante el día
   - **Configurar Tarifa Nocturna**: Precio diferenciado para la noche
   - **Definir Horario Nocturno**: 
     - Hora de inicio (ej: 00:00 para medianoche)
     - Hora de fin (ej: 06:00 para las 6 AM)
   - **Tasa de Cambio**: Conversión de USD a Bolívares
   - **Vista Previa**: Muestra cómo se aplicarán las tarifas

4. **Confirmación de Estacionamiento** (Pestaña "Confirmar" - PRIMERA PRIORIDAD)
   - **Ver vehículos pendientes**: Carros registrados que necesitan confirmación
   - **Verificar estacionamiento**: Confirmar físicamente que el vehículo está bien ubicado
   - **Confirmar estacionamiento**: Un clic para habilitar el cobro
   - **Badge de notificación**: Muestra cantidad de confirmaciones pendientes
   - **Inicio del tiempo de cobro**: Se marca desde la confirmación, no desde el registro

5. **Gestión de Tickets** (Pestaña "Tickets")
   - **Ver estadísticas**: Total, disponibles, ocupados, confirmados, pagados
   - **Crear tickets masivos**: Hasta 100 tickets por lote
   - **Generar códigos QR**: Para cada espacio de estacionamiento
   - **Monitorear espacios**: Lista completa de todos los tickets con sus estados

6. **Registro de Vehículos** (Pestaña "Registro")
   - **Registrar nuevo carro**: Cuando llega un vehículo al estacionamiento
   - **Datos completos**: Placa, marca, modelo, color, dueño, teléfono
   - **Asignación automática**: Seleccionar ticket disponible del dropdown
   - **Estado inicial**: Ticket pasa a "ocupado" (pendiente confirmación)

7. **Gestión de Pagos** (Pestaña "Pagos")
   - Ve todos los pagos pendientes de validación
   - **Cálculo Automático**: Los montos se calculan considerando tarifas diurnas/nocturnas
   - Revisa los detalles de cada pago (referencia, banco, monto, etc.)
   - Valida o rechaza pagos según corresponda

8. **Salida de Vehículos** (Pestaña "Salidas")
   - **Procesar salidas**: Lista de vehículos con pagos validados listos para salir
   - **Liberar espacios**: Confirmar salida y liberar ticket automáticamente
   - **Actualización en tiempo real**: Lista se actualiza cada 30 segundos

9. **Historial Completo** (Pestaña "Historial")
   - **Búsqueda avanzada**: Por placa, nombre del dueño, marca o ticket
   - **Paginación**: 20 registros por página para mejor rendimiento
   - **Filtros**: Buscar en todo el historial de vehículos

10.  **Gestión de Personal** (Pestaña "Personal")
    - **Crear usuarios**: Administradores y operadores
    - **Editar información**: Nombres, emails, roles
    - **Eliminar usuarios**: Con confirmación de seguridad

## 🔧 Configuración Avanzada

### Configuración de Tarifas Diurnas y Nocturnas

1. **Acceder a Configuración**
   - Panel Admin → Pestaña "Config"

2. **Configurar Tarifas**
   - **Tarifa Diurna**: Precio por hora durante el día (ej: $3.00)
   - **Tarifa Nocturna**: Precio por hora durante la noche (ej: $4.00)
   - **Horario Nocturno**: Define cuándo aplica cada tarifa
     - Inicio: 00:00 (medianoche)
     - Fin: 06:00 (6 AM)

3. **Ejemplos de Configuración**
   - **Estándar**: Diurno $3.00, Nocturno $4.00 (00:00-06:00)
   - **Extendido**: Diurno $2.50, Nocturno $3.50 (22:00-07:00)
   - **Premium**: Diurno $4.00, Nocturno $6.00 (20:00-08:00)

### Configuración de Datos Bancarios

1. **Pago Móvil**
   - Banco, cédula y teléfono para recibir pagos móviles

2. **Transferencia Bancaria**
   - Banco, cédula, teléfono y número de cuenta

3. **Tasa de Cambio**
   - Conversión automática de USD a Bolívares

## 📊 Métricas y Estadísticas

El dashboard muestra 6 métricas principales:
1. **Pagos Pendientes**: Transferencias esperando validación
2. **Personal Activo**: Usuarios del sistema registrados
3. **Pagos de Hoy**: Transacciones validadas en el día actual
4. **Total Tickets**: Espacios de estacionamiento creados
5. **Tickets Disponibles**: Espacios libres para asignar
6. **Carros Estacionados**: Vehículos actualmente en el estacionamiento

## 🔄 Flujo Completo del Sistema

### Flujo del Cliente
1. **Llegada**: Cliente llega al estacionamiento
2. **Registro**: Personal registra el vehículo y asigna ticket
3. **Confirmación**: Personal confirma que el vehículo está bien estacionado
4. **Búsqueda**: Cliente busca su ticket cuando quiere salir
5. **Pago**: Cliente ve el monto (calculado con tarifa diurna/nocturna) y realiza el pago
6. **Validación**: Personal valida el pago
7. **Salida**: Personal procesa la salida y libera el espacio

### Flujo del Personal
1. **Login**: Acceso al panel de administración
2. **Registro**: Registrar vehículos que llegan
3. **Confirmación**: Confirmar estacionamiento correcto
4. **Monitoreo**: Revisar pagos pendientes y estadísticas
5. **Validación**: Validar o rechazar pagos
6. **Salidas**: Procesar salidas de vehículos
7. **Gestión**: Crear tickets, gestionar personal, configurar tarifas

## 🚀 Despliegue en Producción

### Opción 1: Vercel (Recomendado)

1. **Preparar el proyecto**
   \`\`\`bash
   # Asegúrate de que todo funciona localmente
   npm run build
   \`\`\`

2. **Subir a GitHub**
   - Crea un repositorio en GitHub
   - Sube tu código

3. **Conectar con Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Conecta tu repositorio de GitHub
   - Configura la variable de entorno `MONGODB_URI`

4. **Configurar dominio**
   - Vercel te dará un dominio gratuito
   - Opcionalmente configura un dominio personalizado

### Opción 2: Otros Proveedores

El sistema es compatible con cualquier proveedor que soporte Node.js:
- Railway
- Render
- DigitalOcean App Platform
- AWS Amplify
- Netlify

## 🔒 Seguridad

- **Autenticación**: Sistema de login para personal autorizado
- **Validación**: Todos los datos son validados en el servidor
- **Sanitización**: Prevención de inyección de código
- **Variables de entorno**: Credenciales seguras

## 🐛 Solución de Problemas

### Error de Conexión a MongoDB
- Verifica que la cadena de conexión sea correcta
- Asegúrate de que tu IP esté en la whitelist de MongoDB Atlas
- Confirma que el usuario de base de datos tenga permisos

### La aplicación no inicia
- Ejecuta `npm install` para instalar dependencias
- Verifica que Node.js 18+ esté instalado
- Revisa que el archivo `.env.local` exista y tenga la configuración correcta

### Los tickets no aparecen
- Ejecuta `npm run seed` para inicializar la base de datos
- Verifica la conexión a MongoDB

### Las tarifas no se calculan correctamente
- Revisa la configuración de tarifas en el panel de administración
- Verifica que los horarios estén en formato correcto (HH:mm)
- Confirma que la tasa de cambio esté configurada

## 📞 Soporte

Si necesitas ayuda adicional:
1. Revisa esta documentación completa
2. Verifica los logs de la consola del navegador
3. Confirma que todos los pasos de instalación se siguieron correctamente

## 🎉 ¡Listo!

Tu sistema de estacionamiento con tarifas diurnas y nocturnas está completamente configurado y listo para usar. El sistema incluye:

✅ **50 espacios** de estacionamiento listos para usar  
✅ **2 tickets de ejemplo** para probar el sistema  
✅ **Panel de administración** completo con 7 pestañas  
✅ **Sistema de tarifas** diurnas y nocturnas configurable  
✅ **Cálculo automático** de montos según la hora  
✅ **Gestión completa** de pagos y validaciones  
✅ **Estadísticas en tiempo real** con actualización automática  
✅ **Códigos QR** para cada espacio  
✅ **Historial completo** con búsqueda avanzada  
✅ **Configuración flexible** de datos bancarios y tarifas  

**Credenciales de acceso:**
- **Admin**: usuario `admin`, contraseña `admin123`
- **Operador**: usuario `operador`, contraseña `operador123`

**Tickets de prueba:**
- **TEST001**: Toyota Corolla ABC123
- **TEST002**: Chevrolet Aveo XYZ789

¡Disfruta usando tu nuevo sistema de gestión de estacionamiento! 🚗💰
\`\`\`
