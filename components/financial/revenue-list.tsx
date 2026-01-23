'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FaPlus, FaTrash } from 'react-icons/fa'
import { deleteRevenue } from '@/app/actions/financial'
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
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function getRevenueDescription(revenue: Revenue) {
  if (revenue.description) {
    return revenue.description
  }
  return revenue.member_id ? 'Dízimo' : 'Receita'
}

interface RevenueRowProps {
  revenue: Revenue
  onDelete: (id: string) => void
  isDeleting: boolean
}

function RevenueRow({ revenue, onDelete, isDeleting }: RevenueRowProps) {
  // Verificar se é do fundo de reserva
  const isReserveFund = 
    revenue.revenue_categories?.name?.toLowerCase() === 'fundo de reserva' ||
    revenue.description?.toLowerCase().includes('fundo de reserva') ||
    revenue.description?.toLowerCase().includes('retirada do fundo')

  return (
    <tr className="hover:bg-slate-600 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-900/30 text-green-400 flex items-center justify-center text-xs">
            <FaPlus />
          </div>
          <span className="text-sm font-medium text-white">
            {getRevenueDescription(revenue)}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-300">
        {revenue.revenue_categories?.name || '-'}
      </td>
      <td className="px-6 py-4 text-sm text-slate-300">
        {format(new Date(revenue.transaction_date), 'dd MMM yyyy', {
          locale: ptBR,
        })}
      </td>
      <td className="px-6 py-4 text-sm text-slate-300 capitalize">
        {revenue.payment_method}
      </td>
      <td className="px-6 py-4 text-sm font-bold text-green-400 text-right">
        {formatCurrency(Number(revenue.amount))}
      </td>
      <td className="px-6 py-4 text-right">
        {isReserveFund ? (
          <span className="text-xs text-slate-500 italic">Protegida</span>
        ) : (
          <button
            onClick={() => onDelete(revenue.id)}
            disabled={isDeleting}
            className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
            title="Excluir receita"
          >
            <FaTrash />
          </button>
        )}
      </td>
    </tr>
  )
}

export function RevenueList({ revenues }: RevenueListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) {
      return
    }

    setDeletingId(id)
    try {
      const result = await deleteRevenue(id)
      if (result?.error) {
        alert(result.error)
        return
      }
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
        <p className="text-slate-400">Nenhuma receita cadastrada ainda.</p>
      </Card>
    )
  }

  return (
    <div className="bg-slate-700 rounded-xl border border-slate-600 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-600 text-slate-300 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Método</th>
              <th className="px-6 py-4 text-right">Valor</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-600">
            {revenues.map((revenue) => (
              <RevenueRow
                key={revenue.id}
                revenue={revenue}
                onDelete={handleDelete}
                isDeleting={deletingId === revenue.id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

