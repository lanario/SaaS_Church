'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils/format-currency'
import { Card } from '@/components/ui/card'

interface MonthlyReportProps {
  data: {
    month: number
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
    }>
    transactions: Array<{
      id: string
      date: string
      description: string | null
      category: string | null
      member: string | null
      type: 'revenue' | 'expense'
      amount: number
    }>
  }
}

export function MonthlyReport({ data }: MonthlyReportProps) {
  const monthName = format(new Date(data.year, data.month - 1, 1), 'MMMM yyyy', { locale: ptBR })
  const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  // Formatar dados do gráfico com nome do mês
  const monthShortName = format(new Date(data.year, data.month - 1, 1), 'MMMM', { locale: ptBR })
  const chartData = data.monthlyData.length > 0 
    ? data.monthlyData.map(item => ({
        ...item,
        month: monthShortName.charAt(0).toUpperCase() + monthShortName.slice(1)
      }))
    : [{ 
        month: monthShortName.charAt(0).toUpperCase() + monthShortName.slice(1), 
        revenue: 0, 
        expense: 0 
      }]

  return (
    <div className="space-y-6">
      {/* Título do Relatório */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">
          Relatório de {monthNameCapitalized}
        </h2>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Entradas */}
        <Card className="p-6 border-2 border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300 mb-1">Total de Entradas</p>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(data.totalRevenue)}
              </p>
            </div>
          </div>
        </Card>

        {/* Total de Saídas */}
        <Card className="p-6 border-2 border-red-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300 mb-1">Total de Saídas</p>
              <p className="text-2xl font-bold text-red-400">
                {formatCurrency(data.totalExpense)}
              </p>
            </div>
          </div>
        </Card>

        {/* Saldo do Mês */}
        <Card className="p-6 border-2 border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300 mb-1">Saldo do Mês</p>
              <p className={`text-2xl font-bold ${data.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {formatCurrency(data.balance)}
              </p>
            </div>
          </div>
        </Card>

        {/* Variação vs Mês Anterior */}
        <Card className="p-6 border-2 border-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300 mb-1">Variação vs Mês Anterior</p>
              <div className="flex items-center gap-2">
                <span className={`text-lg ${data.variation >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.variation >= 0 ? '↑' : '↓'}
                </span>
                <p className={`text-2xl font-bold ${data.variation >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(Math.abs(data.variation))}
                </p>
              </div>
              <p className={`text-sm ${data.variationPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({data.variationPercent >= 0 ? '+' : ''}{data.variationPercent.toFixed(1)}%)
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico de Entradas e Saídas */}
      <Card className="p-6 bg-slate-700 border border-slate-600">
        <h3 className="font-bold text-white mb-6">Entradas e Saídas</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.2} vertical={false} />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#94a3b8', fontSize: 14, fontWeight: 500 }}
              axisLine={{ stroke: '#64748b', strokeWidth: 1 }}
              tickLine={{ stroke: '#64748b' }}
            />
            <YAxis 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(value) => {
                if (value >= 1000) {
                  return `R$ ${(value / 1000).toFixed(1)}k`
                }
                return `R$ ${value}`
              }}
              axisLine={{ stroke: '#64748b', strokeWidth: 1 }}
              tickLine={{ stroke: '#64748b' }}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569', 
                borderRadius: '8px', 
                color: '#fff',
                padding: '10px 14px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
              }}
              labelStyle={{ color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}
              itemStyle={{ padding: '2px 0' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '30px' }}
              iconType="square"
              iconSize={12}
              formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: '14px' }}>{value}</span>}
            />
            <Bar 
              dataKey="revenue" 
              name="Entradas"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
            />
            <Bar 
              dataKey="expense" 
              name="Saídas"
              fill="#ef4444"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Tabela de Transações */}
      <Card className="p-6">
        <h3 className="font-bold text-white mb-4">Todas as Transações do Mês</h3>
        {data.transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            Nenhuma transação encontrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-600 text-slate-300 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">DATA</th>
                  <th className="px-4 py-3">DESCRIÇÃO</th>
                  <th className="px-4 py-3">CATEGORIA</th>
                  <th className="px-4 py-3">MEMBRO</th>
                  <th className="px-4 py-3">TIPO</th>
                  <th className="px-4 py-3 text-right">VALOR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600">
                {data.transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-600 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {transaction.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {transaction.category || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {transaction.member || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        transaction.type === 'revenue' 
                          ? 'bg-green-900/50 text-green-300' 
                          : 'bg-red-900/50 text-red-300'
                      }`}>
                        {transaction.type === 'revenue' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold text-right ${
                      transaction.type === 'revenue' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'revenue' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

