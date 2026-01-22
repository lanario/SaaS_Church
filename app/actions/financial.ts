'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/utils/get-church-id'
import type { RevenueInput, ExpenseInput, RevenueCategoryInput, ExpenseCategoryInput } from '@/lib/validations/financial'

// ============================================
// CATEGORIAS PADRÃO
// ============================================

/**
 * Garantir que as categorias padrão existam para uma igreja
 */
export async function ensureDefaultCategories(churchId: string) {
  const supabase = await createClient()

  // Verificar se as categorias já existem
  const { data: existingCategories } = await supabase
    .from('revenue_categories')
    .select('name')
    .eq('church_id', churchId)
    .in('name', ['Dízimos', 'Ofertas'])

  const existingNames = existingCategories?.map(c => c.name) || []
  
  // Criar "Dízimos" se não existir
  if (!existingNames.includes('Dízimos')) {
    await supabase
      .from('revenue_categories')
      .insert({
        church_id: churchId,
        name: 'Dízimos',
        description: 'Contribuição regular dos membros',
        color: '#10b981',
      })
  }

  // Criar "Ofertas" se não existir
  if (!existingNames.includes('Ofertas')) {
    await supabase
      .from('revenue_categories')
      .insert({
        church_id: churchId,
        name: 'Ofertas',
        description: 'Ofertas do dia',
        color: '#3b82f6',
      })
  }
}

// ============================================
// RECEITAS
// ============================================

export async function createRevenue(data: RevenueInput) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  // Garantir categorias padrão
  await ensureDefaultCategories(churchId)
  
  const { data: { user } } = await supabase.auth.getUser()

  const transactionDate = typeof data.transactionDate === 'string' 
    ? new Date(data.transactionDate) 
    : data.transactionDate

  // Buscar informações da categoria e membro (se necessário)
  let description = data.description || null
  let memberId = data.memberId || null
  let paymentMethod = data.paymentMethod

  if (data.categoryId) {
    const { data: category } = await supabase
      .from('revenue_categories')
      .select('name')
      .eq('id', data.categoryId)
      .single()

    if (category) {
      const categoryName = category.name.toLowerCase()

      // Se for "Ofertas", preencher descrição automaticamente
      if (categoryName === 'ofertas') {
        const date = new Date(transactionDate)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        const dateStr = `${day}/${month}/${year}`
        description = `Oferta do dia ${dateStr}`
        memberId = null // Ofertas não têm membro
        // Ofertas sempre usam 'cash' como método de pagamento
        paymentMethod = 'cash'
      }
      // Se for "Dízimos", preencher descrição com nome do membro
      else if (categoryName === 'dízimos' || categoryName === 'dizimos') {
        if (memberId) {
          const { data: member } = await supabase
            .from('members')
            .select('full_name')
            .eq('id', memberId)
            .single()
          
          if (member) {
            description = `Dízimo de ${member.full_name}`
          } else {
            description = 'Dízimo'
          }
        } else {
          return { error: 'Dízimos requerem seleção de um membro' }
        }
        // Dízimos sempre usam 'cash' como método de pagamento
        paymentMethod = 'cash'
      }
    }
  }

  const insertData = {
    church_id: churchId,
    category_id: data.categoryId || null,
    member_id: memberId,
    amount: data.amount,
    description: description,
    payment_method: paymentMethod,
    transaction_date: transactionDate.toISOString().split('T')[0],
    created_by: user?.id,
  }

  console.log('Inserting revenue data:', insertData)

  const { data: insertedData, error } = await supabase
    .from('revenues')
    .insert(insertData)
    .select()

  if (error) {
    console.error('Error inserting revenue:', error)
    return { error: error.message }
  }

  console.log('Revenue created successfully:', insertedData)

  revalidatePath('/dashboard')
  revalidatePath('/receitas')
  return { success: true }
}

export async function getRevenues(period?: { start: Date; end: Date }) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  // Garantir categorias padrão ao buscar receitas
  await ensureDefaultCategories(churchId)

  let query = supabase
    .from('revenues')
    .select(`
      *,
      revenue_categories(name, color)
    `)
    .eq('church_id', churchId)
    .order('transaction_date', { ascending: false })

  if (period) {
    query = query
      .gte('transaction_date', period.start.toISOString().split('T')[0])
      .lte('transaction_date', period.end.toISOString().split('T')[0])
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function deleteRevenue(id: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  const { error } = await supabase
    .from('revenues')
    .delete()
    .eq('id', id)
    .eq('church_id', churchId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/receitas')
  return { success: true }
}

// ============================================
// DESPESAS
// ============================================

export async function createExpense(data: ExpenseInput) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }
  
  const { data: { user } } = await supabase.auth.getUser()

  const transactionDate = typeof data.transactionDate === 'string' 
    ? new Date(data.transactionDate) 
    : data.transactionDate

  const { error } = await supabase
    .from('expenses')
    .insert({
      church_id: churchId,
      category_id: data.categoryId || null,
      amount: data.amount,
      description: data.description || null,
      payment_method: data.paymentMethod,
      transaction_date: transactionDate.toISOString().split('T')[0],
      receipt_url: data.receiptUrl || null,
      created_by: user?.id,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/despesas')
  return { success: true }
}

export async function getExpenses(period?: { start: Date; end: Date }) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  let query = supabase
    .from('expenses')
    .select(`
      *,
      expense_categories(name, color)
    `)
    .eq('church_id', churchId)
    .order('transaction_date', { ascending: false })

  if (period) {
    query = query
      .gte('transaction_date', period.start.toISOString().split('T')[0])
      .lte('transaction_date', period.end.toISOString().split('T')[0])
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function deleteExpense(id: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('church_id', churchId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/despesas')
  return { success: true }
}

// ============================================
// CATEGORIAS DE RECEITAS
// ============================================

export async function createRevenueCategory(data: RevenueCategoryInput) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  const { error } = await supabase
    .from('revenue_categories')
    .insert({
      church_id: churchId,
      name: data.name,
      description: data.description || null,
      color: data.color,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/categorias')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getRevenueCategories() {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  // Garantir categorias padrão antes de buscar
  await ensureDefaultCategories(churchId)

  const { data, error } = await supabase
    .from('revenue_categories')
    .select('*')
    .eq('church_id', churchId)
    .order('name')

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function updateRevenueCategory(id: string, data: RevenueCategoryInput) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  const { error } = await supabase
    .from('revenue_categories')
    .update({
      name: data.name,
      description: data.description || null,
      color: data.color,
    })
    .eq('id', id)
    .eq('church_id', churchId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/categorias')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteRevenueCategory(id: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  const { error } = await supabase
    .from('revenue_categories')
    .delete()
    .eq('id', id)
    .eq('church_id', churchId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/categorias')
  revalidatePath('/dashboard')
  return { success: true }
}

// ============================================
// CATEGORIAS DE DESPESAS
// ============================================

export async function createExpenseCategory(data: ExpenseCategoryInput) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  const { error } = await supabase
    .from('expense_categories')
    .insert({
      church_id: churchId,
      name: data.name,
      description: data.description || null,
      color: data.color,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/categorias')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getExpenseCategories() {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('church_id', churchId)
    .order('name')

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function updateExpenseCategory(id: string, data: ExpenseCategoryInput) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  const { error } = await supabase
    .from('expense_categories')
    .update({
      name: data.name,
      description: data.description || null,
      color: data.color,
    })
    .eq('id', id)
    .eq('church_id', churchId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/categorias')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteExpenseCategory(id: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  const { error } = await supabase
    .from('expense_categories')
    .delete()
    .eq('id', id)
    .eq('church_id', churchId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/categorias')
  revalidatePath('/dashboard')
  return { success: true }
}

// ============================================
// ESTATÍSTICAS
// ============================================

export async function getFinancialStats(period?: { start: Date; end: Date }) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return {
      error: churchError || 'Erro ao obter igreja',
      balance: 0,
      periodRevenues: 0,
      periodExpenses: 0,
      totalRevenues: 0,
      totalExpenses: 0,
    }
  }

  const startDate = period?.start || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const endDate = period?.end || new Date()

  // Receitas do período
  const { data: revenues } = await supabase
    .from('revenues')
    .select('amount')
    .eq('church_id', churchId)
    .gte('transaction_date', startDate.toISOString().split('T')[0])
    .lte('transaction_date', endDate.toISOString().split('T')[0])

  // Despesas do período
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('church_id', churchId)
    .gte('transaction_date', startDate.toISOString().split('T')[0])
    .lte('transaction_date', endDate.toISOString().split('T')[0])

  // Total de receitas (todas)
  const { data: allRevenues } = await supabase
    .from('revenues')
    .select('amount')
    .eq('church_id', churchId)

  // Total de despesas (todas)
  const { data: allExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('church_id', churchId)

  const totalRevenues = allRevenues?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
  const totalExpenses = allExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const periodRevenues = revenues?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
  const periodExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

  return {
    error: null,
    balance: totalRevenues - totalExpenses,
    periodRevenues,
    periodExpenses,
    totalRevenues,
    totalExpenses,
  }
}
