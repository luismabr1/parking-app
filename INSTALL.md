# Sistema de Estacionamiento - Aplicación Web Completa

Una aplicación web integral para la gestión completa de estacionamientos con registro de vehículos, control de espacios, procesamiento de pagos y panel de administración avanzado.

## 🚀 Características Principales

### Para Clientes
- **Búsqueda de Tickets**: Los clientes pueden buscar sus tickets usando el código único
- **Cálculo Automático**: El sistema calcula automáticamente el monto a pagar basado en el tiempo de estacionamiento
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
- **Configuración de Empresa**: Configurar datos bancarios para pago móvil y transferencias
- **Estadísticas en Tiempo Real**: Dashboard con 8 métricas importantes y actualización automática
- **Búsqueda Avanzada**: Filtros y búsqueda en el historial de vehículos

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
- **Tickets de ejemplo**: 5 tickets nuevos (PARK001-PARK005) y 5 de compatibilidad (TEST001-XYZ789)
- **Usuarios del personal**: admin y operador
- **Configuración inicial**: Datos bancarios de ejemplo
- **Bancos venezolanos**: Lista completa de bancos para el dropdown
- **Carros de ejemplo**: 2 vehículos registrados para demostración
- **Historial inicial**: Registros de ejemplo en el historial

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
   - Ingresa tu código de ticket (puedes usar los códigos de ejemplo)
   - Haz clic en "Buscar Ticket"

3. **Revisar Detalles**
   - Verifica el código del ticket y el monto calculado
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
   - Ve estadísticas en tiempo real (8 métricas principales)
   - Navega entre las 7 pestañas disponibles
   - Las estadísticas se actualizan automáticamente cada 30 segundos

3. **Confirmación de Estacionamiento** (Pestaña "Confirmar" - PRIMERA PRIORIDAD)
   - **Ver vehículos pendientes**: Carros registrados que necesitan confirmación
   - **Verificar estacionamiento**: Confirmar físicamente que el vehículo está bien ubicado
   - **Confirmar estacionamiento**: Un clic para habilitar el cobro
   - **Badge de notificación**: Muestra cantidad de confirmaciones pendientes
   - **Inicio del tiempo de cobro**: Se marca desde la confirmación, no desde el registro

4. **Gestión de Tickets** (Pestaña "Tickets")
   - **Ver estadísticas**: Total, disponibles, ocupados, confirmados, pagados
   - **Crear tickets masivos**: Hasta 100 tickets por lote
   - **Generar códigos QR**: Para cada espacio de estacionamiento
   - **Monitorear espacios**: Lista completa de todos los tickets con sus estados
   - Los tickets representan los espacios físicos de estacionamiento

5. **Registro de Vehículos** (Pestaña "Registro")
   - **Registrar nuevo carro**: Cuando llega un vehículo al estacionamiento
   - **Datos completos**: Placa, marca, modelo, color, dueño, teléfono
   - **Asignación automática**: Seleccionar ticket disponible del dropdown
   - **Estado inicial**: Ticket pasa a "ocupado" (pendiente confirmación)
   - **Ver carros actuales**: Lista de todos los vehículos estacionados
   - **Escaneo QR**: Opción para escanear código QR del espacio

6. **Gestión de Pagos** (Pestaña "Pagos")
   - Ve todos los pagos pendientes de validación
   - Revisa los detalles de cada pago (referencia, banco, monto, etc.)
   - Valida o rechaza pagos según corresponda
   - Los tickets validados cambian a estado "pagado_validado"
   - Los tickets rechazados vuelven a estado "pago_rechazado" para reintento

7. **Salida de Vehículos** (Pestaña "Salidas")
   - **Procesar salidas**: Lista de vehículos con pagos validados listos para salir
   - **Liberar espacios**: Confirmar salida y liberar ticket automáticamente
   - **Actualización en tiempo real**: Lista se actualiza cada 30 segundos
   - **Control de flujo**: Solo vehículos con pago validado pueden salir

8. **Historial Completo** (Pestaña "Historial")
   - **Búsqueda avanzada**: Por placa, nombre del dueño, marca o ticket
   - **Paginación**: 20 registros por página para mejor rendimiento
   - **Filtros**: Buscar en todo el historial de vehículos
   - **Estados**: Estacionado, Pagado, Finalizado
   - **Información completa**: Todos los datos del vehículo y tiempos

9. **Gestión de Personal** (Pestaña "Personal")
   - Añade nuevos miembros del personal
   - Edita información existente
   - Asigna roles (administrador u operador)
   - Elimina cuentas cuando sea necesario

10. **Configuración de Empresa** (Pestaña "Config")
    - Configura los datos bancarios para pago móvil
    - Configura los datos para transferencias bancarias
    - Selecciona bancos del dropdown (lista completa de bancos venezolanos)
    - Esta información se mostrará a los clientes durante el proceso de pago

## 🧪 Datos de Prueba

### Códigos de Tickets Disponibles

#### Tickets Nuevos (Sistema Mejorado)
- `PARK001` - `PARK005`: Tickets disponibles para asignar a nuevos vehículos

#### Tickets de Compatibilidad (Sistema Legacy)
- `TEST001` - Toyota Corolla (ABC123) - Estacionado y confirmado
- `TEST002` - Chevrolet Aveo (XYZ789) - Estacionado y confirmado
- `TEST003` - Estacionado y confirmado (~$9.00)
- `ABC123` - Estacionado y confirmado (~$1.50)
- `XYZ789` - Estacionado y confirmado (~$12.00)

### Credenciales de Administración
- **Usuario**: admin
- **Contraseña**: admin123

### Vehículos de Ejemplo
- **ABC123**: Toyota Corolla Blanco - Juan Pérez (Confirmado en TEST001)
- **XYZ789**: Chevrolet Aveo Azul - María González (Confirmado en TEST002)

## 🗂️ Estructura del Proyecto

\`\`\`
sistema-estacionamiento/
├── app/                          # Páginas de Next.js (App Router)
│   ├── admin/                    # Panel de administración
│   ├── ticket/[code]/           # Página de detalles del ticket
│   ├── api/                     # API Routes
│   │   ├── admin/               # APIs del panel administrativo
│   │   │   ├── tickets/         # Gestión de tickets
│   │   │   ├── cars/            # Gestión de carros
│   │   │   ├── car-history/     # Historial de vehículos
│   │   │   ├── available-tickets/ # Tickets disponibles
│   │   │   └── stats/           # Estadísticas del dashboard
│   │   └── banks/               # Lista de bancos
│   └── globals.css              # Estilos globales
├── components/                   # Componentes React
│   ├── admin/                   # Componentes del panel admin
│   │   ├── ticket-management.tsx    # Gestión de tickets
│   │   ├── car-registration.tsx     # Registro de carros
│   │   ├── car-history.tsx          # Historial de vehículos
│   │   ├── pending-payments.tsx     # Pagos pendientes
│   │   ├── staff-management.tsx     # Gestión de personal
│   │   └── company-settings.tsx     # Configuración
│   └── ui/                      # Componentes de UI (shadcn/ui)
├── lib/                         # Utilidades y servicios
│   ├── types.ts                 # Definiciones de tipos TypeScript
│   ├── utils.ts                 # Funciones utilitarias
│   └── mongodb.ts               # Configuración de MongoDB
├── scripts/                     # Scripts de inicialización
│   └── seed-db.js              # Script de inicialización de datos
└── hooks/                       # Custom React hooks
\`\`\`

## 🔄 Flujo de Trabajo Completo

### Flujo Operativo Diario

1. **Admin crea tickets** → Representa espacios físicos disponibles (PARK001, PARK002, etc.)
2. **Cliente llega al estacionamiento** → Admin registra el vehículo en el sistema
3. **Sistema asigna espacio** → Ticket pasa de "disponible" a "ocupado" (pendiente confirmación)
4. **Admin confirma estacionamiento** → Verifica físicamente que el carro está bien ubicado
5. **Sistema habilita cobro** → Ticket pasa a "estacionado_confirmado" y se inicia el tiempo de cobro
6. **Cliente decide salir** → Busca su ticket en la web usando el código
7. **Sistema calcula monto** → Basado en tiempo transcurrido desde la confirmación
8. **Cliente realiza pago** → Transferencia bancaria o pago móvil
9. **Cliente registra pago** → Completa formulario con detalles de la transacción
10. **Admin recibe notificación** → Pago aparece en lista de pendientes
11. **Admin valida pago** → Revisa detalles y confirma o rechaza
12. **Cliente puede salir** → Vehículo aparece en lista de salidas
13. **Admin procesa salida** → Confirma salida y libera espacio automáticamente

### Estados de los Tickets

- **Disponible**: Espacio libre, listo para asignar
- **Ocupado**: Vehículo registrado, pendiente confirmación física ⚠️
- **Estacionado Confirmado**: Vehículo confirmado, tiempo de cobro iniciado ✅
- **Pago Pendiente**: Cliente registró pago, esperando validación
- **Pagado Validado**: Pago confirmado por admin, listo para salir
- **Pago Rechazado**: Pago rechazado, cliente debe reintentar

### Colecciones de Base de Datos

- **tickets**: Espacios de estacionamiento y su estado
- **cars**: Vehículos actualmente estacionados
- **car_history**: Historial completo de todos los vehículos
- **pagos**: Registros de pagos realizados
- **staff**: Personal autorizado del estacionamiento
- **company_settings**: Configuración bancaria de la empresa
- **banks**: Lista de bancos venezolanos para dropdowns

## 🚨 Solución de Problemas

### Error de Conexión a MongoDB
\`\`\`bash
# Verifica que MONGODB_URI esté correctamente configurado
echo $MONGODB_URI

# Asegúrate de que tu IP esté en la lista blanca de MongoDB Atlas
# Ve a Network Access en MongoDB Atlas
\`\`\`

### Error de Dependencias
\`\`\`bash
# Limpia e instala dependencias nuevamente
rm -rf node_modules package-lock.json
npm install
\`\`\`

### Puerto en Uso
\`\`\`bash
# Usa un puerto diferente
npm run dev -- -p 3001
\`\`\`

### Problemas con el Seed
\`\`\`bash
# Verifica que el archivo .env.local exista y tenga MONGODB_URI
# Ejecuta el seed nuevamente
npm run seed
\`\`\`

### Error "Invalid time value"
Este error se ha solucionado con funciones de validación de fechas. Si persiste:
\`\`\`bash
# Ejecuta el seed nuevamente para datos limpios
npm run seed
\`\`\`

### No aparecen tickets disponibles
\`\`\`bash
# Crea tickets desde el panel de administración
# Ve a la pestaña "Tickets" y crea nuevos tickets
\`\`\`

## 🔐 Seguridad

### Para Desarrollo
- Las credenciales de admin son simples para facilitar las pruebas
- El sistema usa localStorage para mantener la sesión
- Validación de fechas para prevenir errores de formato

### Para Producción (Recomendaciones)
- Implementar autenticación JWT robusta
- Usar variables de entorno seguras
- Configurar CORS apropiadamente
- Implementar rate limiting
- Usar HTTPS en producción
- Hashear contraseñas con bcrypt
- Validar y sanitizar todas las entradas
- Implementar logs de auditoría

## 📈 Características Avanzadas

### Sistema de Estadísticas
- **6 métricas principales**: Pagos pendientes, personal activo, pagos del día, total de tickets, espacios libres, carros estacionados
- **Actualización automática**: Cada 30 segundos
- **Tiempo real**: Reflejan el estado actual del estacionamiento

### Gestión de Espacios
- **Creación masiva**: Hasta 100 tickets por lote
- **Numeración automática**: PARK001, PARK002, etc.
- **Control de disponibilidad**: Previene doble asignación
- **Estados claros**: Disponible, ocupado, pagado

### Búsqueda y Filtros
- **Búsqueda avanzada**: Por múltiples campos
- **Paginación eficiente**: 20 registros por página
- **Filtros en tiempo real**: Resultados instantáneos
- **Historial completo**: Todos los vehículos que han pasado

### Validación de Datos
- **Fechas seguras**: Funciones de validación para prevenir errores
- **Tipos TypeScript**: Validación en tiempo de desarrollo
- **Formularios validados**: Prevención de datos incorrectos
- **Manejo de errores**: Mensajes claros para el usuario

## 🔮 Próximas Características Planificadas

### Funcionalidades Inmediatas
- [x] **Salida de vehículos**: Registrar cuando un carro sale y liberar el ticket ✅
- [x] **Códigos QR**: Generar QR para cada ticket para facilitar el proceso ✅
- [x] **Confirmación de estacionamiento**: Verificar ubicación antes de habilitar cobro ✅
- [ ] **Tarifas dinámicas**: Diferentes precios según hora del día o tipo de vehículo
- [ ] **Notificaciones automáticas**: Alertas para pagos pendientes y espacios disponibles

### Mejoras de Gestión
- [ ] **Reportes de ingresos**: Reportes diarios, semanales y mensuales
- [ ] **Exportación de datos**: CSV, PDF para reportes
- [ ] **Backup automático**: Respaldo programado de datos
- [ ] **Logs de auditoría**: Registro de todas las acciones administrativas

### Integraciones
- [ ] **Pasarelas de pago reales**: Integración con Stripe, PayPal, etc.
- [ ] **Notificaciones por email**: Confirmaciones automáticas
- [ ] **SMS**: Notificaciones por mensaje de texto
- [ ] **API REST completa**: Para aplicaciones móviles

### Experiencia de Usuario
- [ ] **Modo oscuro**: Tema oscuro para el panel administrativo
- [ ] **Múltiples idiomas**: Soporte para inglés y español
- [ ] **PWA**: Aplicación web progresiva para móviles
- [ ] **Dashboard personalizable**: Widgets configurables

### Escalabilidad
- [ ] **Multi-tenant**: Soporte para múltiples estacionamientos
- [ ] **Roles avanzados**: Permisos granulares por función
- [ ] **Cache inteligente**: Optimización de rendimiento
- [ ] **Monitoreo**: Métricas de rendimiento y uso

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución
- Usa TypeScript para nuevas funcionalidades
- Sigue las convenciones de nombres existentes
- Añade tests para nuevas funcionalidades
- Actualiza la documentación según sea necesario
- Mantén la compatibilidad con versiones anteriores

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ve el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes problemas o preguntas:

1. **Revisa la documentación**: Este README cubre la mayoría de casos
2. **Verifica prerrequisitos**: Node.js, MongoDB Atlas configurado
3. **Ejecuta el seed**: `npm run seed` para datos limpios
4. **Revisa la consola**: Errores detallados en el navegador
5. **Verifica variables de entorno**: MONGODB_URI debe estar configurado

### Problemas Comunes y Soluciones

| Problema | Solución |
|----------|----------|
| No aparecen tickets | Ejecutar `npm run seed` y crear tickets en el panel |
| Error de conexión DB | Verificar MONGODB_URI y acceso de red en Atlas |
| Fechas inválidas | Sistema actualizado con validación automática |
| No hay espacios disponibles | Crear más tickets desde la pestaña "Tickets" |
| Pagos no aparecen | Verificar que el código de ticket sea correcto |

---

**¡Gracias por usar el Sistema de Estacionamiento Completo!** 🚗💳🏢

*Un sistema integral que transforma la gestión de estacionamientos con tecnología moderna y una experiencia de usuario excepcional.*
