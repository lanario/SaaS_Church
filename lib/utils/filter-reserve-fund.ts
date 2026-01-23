/**
 * Função auxiliar para verificar se uma transação pertence ao fundo de reserva
 */

export function isReserveFundTransaction(
  categoryName?: string | null,
  description?: string | null
): boolean {
  if (!categoryName && !description) {
    return false
  }

  const categoryLower = categoryName?.toLowerCase() || ''
  const descLower = description?.toLowerCase() || ''

  return (
    categoryLower === 'fundo de reserva' ||
    descLower.includes('fundo de reserva') ||
    descLower.includes('depósito no fundo') ||
    descLower.includes('retirada do fundo')
  )
}

/**
 * Extrair nome da categoria (suporta objeto ou array)
 */
function getCategoryName(category: any): string | null {
  if (!category) return null
  if (Array.isArray(category)) {
    return category[0]?.name || null
  }
  return category?.name || null
}

/**
 * Filtrar receitas excluindo fundo de reserva
 */
export function filterReserveFundRevenues<T extends { revenue_categories?: any; description?: string | null }>(
  revenues: T[]
): T[] {
  return revenues.filter(
    (revenue) => {
      const categoryName = getCategoryName(revenue.revenue_categories)
      return !isReserveFundTransaction(
        categoryName,
        revenue.description || null
      )
    }
  )
}

/**
 * Filtrar despesas excluindo fundo de reserva
 */
export function filterReserveFundExpenses<T extends { expense_categories?: any; description?: string | null }>(
  expenses: T[]
): T[] {
  return expenses.filter(
    (expense) => {
      const categoryName = getCategoryName(expense.expense_categories)
      return !isReserveFundTransaction(
        categoryName,
        expense.description || null
      )
    }
  )
}

