"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, ChevronDown, ChevronUp, Smartphone } from "lucide-react"
import PendingPayments from "./pending-payments"
import StaffManagement from "./staff-management"
import CompanySettings from "./company-settings"
import TicketManagement from "./ticket-management"
import CarRegistration from "./car-registration"
import CarHistory from "./car-history"
import VehicleExit from "./vehicle-exit"
import QRGenerator from "./qr-generator"
import ParkingConfirmation from "./parking-confirmation"
import { Badge } from "@/components/ui/badge"
import { useMobileDetection } from "@/hooks/use-mobile-detection"

interface DashboardStats {
  pendingPayments: number
  totalStaff: number
  todayPayments: number
  totalTickets: number
  availableTickets: number
  carsParked: number
  paidTickets: number
  pendingConfirmations: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingPayments: 0,
    totalStaff: 0,
    todayPayments: 0,
    totalTickets: 0,
    availableTickets: 0,
    carsParked: 0,
    paidTickets: 0,
    pendingConfirmations: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [showStats, setShowStats] = useState(false)
  const isMobile = useMobileDetection()
  const [activeTab, setActiveTab] = useState(isMobile ? "confirmations" : "cars")

  useEffect(() => {
    fetchStats()

    // Actualizar estadísticas cada 30 segundos
    const interval = setInterval(fetchStats, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true)
      // Agregar un timestamp para evitar el caché
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/stats?t=${timestamp}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        next: { revalidate: 0 },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Renderizado móvil optimizado
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Header móvil simplificado */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Panel Admin</h1>
            <p className="text-sm text-gray-600">Gestión de estacionamiento</p>
          </div>
          <Button onClick={fetchStats} variant="outline" size="sm" disabled={isLoadingStats}>
            <RefreshCw className={`h-4 w-4 ${isLoadingStats ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Estadísticas colapsables */}
        <Card className="border border-gray-200">
          <CardHeader className="py-2 px-4 cursor-pointer" onClick={() => setShowStats(!showStats)}>
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">
                Estadísticas{" "}
                <Badge variant="outline" className="ml-2">
                  {stats.availableTickets} libres
                </Badge>
                {stats.pendingConfirmations > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {stats.pendingConfirmations} pendientes
                  </Badge>
                )}
              </CardTitle>
              {showStats ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </div>
          </CardHeader>
          {showStats && (
            <CardContent className="py-2 px-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-xs">Espacios libres:</span>
                  <Badge variant="outline">{stats.availableTickets}</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-xs">Estacionados:</span>
                  <Badge variant="secondary">{stats.carsParked}</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-xs">Confirmaciones:</span>
                  <Badge variant={stats.pendingConfirmations > 0 ? "destructive" : "outline"}>
                    {stats.pendingConfirmations}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-xs">Pagos pendientes:</span>
                  <Badge variant={stats.pendingPayments > 0 ? "destructive" : "outline"}>{stats.pendingPayments}</Badge>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Tabs móviles optimizadas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 h-auto">
            <TabsTrigger value="cars" className="py-2 text-xs">
              <Smartphone className="h-3 w-3 mr-1" />
              Registro
            </TabsTrigger>
            <TabsTrigger value="confirmations" className="py-2 text-xs">
              {stats.pendingConfirmations > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
                >
                  {stats.pendingConfirmations}
                </Badge>
              )}
              Confirmar
            </TabsTrigger>
            <TabsTrigger value="payments" className="py-2 text-xs">
              {stats.pendingPayments > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
                >
                  {stats.pendingPayments}
                </Badge>
              )}
              Pagos
            </TabsTrigger>
            <TabsTrigger value="exit" className="py-2 text-xs">
              {stats.paidTickets > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
                >
                  {stats.paidTickets}
                </Badge>
              )}
              Salida
            </TabsTrigger>
          </TabsList>

          {/* Contenido de las pestañas */}
          <TabsContent value="cars" className="m-0">
            <CarRegistration />
          </TabsContent>

          <TabsContent value="confirmations" className="m-0">
            <ParkingConfirmation />
          </TabsContent>

          <TabsContent value="payments" className="m-0">
            <PendingPayments onStatsUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="exit" className="m-0">
            <VehicleExit />
          </TabsContent>

          {/* Pestañas secundarias colapsadas en un menú desplegable */}
          <Card className="mt-4">
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-sm font-medium">Otras opciones</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-2"
                  onClick={() => setActiveTab("tickets")}
                >
                  Espacios
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-auto py-2" onClick={() => setActiveTab("qr")}>
                  QR
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-2"
                  onClick={() => setActiveTab("history")}
                >
                  Historial
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-2"
                  onClick={() => setActiveTab("staff")}
                >
                  Personal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-2 col-span-2"
                  onClick={() => setActiveTab("settings")}
                >
                  Configuración
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contenido de pestañas secundarias */}
          <TabsContent value="tickets" className="m-0">
            <TicketManagement />
          </TabsContent>

          <TabsContent value="qr" className="m-0">
            <QRGenerator />
          </TabsContent>

          <TabsContent value="history" className="m-0">
            <CarHistory />
          </TabsContent>

          <TabsContent value="staff" className="m-0">
            <StaffManagement onStatsUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="settings" className="m-0">
            <CompanySettings />
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Vista desktop original
  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
          <p className="text-lg text-gray-600">Gestión completa del sistema de estacionamiento</p>
        </div>
        <Button onClick={fetchStats} variant="outline" disabled={isLoadingStats}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingStats ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <Badge variant={stats.pendingPayments > 0 ? "destructive" : "secondary"}>{stats.pendingPayments}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingPayments === 0 ? "Todos procesados" : "Requieren validación"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmaciones</CardTitle>
            <Badge variant={stats.pendingConfirmations > 0 ? "destructive" : "secondary"}>
              {stats.pendingConfirmations}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingConfirmations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingConfirmations === 0 ? "Todos confirmados" : "Pendientes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Activo</CardTitle>
            <Badge variant="secondary">{stats.totalStaff}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">Usuarios registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Hoy</CardTitle>
            <Badge>{stats.todayPayments}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayPayments}</div>
            <p className="text-xs text-muted-foreground">Procesados hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Espacios</CardTitle>
            <Badge variant="outline">{stats.totalTickets}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">Espacios totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espacios Libres</CardTitle>
            <Badge variant="secondary">{stats.availableTickets}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableTickets}</div>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carros Estacionados</CardTitle>
            <Badge variant="destructive">{stats.carsParked}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.carsParked}</div>
            <p className="text-xs text-muted-foreground">Actualmente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Listos para Salir</CardTitle>
            <Badge variant={stats.paidTickets > 0 ? "default" : "secondary"}>{stats.paidTickets}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paidTickets}</div>
            <p className="text-xs text-muted-foreground">Pagados</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="confirmations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="confirmations">
            Confirmar
            {stats.pendingConfirmations > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {stats.pendingConfirmations}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="payments">
            Pagos
            {stats.pendingPayments > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {stats.pendingPayments}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tickets">Espacios</TabsTrigger>
          <TabsTrigger value="cars">Ingreso</TabsTrigger>
          <TabsTrigger value="exit">
            Salida
            {stats.paidTickets > 0 && <Badge className="ml-2 text-xs">{stats.paidTickets}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="qr">QR</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="staff">Personal</TabsTrigger>
          <TabsTrigger value="settings">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="confirmations">
          <ParkingConfirmation />
        </TabsContent>

        <TabsContent value="payments">
          <PendingPayments onStatsUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="tickets">
          <TicketManagement />
        </TabsContent>

        <TabsContent value="cars">
          <CarRegistration />
        </TabsContent>

        <TabsContent value="exit">
          <VehicleExit />
        </TabsContent>

        <TabsContent value="qr">
          <QRGenerator />
        </TabsContent>

        <TabsContent value="history">
          <CarHistory />
        </TabsContent>

        <TabsContent value="staff">
          <StaffManagement onStatsUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="settings">
          <CompanySettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
