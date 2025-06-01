"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDateTime } from "@/lib/utils"

interface CarHistoryItem {
  _id: string
  placa: string
  marca: string
  modelo: string
  color: string
  nombreDueño: string
  telefono: string
  ticketAsociado: string
  horaIngreso: string
  horaSalida?: string
  montoTotal: number
  estado: string
  fechaRegistro: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function CarHistory() {
  const [history, setHistory] = useState<CarHistoryItem[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchInput, setSearchInput] = useState("")

  useEffect(() => {
    fetchHistory()
  }, [pagination.page, searchTerm])

  const fetchHistory = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
      })

      const response = await fetch(`/api/admin/car-history?${params}`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Error fetching car history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setSearchTerm(searchInput)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "activo":
        return <Badge variant="destructive">Estacionado</Badge>
      case "pagado":
        return <Badge>Pagado</Badge>
      case "finalizado":
        return <Badge variant="secondary">Finalizado</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Carros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Búsqueda */}
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por placa, nombre, marca o ticket..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} variant="outline">
            <Search className="h-4 w-4" />
          </Button>
          <Button onClick={fetchHistory} variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="text-sm text-gray-600">
          Mostrando {history.length} de {pagination.total} registros
        </div>

        {/* Lista de Historial */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No se encontraron registros</p>
            </div>
          ) : (
            history.map((item) => (
              <div key={item._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="space-y-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium text-lg">{item.placa}</p>
                      <p className="text-sm text-gray-600">
                        {item.marca} {item.modelo} - {item.color}
                      </p>
                      <p className="text-sm text-gray-600">
                        Dueño: {item.nombreDueño} | Tel: {item.telefono}
                      </p>
                      <p className="text-sm text-gray-500">Ticket: {item.ticketAsociado}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  {getStatusBadge(item.estado)}
                  <p className="text-sm text-gray-500">
                    Ingreso: {item.horaIngreso ? formatDateTime(item.horaIngreso) : "Sin fecha"}
                  </p>
                  {item.horaSalida && (
                    <p className="text-sm text-gray-500">Salida: {formatDateTime(item.horaSalida)}</p>
                  )}
                  {item.montoTotal > 0 && <p className="text-sm font-medium">Total: ${item.montoTotal.toFixed(2)}</p>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paginación */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <Button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            <span className="text-sm text-gray-600">
              Página {pagination.page} de {pagination.pages}
            </span>
            <Button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              variant="outline"
              size="sm"
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
