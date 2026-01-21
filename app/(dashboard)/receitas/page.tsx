import { getRevenues, getRevenueCategories } from '@/app/actions/financial'
import { RevenueList } from '@/components/financial/revenue-list'
import { CreateRevenueButton } from '@/components/financial/create-revenue-button'

export default async function ReceitasPage() {
  const { data: revenues, error } = await getRevenues()
  const { data: categories } = await getRevenueCategories()

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
          Erro ao carregar receitas: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Receitas</h1>
          <p className="text-gray-500 mt-1">Gerencie todas as entradas financeiras</p>
        </div>
        <CreateRevenueButton categories={categories || []} />
      </div>

      <RevenueList revenues={revenues || []} categories={categories || []} />
    </div>
  )
}

