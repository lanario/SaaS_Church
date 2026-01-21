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

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Últimas Movimentações</h3>
        </div>
        <div className="p-8 text-center text-gray-500">
          <p>Nenhuma transação encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-800">Últimas Movimentações</h3>
        <Link
          href="/receitas"
          className="text-indigo-600 text-sm font-medium hover:underline"
        >
          Ver tudo
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((transaction) => {
              const isRevenue = transaction.type === 'revenue'
              const category = isRevenue
                ? transaction.revenue_categories?.name
                : transaction.expense_categories?.name
              const description = transaction.description || 
                (isRevenue && transaction.members 
                  ? `Dízimo - ${transaction.members.full_name}`
                  : 'Transação')
              
              return (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                          isRevenue
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {isRevenue ? <FaPlus /> : <FaMinus />}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {description}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {category || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(transaction.transaction_date), 'dd MMM yyyy', {
                      locale: ptBR,
                    })}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm font-bold text-right ${
                      isRevenue ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {isRevenue ? '+' : '-'} {formatCurrency(Number(transaction.amount))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

