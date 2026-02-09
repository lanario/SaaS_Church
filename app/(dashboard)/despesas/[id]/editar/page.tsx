import { getExpense, getExpenseCategories } from '@/app/actions/financial'
import { notFound } from 'next/navigation'
import { ExpenseForm } from '@/components/financial/expense-form'

export default async function EditarDespesaPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: expense, error } = await getExpense(params.id)
  const { data: categories } = await getExpenseCategories()

  if (error || !expense) {
    notFound()
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Editar Despesa</h1>
        <p className="text-slate-300 mb-6">Atualize as informações da despesa</p>
        <ExpenseForm
          categories={categories || []}
          expense={{
            id: expense.id,
            categoryId: expense.category_id,
            amount: expense.amount,
            description: expense.description,
            paymentMethod: expense.payment_method,
            transactionDate: expense.transaction_date,
            receiptUrl: expense.receipt_url,
          }}
          mode="edit"
        />
      </div>
    </div>
  )
}
