"use client"

import { memo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, CarIcon, RefreshCw, ImageIcon, Edit } from "lucide-react"
import { formatDateTime } from "@/lib/utils"

interface CarProps {
  _id: string
  placa: string
  marca: string
  modelo: string
  color: string
  nombreDueño: string
  telefono: string
  ticketAsociado: string
  horaIngreso: string
  estado: string
  imagenes?: {
    placaUrl?: string
    vehiculoUrl?: string
    fechaCaptura?: string
    capturaMetodo?: "manual" | "camara_movil" | "camara_desktop"
    confianzaPlaca?: number
    confianzaVehiculo?: number
  }
}

interface MobileCarListProps {
  cars: CarProps[]
  onRefresh: () => void
  onViewImages: (car: CarProps) => void
}

function MobileCarList({ cars, onRefresh, onViewImages }: MobileCarListProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const activeCars = cars.filter((car) => car.estado === "estacionado")

  if (process.env.NODE_ENV === "development") {
    console.log(`🔍 DEBUG: Renderizando MobileCarList con ${activeCars.length} carros`)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-0 h-auto"
        >
          <div className="flex items-center space-x-2">
            <CarIcon className="h-4 w-4" />
            <span className="font-medium">Carros Estacionados ({activeCars.length})</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRefresh()
              }}
              className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-gray-200"
              aria-label="Actualizar lista"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </Button>

        {!isExpanded && activeCars.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-center text-sm text-gray-600">
              Últimos:{" "}
              {activeCars
                .slice(0, 3)
                .map((car) => car.placa)
                .join(", ")}
              {activeCars.length > 3 && ` +${activeCars.length - 3} más`}
            </div>
          </div>
        )}

        {isExpanded && (
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            {activeCars.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <CarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay carros estacionados</p>
              </div>
            ) : (
              activeCars.map((car) => (
                <div key={car._id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-lg">{car.placa}</p>
                      <p className="text-sm text-gray-600">Ticket: {car.ticketAsociado}</p>
                      {car.imagenes && (
                        <div className="flex items-center space-x-1 mt-1">
                          <ImageIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-xs text-blue-600">Con imágenes</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xs text-gray-500">
                        {car.horaIngreso ? formatDateTime(car.horaIngreso) : "Sin fecha"}
                      </p>
                      {car.imagenes && (
                        <button
                          onClick={() => onViewImages(car)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          <Edit className="h-3 w-3 inline mr-1" />
                          Ver/Editar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default memo(MobileCarList)