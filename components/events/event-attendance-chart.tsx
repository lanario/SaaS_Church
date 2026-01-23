'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface Event {
  id: string
  title: string
  event_date: string
  estimated_members?: number | null
  estimated_visitors?: number | null
  actual_members?: number | null
  actual_visitors?: number | null
}

interface EventAttendanceChartProps {
  events: Event[]
}

function formatTooltipValue(value: number) {
  return value.toString()
}

export function EventAttendanceChart({ events }: EventAttendanceChartProps) {
  const chartData = useMemo(() => {
    // Filtrar apenas eventos com dados reais
    const eventsWithData = events.filter(e => 
      e.actual_members !== null && e.actual_visitors !== null
    )

    if (eventsWithData.length === 0) {
      return []
    }

    return eventsWithData
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .slice(-10) // Últimos 10 eventos
      .map(event => {
        const estimatedMembers = event.estimated_members || 0
        const estimatedVisitors = event.estimated_visitors || 0
        const actualMembers = event.actual_members || 0
        const actualVisitors = event.actual_visitors || 0

        return {
          name: event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title,
          'Membros Estimado': estimatedMembers,
          'Membros Real': actualMembers,
          'Visitantes Estimado': estimatedVisitors,
          'Visitantes Real': actualVisitors,
          'Total Estimado': estimatedMembers + estimatedVisitors,
          'Total Real': actualMembers + actualVisitors,
        }
      })
  }, [events])

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-bold text-gray-800">Comparação de Presença</h3>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
            Nenhum dado de presença real disponível para exibir gráfico
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-bold text-gray-800">Comparação de Presença</h3>
        <p className="text-sm text-gray-600 mt-1">
          Comparação entre presença estimada e real (últimos 10 eventos)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip formatter={formatTooltipValue} />
            <Legend />
            <Bar dataKey="Membros Estimado" fill="#a78bfa" opacity={0.7} />
            <Bar dataKey="Membros Real" fill="#6366f1" />
            <Bar dataKey="Visitantes Estimado" fill="#fbbf24" opacity={0.7} />
            <Bar dataKey="Visitantes Real" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>

        {/* Gráfico de Total */}
        <div className="mt-8">
          <h4 className="font-semibold text-gray-700 mb-4">Total de Pessoas (Estimado vs Real)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip formatter={formatTooltipValue} />
              <Legend />
              <Bar dataKey="Total Estimado" fill="#94a3b8" opacity={0.7} />
              <Bar dataKey="Total Real" fill="#475569" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

