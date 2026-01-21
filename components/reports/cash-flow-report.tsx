'use client'

import { FaMoneyBillWave, FaFilePdf } from 'react-icons/fa'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils/format-currency'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CashFlowReportProps {
  data: any
}

export function CashFlowReport({ data }: CashFlowReportProps) {
  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          Carregando dados...
        </CardContent>
      </Card>
    )
  }

  const { dailyBalances, startingBalance, endingBalance } = data

  // Formatar dados para o gráfico
  const chartData = dailyBalances.map((day: any) => ({
    date: format(new Date(day.date), 'dd/MM', { locale: ptBR }),
    revenue: day.revenue,
    expense: day.expense,
    balance: day.balance,
  }))

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-1">Saldo Inicial</p>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(startingBalance)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-1">Saldo Final</p>
            <p className={`text-2xl font-bold ${endingBalance >= startingBalance ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(endingBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Botão de Exportar */}
      <div className="flex justify-end">
        <Button variant="outline" className="flex items-center gap-2">
          <FaFilePdf />
          Exportar PDF
        </Button>
      </div>

      {/* Gráfico de Fluxo de Caixa */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FaMoneyBillWave className="text-indigo-600" />
              Fluxo de Caixa Diário
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorBalance)"
                name="Saldo Acumulado"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Receitas vs Despesas Diárias */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-800 mb-4">Movimentações Diárias</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Receitas" />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Despesas" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

