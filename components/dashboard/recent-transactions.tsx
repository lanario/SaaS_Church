import Link from 'next/link'
import { FaPlus, FaMinus } from 'react-icons/fa'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Transaction {
  id: string
  description?: string | null
  amount: number
  transaction_date: string
  type: 'revenue' | 'expense'
  revenue_categories?: { name: string } | null
  expense_categories?: { name: string } | null
  members?: { full_name: string } | null
}

interface RecentTransactionsProps {
  transactions: Transaction[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function getTransactionCategory(transaction: Transaction) {
  const isRevenue = transaction.type === 'revenue'
  return isRevenue
    ? transaction.revenue_categories?.name
    : transaction.expense_categories?.name
}

function getTransactionDescription(transaction: Transaction) {
  if (transaction.description) {
    return transaction.description
  }
  
  const isRevenue = transaction.type === 'revenue'
  if (isRevenue && transaction.members) {
    return `Dízimo - ${transaction.members.full_name}`
  }
  
  return 'Transação'
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isRevenue = transaction.type === 'revenue'
  const category = getTransactionCategory(transaction)
  const description = getTransactionDescription(transaction)
  
  return (
    <tr className="hover:bg-slate-600 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
              isRevenue
                ? 'bg-green-900/30 text-green-400'
                : 'bg-red-900/30 text-red-400'
            }`}
          >
            {isRevenue ? <FaPlus /> : <FaMinus />}
          </div>
          <span className="text-sm font-medium text-white">
            {description}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-300">
        {category || '-'}
      </td>
      <td className="px-6 py-4 text-sm text-slate-300">
        {format(new Date(transaction.transaction_date), 'dd MMM yyyy', {
          locale: ptBR,
        })}
      </td>
      <td
        className={`px-6 py-4 text-sm font-bold text-right ${
          isRevenue ? 'text-green-400' : 'text-red-400'
        }`}
      >
        {isRevenue ? '+' : '-'} {formatCurrency(Number(transaction.amount))}
      </td>
    </tr>
  )
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-slate-700 rounded-xl border border-slate-600 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-600 flex justify-between items-center">
          <h3 className="font-bold text-white">Últimas Movimentações</h3>
        </div>
        <div className="p-8 text-center text-slate-400">
          <p>Nenhuma transação encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-700 rounded-xl border border-slate-600 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-600 flex justify-between items-center">
        <h3 className="font-bold text-white">Últimas Movimentações</h3>
        <Link
          href="/receitas"
          className="text-indigo-400 text-sm font-medium hover:text-indigo-300 hover:underline transition-colors"
        >
          Ver tudo
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-600 text-slate-300 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-600">
            {transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

