'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FaMinus, FaTrash } from 'react-icons/fa'
import { deleteExpense } from '@/app/actions/financial'

interface Expense {
  id: string
  amount: number
  description?: string | null
  transaction_date: string
  payment_method: string
  expense_categories?: { name: string; color: string } | null
}

interface ExpenseListProps {
  expenses: Expense[]
  categories?: Array<{ id: string; name: string }>
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function ExpenseList({ expenses, categories }: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) {
      return
    }

    setDeletingId(id)
    try {
      await deleteExpense(id)
      window.location.reload()
    } catch (error) {
      alert('Erro ao excluir despesa')
    } finally {
      setDeletingId(null)
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-gray-500">Nenhuma despesa cadastrada ainda.</p>
      </div>
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
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">
                      <FaMinus />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {expense.description || 'Despesa'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {expense.expense_categories?.name || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {format(new Date(expense.transaction_date), 'dd MMM yyyy', {
                    locale: ptBR,
                  })}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                  {expense.payment_method}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">
                  {formatCurrency(Number(expense.amount))}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(expense.id)}
                    disabled={deletingId === expense.id}
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

