'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaCalendarAlt, FaFilter } from 'react-icons/fa'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ReportFiltersProps {
  initialFilters: {
    period?: 'month' | 'quarter' | 'year' | 'custom'
    month?: number
    quarter?: number
    year?: number
    startDate?: string
    endDate?: string
    categoryId?: string
  }
}

export function ReportFilters({ initialFilters }: ReportFiltersProps) {
  const router = useRouter()
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year' | 'custom'>(
    initialFilters.period || 'month'
  )
  const [month, setMonth] = useState(initialFilters.month || new Date().getMonth() + 1)
  const [quarter, setQuarter] = useState(initialFilters.quarter || 1)
  const [year, setYear] = useState(initialFilters.year || new Date().getFullYear())
  const [startDate, setStartDate] = useState(initialFilters.startDate || '')
  const [endDate, setEndDate] = useState(initialFilters.endDate || '')

  function handleFilter() {
    const params = new URLSearchParams()
    params.set('period', period)
    
    if (period === 'month') {
      params.set('month', month.toString())
      params.set('year', year.toString())
    } else if (period === 'quarter') {
      params.set('quarter', quarter.toString())
      params.set('year', year.toString())
    } else if (period === 'year') {
      params.set('year', year.toString())
    } else if (period === 'custom') {
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
    }

    router.push(`/relatorios?${params.toString()}`)
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-indigo-600" />
          <h3 className="font-bold text-gray-800">Filtros do Relatório</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Período
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="month">Mensal</option>
              <option value="quarter">Trimestral</option>
              <option value="year">Anual</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {period === 'month' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Mês
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2024, m - 1).toLocaleDateString('pt-BR', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Ano
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {period === 'quarter' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Trimestre
                </label>
                <select
                  value={quarter}
                  onChange={(e) => setQuarter(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>1º Trimestre</option>
                  <option value={2}>2º Trimestre</option>
                  <option value={3}>3º Trimestre</option>
                  <option value={4}>4º Trimestre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Ano
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {period === 'year' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Ano
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {period === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          <div className="flex items-end">
            <Button onClick={handleFilter} className="w-full flex items-center gap-2">
              <FaCalendarAlt />
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

