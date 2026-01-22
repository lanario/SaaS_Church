'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { formatCurrency } from '@/lib/utils/format-currency'
import { Card } from '@/components/ui/card'
import { FaArrowUp, FaArrowDown } from 'react-icons/fa'

interface AnnualReportProps {
  data: {
    year: number
    totalRevenue: number
    totalExpense: number
    balance: number
    variation: number
    variationPercent: number
    monthlyData: Array<{
      month: string
      revenue: number
      expense: number
      balance: number
    }>
  }
}

function formatTooltipValue(value: number) {
  return formatCurrency(value)
}

function SummaryCard({ title, value, color, icon }: { title: string; value: number; color: string; icon?: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-300 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{formatCurrency(value)}</p>
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${color.includes('green') ? 'bg-green-900/30' : color.includes('red') ? 'bg-red-900/30' : color.includes('blue') ? 'bg-blue-900/30' : 'bg-purple-900/30'}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

function VariationCard({ variation, variationPercent }: { variation: number; variationPercent: number }) {
  const isPositive = variation >= 0
  const color = isPositive ? 'text-purple-400' : 'text-red-400'
  const bgColor = isPositive ? 'bg-purple-900/30' : 'bg-red-900/30'
  const icon = isPositive ? <FaArrowUp className="text-purple-400 text-xl" /> : <FaArrowDown className="text-red-400 text-xl" />
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-300 mb-1">Variação vs Ano Anterior</p>
          <p className={`text-2xl font-bold ${color}`}>
            {isPositive ? '↑' : '↓'} {formatCurrency(Math.abs(variation))} ({variationPercent.toFixed(1)}%)
          </p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

function MonthlySummaryTable({ monthlyData }: { monthlyData: Array<{ month: string; revenue: number; expense: number; balance: number }> }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-white mb-4">Resumo por Mês</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-600 text-slate-300 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-3">MÊS</th>
              <th className="px-6 py-3 text-right">ENTRADAS</th>
              <th className="px-6 py-3 text-right">SAÍDAS</th>
              <th className="px-6 py-3 text-right">SALDO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-600">
            {monthlyData.map((item, index) => (
              <tr key={item.month} className={index % 2 === 0 ? 'bg-slate-700' : 'bg-slate-600/50'}>
                <td className="px-6 py-4 font-medium text-white">{item.month}</td>
                <td className="px-6 py-4 text-right text-green-400 font-semibold">
                  {formatCurrency(item.revenue)}
                </td>
                <td className="px-6 py-4 text-right text-red-400 font-semibold">
                  {formatCurrency(item.expense)}
                </td>
                <td className={`px-6 py-4 text-right font-semibold ${item.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  {formatCurrency(item.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function AnnualReport({ data }: AnnualReportProps) {
  // Preparar dados para os gráficos
  const lineChartData = data.monthlyData.map(item => ({
    ...item,
    Entradas: item.revenue,
    Saídas: item.expense,
    Saldo: item.balance,
  }))

  const barChartData = data.monthlyData.map(item => ({
    ...item,
    Entradas: item.revenue,
    Saídas: item.expense,
  }))

  // Calcular máximo para o eixo Y (com margem de 20%)
  const maxValue = Math.max(
    ...data.monthlyData.map(m => Math.max(m.revenue, m.expense, Math.abs(m.balance)))
  )
  const yAxisMax = maxValue > 0 ? maxValue * 1.2 : 4

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Relatório Anual de {data.year}</h2>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total de Entradas"
          value={data.totalRevenue}
          color="text-green-400"
          icon={<FaArrowUp className="text-green-400 text-xl" />}
        />
        <SummaryCard
          title="Total de Saídas"
          value={data.totalExpense}
          color="text-red-400"
          icon={<FaArrowDown className="text-red-400 text-xl" />}
        />
        <SummaryCard
          title="Saldo Anual"
          value={data.balance}
          color="text-blue-400"
        />
        <VariationCard
          variation={data.variation}
          variationPercent={data.variationPercent}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linha */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Evolução Mensal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#cbd5e1' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#cbd5e1' }}
                tickFormatter={formatTooltipValue}
                domain={[0, yAxisMax]}
              />
              <Tooltip 
                formatter={formatTooltipValue}
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#fff' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Entradas" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="Saídas" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="Saldo" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Gráfico de Barras */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Entradas vs Saídas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#cbd5e1' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#cbd5e1' }}
                tickFormatter={formatTooltipValue}
                domain={[0, yAxisMax]}
              />
              <Tooltip 
                formatter={formatTooltipValue}
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="Entradas" fill="#10b981" />
              <Bar dataKey="Saídas" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tabela de Resumo Mensal */}
      <MonthlySummaryTable monthlyData={data.monthlyData} />
    </div>
  )
}

