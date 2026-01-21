'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa'
import { deleteRevenue } from '@/app/actions/financial'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Revenue {
  id: string
  amount: number
  description?: string | null
  transaction_date: string
  payment_method: string
  member_id?: string | null
  revenue_categories?: { name: string; color: string } | null
}

interface RevenueListProps {
  revenues: Revenue[]
  categories?: Array<{ id: string; name: string }>
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function RevenueList({ revenues, categories }: RevenueListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) {
      return
    }

    setDeletingId(id)
    try {
      await deleteRevenue(id)
      window.location.reload()
    } catch (error) {
      alert('Erro ao excluir receita')
    } finally {
      setDeletingId(null)
    }
  }

  if (revenues.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">Nenhuma receita cadastrada ainda.</p>
      </Card>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Método</th>
              <th className="px-6 py-4 text-right">Valor</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {revenues.map((revenue) => (
              <tr key={revenue.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
                      <FaPlus />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {revenue.description || 
                        (revenue.member_id ? 'Dízimo' : 'Receita')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {revenue.revenue_categories?.name || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {format(new Date(revenue.transaction_date), 'dd MMM yyyy', {
                    locale: ptBR,
                  })}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                  {revenue.payment_method}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-green-600 text-right">
                  {formatCurrency(Number(revenue.amount))}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(revenue.id)}
                    disabled={deletingId === revenue.id}
                    className="text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

