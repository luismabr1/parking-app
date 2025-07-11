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
import React from "react";

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

const areStatsEqual = (newStats: DashboardStats, oldStats: DashboardStats) => {
  return Object.keys(newStats).every(
    (key) => newStats[key as keyof DashboardStats] === oldStats[key as keyof DashboardStats]
  );
};

function AdminDashboard() {
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

  // Log renders
  renderCountRef.current += 1;
  if (process.env.NODE_ENV === "development") {
    console.log(`🔍 DEBUG: Renderizando AdminDashboard #${renderCountRef.current}`);
  }

  // Log state changes
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `🔍 DEBUG: Estado actualizado en AdminDashboard - activeTab: ${activeTab}, showStats: ${showStats}, isLoadingStats: ${isLoadingStats}, stats.pendingPayments: ${stats.pendingPayments}`
      );
    }
  }, [activeTab, showStats, isLoadingStats, stats]);

  // Log isMobile changes
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log(`🔍 DEBUG: isMobile cambió: ${isMobile}`);
    }
  }, [isMobile]);

  // Configurar SSE
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

  useEffect(() => {
    setIsLoadingStats(true);
    const cleanup = setupSSE();
    setIsLoadingStats(false);
    return cleanup;
  }, [setupSSE]);

  // Synchronize activeTab with isMobile, only if isMobile changes
  useEffect(() => {
    if (prevMobileRef.current !== isMobile) {
      setActiveTab(isMobile ? "cars" : "cars");
      if (process.env.NODE_ENV === "development") {
        console.log(`🔍 DEBUG: Actualizando activeTab a ${isMobile ? "cars" : "cars"} por cambio en isMobile`);
      }
      prevMobileRef.current = isMobile;
    }
  }, [isMobile]);

  // Botón manual para refrescar (opcional)
  const handleRefresh = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setupSSE();
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Panel Admin</h1>
            <p className="text-sm text-gray-600">Gestión de estacionamiento</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoadingStats}>
            <RefreshCw className={`h-4 w-4 ${isLoadingStats ? "animate-spin" : ""}`} />
          </Button>
        </div>

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 h-auto">
            <TabsTrigger value="cars" className="py-2 text-xs relative">
              <Smartphone className="h-3 w-3 mr-1" />
              Registro
            </TabsTrigger>
            <TabsTrigger value="confirmations" className="py-2 text-xs relative">
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
            <TabsTrigger value="payments" className="py-2 text-xs relative">
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
            <TabsTrigger value="exit" className="py-2 text-xs relative">
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

  // Desktop view
  return (
    <div className="space-y-6">
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
}

export default React.memo(AdminDashboard);