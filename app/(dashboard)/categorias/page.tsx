import { getRevenueCategories, getExpenseCategories } from '@/app/actions/financial'
import { CategoryManager } from '@/components/financial/category-manager'

export default async function CategoriasPage() {
  const { data: revenueCategories } = await getRevenueCategories()
  const { data: expenseCategories } = await getExpenseCategories()

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Categorias</h1>
        <p className="text-gray-500 mt-1">Gerencie categorias de receitas e despesas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CategoryManager
          type="revenue"
          categories={revenueCategories || []}
          title="Categorias de Receitas"
        />
        <CategoryManager
          type="expense"
          categories={expenseCategories || []}
          title="Categorias de Despesas"
        />
      </div>
    </div>
  )
}

