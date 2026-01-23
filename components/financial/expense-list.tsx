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
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function getExpenseDescription(expense: Expense) {
  return expense.description || 'Despesa'
}

interface ExpenseRowProps {
  expense: Expense
  onDelete: (id: string) => void
  isDeleting: boolean
}

function ExpenseRow({ expense, onDelete, isDeleting }: ExpenseRowProps) {
  // Verificar se é do fundo de reserva
  const isReserveFund = 
    expense.expense_categories?.name?.toLowerCase() === 'fundo de reserva' ||
    expense.description?.toLowerCase().includes('fundo de reserva') ||
    expense.description?.toLowerCase().includes('depósito no fundo')

  return (
    <tr className="hover:bg-slate-600 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-900/30 text-red-400 flex items-center justify-center text-xs">
            <FaMinus />
          </div>
          <span className="text-sm font-medium text-white">
            {getExpenseDescription(expense)}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-300">
        {expense.expense_categories?.name || '-'}
      </td>
      <td className="px-6 py-4 text-sm text-slate-300">
        {format(new Date(expense.transaction_date), 'dd MMM yyyy', {
          locale: ptBR,
        })}
      </td>
      <td className="px-6 py-4 text-sm text-slate-300 capitalize">
        {expense.payment_method}
      </td>
      <td className="px-6 py-4 text-sm font-bold text-red-400 text-right">
        {formatCurrency(Number(expense.amount))}
      </td>
      <td className="px-6 py-4 text-right">
        {isReserveFund ? (
          <span className="text-xs text-slate-500 italic">Protegida</span>
        ) : (
          <button
            onClick={() => onDelete(expense.id)}
            disabled={isDeleting}
            className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
            title="Excluir despesa"
          >
            <FaTrash />
          </button>
        )}
      </td>
    </tr>
  )
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) {
      return
    }

    setDeletingId(id)
    try {
      const result = await deleteExpense(id)
      if (result?.error) {
        alert(result.error)
        return
      }
      window.location.reload()
    } catch (error) {
      alert('Erro ao excluir despesa')
    } finally {
      setDeletingId(null)
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-slate-700 rounded-xl border border-slate-600 shadow-sm p-8 text-center">
        <p className="text-slate-400">Nenhuma despesa cadastrada ainda.</p>
      </div>
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
            {expenses.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                onDelete={handleDelete}
                isDeleting={deletingId === expense.id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

