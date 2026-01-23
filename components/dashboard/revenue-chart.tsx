'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { filterReserveFundRevenues } from '@/lib/utils/filter-reserve-fund'

interface Revenue {
  amount: number
  revenue_categories?: { name: string; color: string } | null
  description?: string | null
}

interface RevenueChartProps {
  revenues: Revenue[]
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function processRevenueData(revenues: Revenue[]) {
  // Filtrar fundo de reserva antes de processar
  const filteredRevenues = filterReserveFundRevenues(revenues)
  const categoryData: Record<string, { name: string; value: number; color: string }> = {}

  filteredRevenues.forEach((revenue) => {
    const categoryName = revenue.revenue_categories?.name || 'Sem categoria'
    const categoryColor = revenue.revenue_categories?.color || '#6366f1'
    
    if (!categoryData[categoryName]) {
      categoryData[categoryName] = {
        name: categoryName,
        value: 0,
        color: categoryColor,
      }
    }
    categoryData[categoryName].value += Number(revenue.amount)
  })

  return Object.values(categoryData).sort((a, b) => b.value - a.value).slice(0, 6)
}

function formatCurrencyTooltip(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function RevenueChart({ revenues }: RevenueChartProps) {
  const chartData = useMemo(() => processRevenueData(revenues), [revenues])

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-700 p-6 rounded-xl border border-slate-600 shadow-sm">
        <h3 className="font-bold text-white mb-4">Receitas Mensais</h3>
        <div className="h-64 flex items-center justify-center text-slate-400">
          <p>Nenhum dado disponível</p>
        </div>
      </div>
    )
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-slate-700 p-6 rounded-xl border border-slate-600 shadow-sm">
      <h3 className="font-bold text-white mb-4">Receitas Mensais</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={formatCurrencyTooltip} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        {chartData.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1)
          return (
            <div key={item.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">{item.name}</span>
                <span className="font-semibold text-white">{percentage}%</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color || COLORS[index % COLORS.length],
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

