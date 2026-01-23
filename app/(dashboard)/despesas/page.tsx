import { getExpenses, getExpenseCategories } from '@/app/actions/financial'
import { ExpenseList } from '@/components/financial/expense-list'
import { CreateExpenseButton } from '@/components/financial/create-expense-button'

export default async function DespesasPage() {
  const { data: expenses, error } = await getExpenses()
  const { data: categories } = await getExpenseCategories()

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300">
          Erro ao carregar despesas: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Despesas</h1>
          <p className="text-slate-300 mt-1">Gerencie todas as saídas financeiras</p>
        </div>
        <CreateExpenseButton categories={categories || []} />
      </div>

      <ExpenseList expenses={expenses || []} />
    </div>
  )
}

