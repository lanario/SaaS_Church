'use client'

import { FaArrowUp, FaArrowDown, FaFilePdf } from 'react-icons/fa'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { formatCurrency } from '@/lib/utils/format-currency'
import { exportRevenueVsExpensePDF } from '@/lib/utils/pdf-export'

interface RevenueVsExpenseReportProps {
  data: any
}

export function RevenueVsExpenseReport({ data }: RevenueVsExpenseReportProps) {
  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          Carregando dados...
        </CardContent>
      </Card>
    )
  }

  const { totalRevenue, totalExpense, balance, monthlyData } = data

  async function handleExportPDF() {
    await exportRevenueVsExpensePDF(data)
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Receitas</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <FaArrowUp className="text-green-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Despesas</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <FaArrowDown className="text-red-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Saldo Final</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <FaArrowUp className={`text-xl ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão de Exportar */}
      <div className="flex justify-end">
        <Button onClick={handleExportPDF} className="flex items-center gap-2">
          <FaFilePdf />
          Exportar PDF
        </Button>
      </div>

      {/* Gráfico de Linha Temporal */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-800 mb-4">Evolução Mensal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Receitas" />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Despesas" />
              <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} name="Saldo" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Barras Comparativo */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-800 mb-4">Receitas vs Despesas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Receitas" />
              <Bar dataKey="expense" fill="#ef4444" name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

