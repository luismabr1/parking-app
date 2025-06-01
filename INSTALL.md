# Sistema de Estacionamiento - Aplicación Web Serverless

Una aplicación web completa para la gestión de pagos de estacionamiento con panel de administración para el personal.

## 🚀 Características

### Para Clientes
- **Búsqueda de Tickets**: Los clientes pueden buscar sus tickets usando el código único
- **Cálculo Automático**: El sistema calcula automáticamente el monto a pagar basado en el tiempo de estacionamiento
- **Proceso de Pago Guiado**: Formulario paso a paso para registrar transferencias bancarias
- **Información Bancaria Dinámica**: Muestra los datos bancarios configurados por la empresa
- **Confirmación de Pago**: Los clientes reciben confirmación inmediata del registro de su pago

### Para Personal del Estacionamiento
- **Panel de Administración**: Interfaz completa para gestionar el sistema
- **Gestión de Pagos**: Validar o rechazar pagos pendientes con información detallada
- **Gestión de Personal**: Crear, editar y eliminar cuentas de personal
- **Configuración de Empresa**: Configurar datos bancarios para pago móvil y transferencias
- **Estadísticas en Tiempo Real**: Dashboard con métricas importantes
- **Autenticación Segura**: Sistema de login para acceso al panel administrativo

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
- Tickets de ejemplo para pruebas
- Usuarios del personal (admin y operador)
- Configuración inicial de la empresa

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
   - Ingresa tu código de ticket (puedes usar los códigos de ejemplo: TEST001, TEST002, TEST003, ABC123, XYZ789)
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
   - Ve estadísticas en tiempo real
   - Navega entre las diferentes secciones usando las pestañas

3. **Gestión de Pagos**
   - Ve todos los pagos pendientes de validación
   - Revisa los detalles de cada pago (referencia, banco, monto, etc.)
   - Valida o rechaza pagos según corresponda
   - Los tickets validados cambian a estado "pagado_validado"
   - Los tickets rechazados vuelven a estado "pago_rechazado" para reintento

4. **Gestión de Personal**
   - Añade nuevos miembros del personal
   - Edita información existente
   - Asigna roles (administrador u operador)
   - Elimina cuentas cuando sea necesario

5. **Configuración de Empresa**
   - Configura los datos bancarios para pago móvil
   - Configura los datos para transferencias bancarias
   - Esta información se mostrará a los clientes durante el proceso de pago

## 🧪 Datos de Prueba

### Códigos de Tickets Disponibles
- `TEST001` - 1 hora de estacionamiento (~$3.00)
- `TEST002` - 2 horas de estacionamiento (~$6.00)
- `TEST003` - 3 horas de estacionamiento (~$9.00)
- `ABC123` - 30 minutos de estacionamiento (~$1.50)
- `XYZ789` - 4 horas de estacionamiento (~$12.00)

### Credenciales de Administración
- **Usuario**: admin
- **Contraseña**: admin123

## 🗂️ Estructura del Proyecto

\`\`\`
sistema-estacionamiento/
├── app/                          # Páginas de Next.js (App Router)
│   ├── admin/                    # Panel de administración
│   ├── ticket/[code]/           # Página de detalles del ticket
│   ├── api/                     # API Routes
│   └── globals.css              # Estilos globales
├── components/                   # Componentes React
│   ├── admin/                   # Componentes del panel admin
│   └── ui/                      # Componentes de UI (shadcn/ui)
├── lib/                         # Utilidades y servicios
├── scripts/                     # Scripts de inicialización
└── hooks/                       # Custom React hooks
\`\`\`

## 🔄 Flujo de Trabajo Completo

1. **Cliente busca ticket** → Sistema calcula monto basado en tiempo
2. **Cliente ve información de pago** → Datos bancarios configurados por la empresa
3. **Cliente realiza pago** → Transferencia bancaria o pago móvil
4. **Cliente registra pago** → Completa formulario con detalles de la transacción
5. **Personal recibe notificación** → Pago aparece en lista de pendientes
6. **Personal valida pago** → Revisa detalles y confirma o rechaza
7. **Sistema actualiza estado** → Ticket marcado como pagado o rechazado

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

## 🔐 Seguridad

### Para Desarrollo
- Las credenciales de admin son simples para facilitar las pruebas
- El sistema usa localStorage para mantener la sesión

### Para Producción (Recomendaciones)
- Implementar autenticación JWT robusta
- Usar variables de entorno seguras
- Configurar CORS apropiadamente
- Implementar rate limiting
- Usar HTTPS en producción
- Hashear contraseñas con bcrypt

## 📈 Próximas Características

- [ ] Autenticación JWT para mayor seguridad
- [ ] Notificaciones por email
- [ ] Generación de recibos PDF
- [ ] Integración con pasarelas de pago reales
- [ ] Sistema de reportes y analytics
- [ ] Soporte para múltiples idiomas
- [ ] API para aplicaciones móviles
- [ ] Sistema de notificaciones en tiempo real
- [ ] Backup automático de datos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ve el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa la sección de solución de problemas
2. Verifica que todos los prerrequisitos estén instalados
3. Asegúrate de que MongoDB Atlas esté configurado correctamente
4. Verifica que las variables de entorno estén configuradas

---

**¡Gracias por usar el Sistema de Estacionamiento!** 🚗💳
\`\`\`

Ahora voy a mejorar el componente del dashboard para que se actualice correctamente:
