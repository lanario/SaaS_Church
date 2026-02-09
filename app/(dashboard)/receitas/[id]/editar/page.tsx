import { getRevenue, getRevenueCategories } from '@/app/actions/financial'
import { notFound } from 'next/navigation'
import { RevenueForm } from '@/components/financial/revenue-form'

export default async function EditarReceitaPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: revenue, error: revenueError } = await getRevenue(params.id)
  const { data: categories, error: categoriesError } = await getRevenueCategories()

  if (revenueError || !revenue || categoriesError) {
    notFound()
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Editar Receita</h1>
        <p className="text-slate-300 mb-6">Atualize as informações da receita</p>
        <RevenueForm
          categories={categories || []}
          revenue={{
            id: revenue.id,
            categoryId: revenue.category_id,
            amount: revenue.amount,
            description: revenue.description,
            paymentMethod: revenue.payment_method,
            transactionDate: revenue.transaction_date,
            memberId: revenue.member_id,
          }}
          mode="edit"
        />
      </div>
    </div>
  )
}
