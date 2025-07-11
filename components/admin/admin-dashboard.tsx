"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronDown, ChevronUp, Smartphone } from "lucide-react";
import PendingPayments from "./pending-payments";
import StaffManagement from "./staff-management";
import CompanySettings from "./company-settings";
import TicketManagement from "./ticket-management";
import CarRegistration from "./car-registration";
import CarHistory from "./car-history";
import VehicleExit from "./vehicle-exit";
import QRGenerator from "./qr-generator";
import ParkingConfirmation from "./parking-confirmation";
import { Badge } from "@/components/ui/badge";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import React, { memo } from "react";

// Definir interfaces fuera del componente para evitar recreación
interface DashboardStats {
  pendingPayments: number;
  totalStaff: number;
  todayPayments: number;
  totalTickets: number;
  availableTickets: number;
  carsParked: number;
  paidTickets: number;
  pendingConfirmations: number;
}

const areStatsEqual = (newStats: DashboardStats, oldStats: DashboardStats) =>
  Object.keys(newStats).every(
    (key) => newStats[key as keyof DashboardStats] === oldStats[key as keyof DashboardStats]
  );

// Memoizar el componente para evitar re-renderizados innecesarios
const AdminDashboard = memo(function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingPayments: 0,
    totalStaff: 0,
    todayPayments: 0,
    totalTickets: 0,
    availableTickets: 0,
    carsParked: 0,
    paidTickets: 0,
    pendingConfirmations: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const isMobile = useMobileDetection();
  const [activeTab, setActiveTab] = useState(isMobile ? "cars" : "cars");
  const prevStatsRef = useRef(stats);
  const prevMobileRef = useRef(isMobile);
  const renderCountRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Log renders solo en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      renderCountRef.current += 1;
      console.log(`🔍 DEBUG: Renderizando AdminDashboard #${renderCountRef.current}`);
    }
  });

  // Configurar SSE de forma lazy y memoizada
  const setupSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource("/api/admin/stats-stream");
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const newStats = JSON.parse(event.data);
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 DEBUG: Nueva estadística recibida:", newStats);
      }
      if (!areStatsEqual(newStats, prevStatsRef.current)) {
        setStats(newStats);
        prevStatsRef.current = newStats;
      }
    };

    eventSource.onerror = (error) => {
      console.error("🔍 DEBUG: Error en SSE:", error);
      eventSource.close();
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Cargar SSE solo una vez y manejar limpieza
  useEffect(() => {
    setIsLoadingStats(true);
    const cleanup = setupSSE();
    setIsLoadingStats(false);
    return cleanup;
  }, [setupSSE]);

  // Sincronizar activeTab con isMobile solo si cambia
  useEffect(() => {
    if (prevMobileRef.current !== isMobile) {
      setActiveTab(isMobile ? "cars" : "cars");
      prevMobileRef.current = isMobile;
    }
  }, [isMobile]);

  // Botón de refresco manual
  const handleRefresh = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setupSSE();
  }, [setupSSE]);

  // Establecer altura fija para evitar layout shifts
  const cardHeight = "h-32";

 if (isMobile) {
    return (
      <div className="space-y-4" style={{ minHeight: "100vh" }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Panel Admin</h1>
            <p className="text-sm text-gray-600">Gestión de estacionamiento</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoadingStats}>
            <RefreshCw className={`h-4 w-4 ${isLoadingStats ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <Card className="border border-gray-200" style={{ height: cardHeight }}>
          <CardHeader
            className="py-3 px-4 cursor-pointer"
            onClick={() => setShowStats(!showStats)}
            style={{ minHeight: "48px" }}
          >
            <div className="flex justify-between items-center">
              <CardTitle className="text-md font-medium"> {/* Aumentado a text-md */}
                Estadísticas{" "}
                <Badge variant="outline" className="ml-2 text-sm">
                  {stats.availableTickets} libres
                </Badge>
                {stats.pendingConfirmations > 0 && (
                  <Badge variant="destructive" className="ml-2 text-sm">
                    {stats.pendingConfirmations} pendientes
                  </Badge>
                )}
              </CardTitle>
              {showStats ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </CardHeader>
          {showStats && (
            <CardContent className="py-3 px-4 grid grid-cols-2 gap-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded" style={{ minHeight: "48px" }}>
                <span className="text-sm">Espacios libres:</span>
                <Badge variant="outline" className="text-sm">{stats.availableTickets}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded" style={{ minHeight: "48px" }}>
                <span className="text-sm">Estacionados:</span>
                <Badge variant="secondary" className="text-sm">{stats.carsParked}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded" style={{ minHeight: "48px" }}>
                <span className="text-sm">Confirmaciones:</span>
                <Badge variant={stats.pendingConfirmations > 0 ? "destructive" : "outline"} className="text-sm">
                  {stats.pendingConfirmations}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded" style={{ minHeight: "48px" }}>
                <span className="text-sm">Pagos pendientes:</span>
                <Badge variant={stats.pendingPayments > 0 ? "destructive" : "outline"} className="text-sm">
                  {stats.pendingPayments}
                </Badge>
              </div>
            </CardContent>
          )}
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 h-auto">
            <TabsTrigger value="cars" className="py-2 text-sm relative">
              <Smartphone className="h-4 w-4 mr-1" />
              Registro
            </TabsTrigger>
            <TabsTrigger value="confirmations" className="py-2 text-sm relative">
              Confirmar
              {stats.pendingConfirmations > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs font-bold min-w-[16px] rounded-full"
                >
                  {stats.pendingConfirmations}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="payments" className="py-2 text-sm relative">
              Pagos
              {stats.pendingPayments > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs font-bold min-w-[16px] rounded-full"
                >
                  {stats.pendingPayments}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="exit" className="py-2 text-sm relative">
              Salida
              {stats.paidTickets > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs font-bold min-w-[16px] rounded-full"
                >
                  {stats.paidTickets}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cars" className="m-0">
            <CarRegistration />
          </TabsContent>
          <TabsContent value="confirmations" className="m-0">
            <ParkingConfirmation />
          </TabsContent>
          <TabsContent value="payments" className="m-0">
            <PendingPayments onStatsUpdate={handleRefresh} />
          </TabsContent>
          <TabsContent value="exit" className="m-0">
            <VehicleExit />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ minHeight: "100vh" }}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
          <p className="text-lg text-gray-600">Gestión completa del sistema de estacionamiento</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={isLoadingStats}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingStats ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[
          { title: "Pagos Pendientes", value: stats.pendingPayments, variant: stats.pendingPayments > 0 ? "destructive" : "secondary", desc: stats.pendingPayments === 0 ? "Todos procesados" : "Requieren validación" },
          { title: "Confirmaciones", value: stats.pendingConfirmations, variant: stats.pendingConfirmations > 0 ? "destructive" : "secondary", desc: stats.pendingConfirmations === 0 ? "Todos confirmados" : "Pendientes" },
          { title: "Personal Activo", value: stats.totalStaff, variant: "secondary", desc: "Usuarios registrados" },
          { title: "Pagos Hoy", value: stats.todayPayments, variant: "default", desc: "Procesados hoy" },
          { title: "Total Espacios", value: stats.totalTickets, variant: "outline", desc: "Espacios totales" },
          { title: "Espacios Libres", value: stats.availableTickets, variant: "secondary", desc: "Disponibles" },
          { title: "Carros Estacionados", value: stats.carsParked, variant: "destructive", desc: "Actualmente" },
          { title: "Listos para Salir", value: stats.paidTickets, variant: stats.paidTickets > 0 ? "default" : "secondary", desc: "Pagados" },
        ].map((stat, index) => (
          <Card key={index} className={cardHeight} style={{ minHeight: "150px" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Badge variant={stat.variant}>{stat.value}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
          <PendingPayments onStatsUpdate={handleRefresh} />
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
          <StaffManagement onStatsUpdate={handleRefresh} />
        </TabsContent>
        <TabsContent value="settings">
          <CompanySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default AdminDashboard;