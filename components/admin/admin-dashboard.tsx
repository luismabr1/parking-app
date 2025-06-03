"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
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
