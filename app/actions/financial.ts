'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/utils/get-church-id'
import { filterReserveFundRevenues, filterReserveFundExpenses } from '@/lib/utils/filter-reserve-fund'
import { logAction } from '@/lib/utils/logger'
import type { RevenueInput, ExpenseInput, RevenueCategoryInput, ExpenseCategoryInput } from '@/lib/validations/financial'

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Formata uma data para o formato YYYY-MM-DD sem problemas de timezone
 * Se receber uma string YYYY-MM-DD, retorna ela mesma
 * Se receber um Date, usa métodos UTC para evitar problemas de timezone
 */
function formatDateToISO(date: Date | string): string {
  // Se já é uma string no formato YYYY-MM-DD, retornar diretamente
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return date
  }
  
  // Se é string mas não está no formato correto, tentar parsear
  if (typeof date === 'string') {
    const parsed = new Date(date)
    // Usar UTC para evitar problemas de timezone
    const year = parsed.getUTCFullYear()
    const month = String(parsed.getUTCMonth() + 1).padStart(2, '0')
    const day = String(parsed.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // Se é Date, usar UTC
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Adiciona 1 dia a uma data no formato YYYY-MM-DD
 * Trabalha apenas com strings para evitar problemas de timezone
 */
function addOneDay(dateStr: string): string {
  if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr // Retornar como está se não estiver no formato correto
  }
  
  const [year, month, day] = dateStr.split('-').map(Number)
  
  // Array com dias em cada mês
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  
  // Verificar se é ano bissexto
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
  if (isLeapYear) {
    daysInMonth[1] = 29 // Fevereiro tem 29 dias em ano bissexto
  }
  
  let newDay = day + 1
  let newMonth = month
  let newYear = year
  
  // Se o dia excede os dias do mês, avançar para o próximo mês
  if (newDay > daysInMonth[month - 1]) {
    newDay = 1
    newMonth = month + 1
    
    // Se o mês excede 12, avançar para o próximo ano
    if (newMonth > 12) {
      newMonth = 1
      newYear = year + 1
    }
  }
  
  // Formatar de volta para YYYY-MM-DD
  return `${newYear}-${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`
}

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

  // Processar transactionDate - garantir que está no formato YYYY-MM-DD
  // NUNCA converter para Date para evitar problemas de timezone
  let transactionDateStr: string
  if (typeof data.transactionDate === 'string') {
    // Se já está no formato YYYY-MM-DD, usar diretamente (SEM CONVERSÃO)
    if (data.transactionDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      transactionDateStr = data.transactionDate
    } else if (data.transactionDate.includes('T')) {
      // Se tem T (ISO format), extrair apenas a parte da data
      transactionDateStr = data.transactionDate.split('T')[0]
    } else {
      // Se está em outro formato, tentar extrair diretamente da string
      // NUNCA usar new Date() aqui para evitar timezone
      return { error: 'Formato de data inválido. Use o formato DD/MM/YYYY no campo de data.' }
    }
  } else {
    // Se é Date object, converter usando UTC (caso raro)
    transactionDateStr = formatDateToISO(data.transactionDate)
  }

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
        // Extrair dia, mês e ano diretamente da string YYYY-MM-DD
        const [year, month, day] = transactionDateStr.split('-')
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

  // Adicionar 1 dia para compensar problema de timezone
  const adjustedDateStr = addOneDay(transactionDateStr)

  // Usar função RPC para garantir que a data seja salva exatamente como string
  const { data: rpcData, error: rpcError } = await supabase.rpc('insert_revenue_safe_date', {
    p_church_id: churchId,
    p_category_id: data.categoryId || null,
    p_member_id: memberId,
    p_amount: data.amount,
    p_description: description,
    p_payment_method: paymentMethod,
    p_transaction_date: adjustedDateStr, // String YYYY-MM-DD com 1 dia adicionado
    p_created_by: user?.id,
  })
  
  // Se RPC não existir, usar insert normal
  if (rpcError) {
    if (rpcError.code === '42883' || rpcError.message?.includes('does not exist')) {
      const insertData = {
        church_id: churchId,
        category_id: data.categoryId || null,
        member_id: memberId,
        amount: data.amount,
        description: description,
        payment_method: paymentMethod,
        transaction_date: adjustedDateStr, // Usar data com 1 dia adicionado
        created_by: user?.id,
      }
      
      const { error: insertError } = await supabase
        .from('revenues')
        .insert(insertData)
      
      if (insertError) {
        return { error: insertError.message }
      }
    } else {
      return { error: rpcError.message }
    }
  }

  // Registrar log da ação
  if (user && churchId) {
    // Buscar informações da receita criada para o log
    const revenueId = rpcData
    if (revenueId) {
      const { data: createdRevenue } = await supabase
        .from('revenues')
        .select('amount, description, revenue_categories(name)')
        .eq('id', revenueId)
        .single()
      
      if (createdRevenue) {
        const categoryName = (createdRevenue.revenue_categories as any)?.name || 'Sem categoria'
        await logAction(supabase, churchId, user.id, {
          actionType: 'create',
          entityType: 'revenue',
          entityId: revenueId,
          description: `Receita de R$ ${Number(createdRevenue.amount).toFixed(2).replace('.', ',')} criada${createdRevenue.description ? `: "${createdRevenue.description}"` : ''} (${categoryName})`,
          metadata: { 
            amount: createdRevenue.amount,
            description: createdRevenue.description,
            category: categoryName,
          },
        })
      }
    } else {
      // Se não tem ID do RPC, buscar a última receita criada
      const { data: lastRevenue } = await supabase
        .from('revenues')
        .select('id, amount, description, revenue_categories(name)')
        .eq('church_id', churchId)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (lastRevenue) {
        const categoryName = (lastRevenue.revenue_categories as any)?.name || 'Sem categoria'
        await logAction(supabase, churchId, user.id, {
          actionType: 'create',
          entityType: 'revenue',
          entityId: lastRevenue.id,
          description: `Receita de R$ ${Number(lastRevenue.amount).toFixed(2).replace('.', ',')} criada${lastRevenue.description ? `: "${lastRevenue.description}"` : ''} (${categoryName})`,
          metadata: { 
            amount: lastRevenue.amount,
            description: lastRevenue.description,
            category: categoryName,
          },
        })
      }
    }
  }

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
    const startDate = formatDateToISO(period.start)
    const endDate = formatDateToISO(period.end)
    query = query
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function getRevenue(id: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  const { data, error } = await supabase
    .from('revenues')
    .select(`
      *,
      revenue_categories(name, color)
    `)
    .eq('id', id)
    .eq('church_id', churchId)
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function updateRevenue(id: string, data: RevenueInput) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  // Verificar se a receita pertence ao fundo de reserva
  const { data: revenue, error: fetchError } = await supabase
    .from('revenues')
    .select('category_id, description, revenue_categories(name)')
    .eq('id', id)
    .eq('church_id', churchId)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!revenue) {
    return { error: 'Receita não encontrada' }
  }

  // Verificar se é do fundo de reserva pela categoria ou descrição
  const revenueCategories = revenue.revenue_categories as any
  const categoryName = Array.isArray(revenueCategories)
    ? revenueCategories[0]?.name
    : revenueCategories?.name
  const isReserveFund = 
    categoryName?.toLowerCase() === 'fundo de reserva' ||
    revenue.description?.toLowerCase().includes('fundo de reserva') ||
    revenue.description?.toLowerCase().includes('retirada do fundo')

  if (isReserveFund) {
    return { error: 'Não é possível editar transações relacionadas ao fundo de reserva.' }
  }

  // Processar transactionDate - garantir que está no formato YYYY-MM-DD
  // NUNCA converter para Date para evitar problemas de timezone
  let transactionDateStr: string
  if (typeof data.transactionDate === 'string') {
    // Se já está no formato YYYY-MM-DD, usar diretamente (SEM CONVERSÃO)
    if (data.transactionDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      transactionDateStr = data.transactionDate
    } else if (data.transactionDate.includes('T')) {
      // Se tem T (ISO format), extrair apenas a parte da data
      transactionDateStr = data.transactionDate.split('T')[0]
    } else {
      // Se está em outro formato, retornar erro
      return { error: 'Formato de data inválido. Use o formato DD/MM/YYYY no campo de data.' }
    }
  } else {
    // Se é Date object, converter usando UTC (caso raro)
    transactionDateStr = formatDateToISO(data.transactionDate)
  }
  
  // Validar que a data está no formato correto antes de salvar
  if (!transactionDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return { error: 'Formato de data inválido' }
  }

  // Adicionar 1 dia para compensar problema de timezone
  const adjustedDateStr = addOneDay(transactionDateStr)

  // Usar função RPC para garantir que a data seja salva exatamente como string
  const { error: rpcError } = await supabase.rpc('update_revenue_safe_date', {
    p_revenue_id: id,
    p_church_id: churchId,
    p_category_id: data.categoryId || null,
    p_member_id: data.memberId || null,
    p_amount: data.amount,
    p_description: data.description || null,
    p_payment_method: data.paymentMethod,
    p_transaction_date: adjustedDateStr, // String YYYY-MM-DD com 1 dia adicionado
  })
  
  // Se RPC não existir, usar update normal
  if (rpcError) {
    if (rpcError.code === '42883' || rpcError.message?.includes('does not exist')) {
      const updateData: Record<string, any> = {
        amount: data.amount,
        description: data.description || null,
        payment_method: data.paymentMethod,
        transaction_date: adjustedDateStr, // Usar data com 1 dia adicionado
        updated_at: new Date().toISOString(),
      }
      
      if (data.categoryId) {
        updateData.category_id = data.categoryId
      } else {
        updateData.category_id = null
      }
      
      if (data.memberId) {
        updateData.member_id = data.memberId
      } else {
        updateData.member_id = null
      }
      
      const { error: updateError } = await supabase
        .from('revenues')
        .update(updateData)
        .eq('id', id)
        .eq('church_id', churchId)
      
      if (updateError) {
        return { error: updateError.message }
      }
    } else {
      return { error: rpcError.message }
    }
  }

  // Registrar log da ação
  const { data: { user } } = await supabase.auth.getUser()
  if (user && churchId) {
    // Buscar informações da receita atualizada para o log
    const { data: updatedRevenue } = await supabase
      .from('revenues')
      .select('amount, description, revenue_categories(name)')
      .eq('id', id)
      .single()
    
    if (updatedRevenue) {
      const categoryName = (updatedRevenue.revenue_categories as any)?.name || 'Sem categoria'
      await logAction(supabase, churchId, user.id, {
        actionType: 'update',
        entityType: 'revenue',
        entityId: id,
        description: `Receita de R$ ${Number(updatedRevenue.amount).toFixed(2).replace('.', ',')} atualizada${updatedRevenue.description ? `: "${updatedRevenue.description}"` : ''} (${categoryName})`,
        metadata: { 
          amount: updatedRevenue.amount,
          description: updatedRevenue.description,
          category: categoryName,
        },
      })
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/receitas')
  return { success: true }
}

export async function deleteRevenue(id: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  // Verificar se a receita pertence ao fundo de reserva
  const { data: revenue, error: fetchError } = await supabase
    .from('revenues')
    .select('category_id, description, revenue_categories(name)')
    .eq('id', id)
    .eq('church_id', churchId)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!revenue) {
    return { error: 'Receita não encontrada' }
  }

  // Verificar se é do fundo de reserva pela categoria ou descrição
  const revenueCategories = revenue.revenue_categories as any
  const categoryName = Array.isArray(revenueCategories)
    ? revenueCategories[0]?.name
    : revenueCategories?.name
  const isReserveFund = 
    categoryName?.toLowerCase() === 'fundo de reserva' ||
    revenue.description?.toLowerCase().includes('fundo de reserva') ||
    revenue.description?.toLowerCase().includes('retirada do fundo')

  if (isReserveFund) {
    return { error: 'Não é possível excluir transações relacionadas ao fundo de reserva. Use a função de retirada no fundo de reserva.' }
  }

  // Buscar informações da receita antes de deletar para o log
  const { data: revenueToDelete } = await supabase
    .from('revenues')
    .select('amount, description, revenue_categories(name)')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('revenues')
    .delete()
    .eq('id', id)
    .eq('church_id', churchId)

  if (error) {
    return { error: error.message }
  }

  // Registrar log da ação
  const { data: { user } } = await supabase.auth.getUser()
  if (user && churchId && revenueToDelete) {
    const categoryName = (revenueToDelete.revenue_categories as any)?.name || 'Sem categoria'
    await logAction(supabase, churchId, user.id, {
      actionType: 'delete',
      entityType: 'revenue',
      entityId: id,
      description: `Receita de R$ ${Number(revenueToDelete.amount).toFixed(2).replace('.', ',')} deletada${revenueToDelete.description ? `: "${revenueToDelete.description}"` : ''} (${categoryName})`,
      metadata: { 
        amount: revenueToDelete.amount,
        description: revenueToDelete.description,
        category: categoryName,
      },
    })
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

  // Processar transactionDate - garantir que está no formato YYYY-MM-DD
  // NUNCA converter para Date para evitar problemas de timezone
  let transactionDateStr: string
  if (typeof data.transactionDate === 'string') {
    // Se já está no formato YYYY-MM-DD, usar diretamente (SEM CONVERSÃO)
    if (data.transactionDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      transactionDateStr = data.transactionDate
    } else if (data.transactionDate.includes('T')) {
      // Se tem T (ISO format), extrair apenas a parte da data
      transactionDateStr = data.transactionDate.split('T')[0]
    } else {
      // Se está em outro formato, tentar extrair diretamente da string
      // NUNCA usar new Date() aqui para evitar timezone
      return { error: 'Formato de data inválido. Use o formato DD/MM/YYYY no campo de data.' }
    }
  } else {
    // Se é Date object, converter usando UTC (caso raro)
    transactionDateStr = formatDateToISO(data.transactionDate)
  }

  // Validar que a data está no formato correto
  if (!transactionDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return { error: 'Formato de data inválido' }
  }

  // Adicionar 1 dia para compensar problema de timezone
  const adjustedDateStr = addOneDay(transactionDateStr)

  // Usar função RPC para garantir que a data seja salva exatamente como string
  // A função SQL faz CAST direto sem interpretação de timezone
  const { data: rpcData, error: rpcError } = await supabase.rpc('insert_expense_safe_date', {
    p_church_id: churchId,
    p_category_id: data.categoryId || null,
    p_amount: data.amount,
    p_description: data.description || null,
    p_payment_method: data.paymentMethod,
    p_transaction_date: adjustedDateStr, // String YYYY-MM-DD com 1 dia adicionado
    p_receipt_url: data.receiptUrl || null,
    p_created_by: user?.id,
  })
  
  // Se RPC não existir, criar a função e tentar novamente, ou usar insert normal
  if (rpcError) {
    if (rpcError.code === '42883' || rpcError.message?.includes('does not exist')) {
      // RPC não existe, usar insert normal (mas isso pode ter problemas de timezone)
      // O ideal é executar o SQL fix_date_timezone.sql no Supabase
      const { error: insertError } = await supabase
        .from('expenses')
        .insert({
          church_id: churchId,
          category_id: data.categoryId || null,
          amount: data.amount,
          description: data.description || null,
          payment_method: data.paymentMethod,
          transaction_date: adjustedDateStr, // Usar data com 1 dia adicionado
          receipt_url: data.receiptUrl || null,
          created_by: user?.id,
        })
      
      if (insertError) {
        return { error: insertError.message }
      }
    } else {
      return { error: rpcError.message }
    }
  }

  // Registrar log da ação
  if (user && churchId) {
    // Buscar informações da despesa criada para o log
    const expenseId = rpcData
    if (expenseId) {
      const { data: createdExpense } = await supabase
        .from('expenses')
        .select('amount, description, expense_categories(name)')
        .eq('id', expenseId)
        .single()
      
      if (createdExpense) {
        const categoryName = (createdExpense.expense_categories as any)?.name || 'Sem categoria'
        await logAction(supabase, churchId, user.id, {
          actionType: 'create',
          entityType: 'expense',
          entityId: expenseId,
          description: `Despesa de R$ ${Number(createdExpense.amount).toFixed(2).replace('.', ',')} criada${createdExpense.description ? `: "${createdExpense.description}"` : ''} (${categoryName})`,
          metadata: { 
            amount: createdExpense.amount,
            description: createdExpense.description,
            category: categoryName,
          },
        })
      }
    } else {
      // Se não tem ID do RPC, buscar a última despesa criada
      const { data: lastExpense } = await supabase
        .from('expenses')
        .select('id, amount, description, expense_categories(name)')
        .eq('church_id', churchId)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (lastExpense) {
        const categoryName = (lastExpense.expense_categories as any)?.name || 'Sem categoria'
        await logAction(supabase, churchId, user.id, {
          actionType: 'create',
          entityType: 'expense',
          entityId: lastExpense.id,
          description: `Despesa de R$ ${Number(lastExpense.amount).toFixed(2).replace('.', ',')} criada${lastExpense.description ? `: "${lastExpense.description}"` : ''} (${categoryName})`,
          metadata: { 
            amount: lastExpense.amount,
            description: lastExpense.description,
            category: categoryName,
          },
        })
      }
    }
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
    const startDate = formatDateToISO(period.start)
    const endDate = formatDateToISO(period.end)
    query = query
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function getExpense(id: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      expense_categories(name, color)
    `)
    .eq('id', id)
    .eq('church_id', churchId)
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function updateExpense(id: string, data: ExpenseInput) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  // Verificar se a despesa existe e pertence à igreja
  const { data: expense, error: fetchError } = await supabase
    .from('expenses')
    .select('category_id, description, expense_categories(name)')
    .eq('id', id)
    .eq('church_id', churchId)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!expense) {
    return { error: 'Despesa não encontrada' }
  }

  // Verificar se é do fundo de reserva pela categoria ou descrição
  const expenseCategories = expense.expense_categories as any
  const categoryName = Array.isArray(expenseCategories)
    ? expenseCategories[0]?.name
    : expenseCategories?.name
  const isReserveFund = 
    categoryName?.toLowerCase() === 'fundo de reserva' ||
    expense.description?.toLowerCase().includes('fundo de reserva') ||
    expense.description?.toLowerCase().includes('depósito no fundo')

  if (isReserveFund) {
    return { error: 'Não é possível editar transações relacionadas ao fundo de reserva. Use a função de retirada no fundo de reserva.' }
  }

  // Processar transactionDate - garantir que está no formato YYYY-MM-DD
  // NUNCA converter para Date para evitar problemas de timezone
  let transactionDateStr: string
  if (typeof data.transactionDate === 'string') {
    // Se já está no formato YYYY-MM-DD, usar diretamente (SEM CONVERSÃO)
    if (data.transactionDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      transactionDateStr = data.transactionDate
    } else if (data.transactionDate.includes('T')) {
      // Se tem T (ISO format), extrair apenas a parte da data
      transactionDateStr = data.transactionDate.split('T')[0]
    } else {
      // Se está em outro formato, tentar extrair diretamente da string
      // NUNCA usar new Date() aqui para evitar timezone
      return { error: 'Formato de data inválido. Use o formato DD/MM/YYYY no campo de data.' }
    }
  } else {
    // Se é Date object, converter usando UTC (caso raro)
    transactionDateStr = formatDateToISO(data.transactionDate)
  }

  // Validar que a data está no formato correto
  if (!transactionDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return { error: 'Formato de data inválido' }
  }

  // Adicionar 1 dia para compensar problema de timezone
  const adjustedDateStr = addOneDay(transactionDateStr)

  // Usar função RPC para garantir que a data seja salva exatamente como string
  const { error: rpcError } = await supabase.rpc('update_expense_safe_date', {
    p_expense_id: id,
    p_church_id: churchId,
    p_category_id: data.categoryId || null,
    p_amount: data.amount,
    p_description: data.description || null,
    p_payment_method: data.paymentMethod,
    p_transaction_date: adjustedDateStr, // String YYYY-MM-DD com 1 dia adicionado
    p_receipt_url: data.receiptUrl || null,
  })
  
  let updateError = rpcError
  
  // Se RPC não existir, usar update normal
  if (rpcError && (rpcError.code === '42883' || rpcError.message?.includes('does not exist'))) {
    const result = await supabase
      .from('expenses')
      .update({
        category_id: data.categoryId || null,
        amount: data.amount,
        description: data.description || null,
        payment_method: data.paymentMethod,
        transaction_date: adjustedDateStr, // Usar data com 1 dia adicionado
        receipt_url: data.receiptUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('church_id', churchId)
    
    updateError = result.error
  }

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/despesas')
  return { success: true }
}

export async function deleteExpense(id: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()
  
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  // Verificar se a despesa pertence ao fundo de reserva
  const { data: expense, error: fetchError } = await supabase
    .from('expenses')
    .select('category_id, description, expense_categories(name)')
    .eq('id', id)
    .eq('church_id', churchId)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!expense) {
    return { error: 'Despesa não encontrada' }
  }

  // Verificar se é do fundo de reserva pela categoria ou descrição
  const expenseCategories = expense.expense_categories as any
  const categoryName = Array.isArray(expenseCategories)
    ? expenseCategories[0]?.name
    : expenseCategories?.name
  const isReserveFund = 
    categoryName?.toLowerCase() === 'fundo de reserva' ||
    expense.description?.toLowerCase().includes('fundo de reserva') ||
    expense.description?.toLowerCase().includes('depósito no fundo')

  if (isReserveFund) {
    return { error: 'Não é possível excluir transações relacionadas ao fundo de reserva. Use a função de retirada no fundo de reserva.' }
  }

  // Buscar informações da despesa antes de deletar para o log
  const { data: expenseToDelete } = await supabase
    .from('expenses')
    .select('amount, description, expense_categories(name)')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('church_id', churchId)

  if (error) {
    return { error: error.message }
  }

  // Registrar log da ação
  const { data: { user } } = await supabase.auth.getUser()
  if (user && churchId && expenseToDelete) {
    const categoryName = (expenseToDelete.expense_categories as any)?.name || 'Sem categoria'
    await logAction(supabase, churchId, user.id, {
      actionType: 'delete',
      entityType: 'expense',
      entityId: id,
      description: `Despesa de R$ ${Number(expenseToDelete.amount).toFixed(2).replace('.', ',')} deletada${expenseToDelete.description ? `: "${expenseToDelete.description}"` : ''} (${categoryName})`,
      metadata: { 
        amount: expenseToDelete.amount,
        description: expenseToDelete.description,
        category: categoryName,
      },
    })
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

export async function getFinancialStats(period?: { start: Date; end: Date }, selectedMonth?: Date) {
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
      previousMonthBalance: 0,
      resultBalance: 0,
    }
  }

  // Se selectedMonth for fornecido, usar ele; senão usar período atual
  const monthDate = selectedMonth || new Date()
  const startDate = period?.start || new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const endDate = period?.end || new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)



  // Receitas do período selecionado
  const { data: revenues } = await supabase
    .from('revenues')
    .select('amount, revenue_categories(name), description')
    .eq('church_id', churchId)
    .gte('transaction_date', formatDateToISO(startDate))
    .lte('transaction_date', formatDateToISO(endDate))

  // Despesas do período selecionado
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, expense_categories(name), description')
    .eq('church_id', churchId)
    .gte('transaction_date', formatDateToISO(startDate))
    .lte('transaction_date', formatDateToISO(endDate))

  // Total de receitas (todas até o final do mês selecionado)
  const { data: allRevenues } = await supabase
    .from('revenues')
    .select('amount, revenue_categories(name), description')
    .eq('church_id', churchId)
    .lte('transaction_date', formatDateToISO(endDate))

  // Total de despesas (todas até o final do mês selecionado)
  const { data: allExpenses } = await supabase
    .from('expenses')
    .select('amount, expense_categories(name), description')
    .eq('church_id', churchId)
    .lte('transaction_date', formatDateToISO(endDate))

  // Filtrar fundo de reserva
  const filteredRevenues = filterReserveFundRevenues((revenues || []) as any[])
  const filteredExpenses = filterReserveFundExpenses((expenses || []) as any[])
  const filteredAllRevenues = filterReserveFundRevenues((allRevenues || []) as any[])
  const filteredAllExpenses = filterReserveFundExpenses((allExpenses || []) as any[])

  // Calcular totais
  const totalRevenues = filteredAllRevenues.reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const totalExpenses = filteredAllExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const periodRevenues = filteredRevenues.reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const periodExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  
  // Calcular saldo acumulado até o final do mês anterior
  const previousMonthEndDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 0)
  const { data: allRevenuesUntilPrevious } = await supabase
    .from('revenues')
    .select('amount, revenue_categories(name), description')
    .eq('church_id', churchId)
    .lte('transaction_date', formatDateToISO(previousMonthEndDate))

  const { data: allExpensesUntilPrevious } = await supabase
    .from('expenses')
    .select('amount, expense_categories(name), description')
    .eq('church_id', churchId)
    .lte('transaction_date', formatDateToISO(previousMonthEndDate))

  const filteredAllRevenuesUntilPrevious = filterReserveFundRevenues((allRevenuesUntilPrevious || []) as any[])
  const filteredAllExpensesUntilPrevious = filterReserveFundExpenses((allExpensesUntilPrevious || []) as any[])
  
  const totalRevenuesUntilPrevious = filteredAllRevenuesUntilPrevious.reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const totalExpensesUntilPrevious = filteredAllExpensesUntilPrevious.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const previousMonthBalance = totalRevenuesUntilPrevious - totalExpensesUntilPrevious

  // Saldo em caixa = saldo do mês anterior + receitas do mês - despesas do mês
  const balance = previousMonthBalance + periodRevenues - periodExpenses
  
  // Saldo resultante = apenas receitas - despesas do mês específico
  const resultBalance = periodRevenues - periodExpenses

  return {
    error: null,
    balance, // Saldo em caixa (saldo anterior + resultado do mês)
    periodRevenues,
    periodExpenses,
    totalRevenues,
    totalExpenses,
    previousMonthBalance, // Saldo do mês anterior
    resultBalance, // Saldo resultante do mês (entrada - saída)
  }
}
