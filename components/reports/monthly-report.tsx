'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FaFileAlt } from 'react-icons/fa'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
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
        <h2 className="text-xl font-bold text-gray-800">
          Relatório de {monthNameCapitalized}
        </h2>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Entradas */}
        <Card className="p-6 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de Entradas</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(data.totalRevenue)}
              </p>
            </div>
          </div>
        </Card>

        {/* Total de Saídas */}
        <Card className="p-6 border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de Saídas</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(data.totalExpense)}
              </p>
            </div>
          </div>
        </Card>

        {/* Saldo do Mês */}
        <Card className="p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Saldo do Mês</p>
              <p className={`text-2xl font-bold ${data.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(data.balance)}
              </p>
            </div>
          </div>
        </Card>

        {/* Variação vs Mês Anterior */}
        <Card className="p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Variação vs Mês Anterior</p>
              <div className="flex items-center gap-2">
                <span className={`text-lg ${data.variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.variation >= 0 ? '↑' : '↓'}
                </span>
                <p className={`text-2xl font-bold ${data.variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(data.variation))}
                </p>
              </div>
              <p className={`text-sm ${data.variationPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ({data.variationPercent >= 0 ? '+' : ''}{data.variationPercent.toFixed(1)}%)
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico de Entradas e Saídas */}
      <Card className="p-6">
        <h3 className="font-bold text-gray-800 mb-4">Entradas e Saídas</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280' }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#10b981" 
              strokeWidth={2} 
              name="Entradas"
              dot={{ fill: '#10b981', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="expense" 
              stroke="#ef4444" 
              strokeWidth={2} 
              name="Saídas"
              dot={{ fill: '#ef4444', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Tabela de Transações */}
      <Card className="p-6">
        <h3 className="font-bold text-gray-800 mb-4">Todas as Transações do Mês</h3>
        {data.transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma transação encontrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">DATA</th>
                  <th className="px-4 py-3">DESCRIÇÃO</th>
                  <th className="px-4 py-3">CATEGORIA</th>
                  <th className="px-4 py-3">MEMBRO</th>
                  <th className="px-4 py-3">TIPO</th>
                  <th className="px-4 py-3 text-right">VALOR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {transaction.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transaction.category || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transaction.member || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        transaction.type === 'revenue' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {transaction.type === 'revenue' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold text-right ${
                      transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'
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

