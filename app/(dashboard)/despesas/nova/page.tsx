import { getExpenseCategories } from '@/app/actions/financial'
import { ExpenseForm } from '@/components/financial/expense-form'

export default async function NovaDespesaPage() {
  const { data: categories } = await getExpenseCategories()

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Nova Despesa</h1>
        <ExpenseForm categories={categories || []} />
      </div>
    </div>
  )
}

