import { getRevenueCategories } from '@/app/actions/financial'
import { RevenueForm } from '@/components/financial/revenue-form'

export default async function NovaReceitaPage() {
  const { data: categories } = await getRevenueCategories()

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Nova Receita</h1>
        <RevenueForm categories={categories || []} />
      </div>
    </div>
  )
}

