"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CarIcon, RefreshCw, ImageIcon, Edit } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import ImageWithFallback from "../image-with-fallback";

interface CarProps {
  _id: string;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  nombreDueño: string;
  telefono: string;
  ticketAsociado: string;
  horaIngreso: string;
  estado: string;
  imagenes?: {
    plateImageUrl?: string;
    vehicleImageUrl?: string;
    fechaCaptura?: string;
    capturaMetodo?: "manual" | "camara_movil" | "camara_desktop";
    confianzaPlaca?: number;
    confianzaVehiculo?: number;
  };
}

interface MobileCarListProps {
  cars: CarProps[];
  onRefresh: () => void;
  onViewImages: (car: CarProps) => void;
}

function MobileCarList({ cars, onRefresh, onViewImages }: MobileCarListProps) {
  const activeCars = cars.filter((car) => car.estado === "estacionado");
  const recentCars = activeCars.slice(-3); // Show only the last 3 cars

  if (process.env.NODE_ENV === "development") {
    console.log(`🔍 DEBUG: Renderizando MobileCarList con ${activeCars.length} carros, mostrando ${recentCars.length} recientes`);
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <CarIcon className="h-5 w-5 text-green-600" />
            <span className="font-medium text-lg">Carros Estacionados ({activeCars.length})</span>
          </div>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="h-8"
            aria-label="Actualizar lista"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </Button>
        </div>

        {recentCars.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <CarIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay carros estacionados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentCars.map((car) => (
              <div key={car._id} className="p-3 border rounded-lg bg-white shadow-sm">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-lg">{car.placa}</p>
                      <p className="text-sm text-gray-600">
                        {car.marca} {car.modelo} - {car.color}
                      </p>
                      <p className="text-sm text-gray-600">
                        Dueño: {car.nombreDueño} | Tel: {car.telefono}
                      </p>
                      {car.imagenes && (
                        <div className="flex items-center space-x-2 mt-1">
                          <ImageWithFallback
                            src={car.imagenes.plateImageUrl || "/placeholder.svg"}
                            alt={`Placa de ${car.placa}`}
                            className="w-20 h-12 object-cover rounded border" // Optimized for mobile: 20x12px
                            fallback="/placeholder.svg"
                          />
                          <ImageWithFallback
                            src={car.imagenes.vehicleImageUrl || "/placeholder.svg"}
                            alt={`Vehículo de ${car.placa}`}
                            className="w-20 h-12 object-cover rounded border" // Optimized for mobile: 20x12px
                            fallback="/placeholder.svg"
                          />
                          <span className="text-xs text-blue-600">Con imágenes</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium">Ticket: {car.ticketAsociado}</p>
                      <p className="text-xs text-gray-500">
                        Ingreso: {car.horaIngreso ? formatDateTime(car.horaIngreso) : "Sin fecha"}
                      </p>
                      {car.imagenes && (
                        <Button
                          onClick={() => onViewImages(car)}
                          variant="outline"
                          size="sm"
                          className="mt-1 h-7 px-2 text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {activeCars.length > 3 && (
              <p className="text-center text-sm text-gray-500">
                +{activeCars.length - 3} carros adicionales (usa &quot;Actualizar&quot; para ver todos)
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(MobileCarList);