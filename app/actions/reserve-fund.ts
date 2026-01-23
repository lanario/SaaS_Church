'use server'

import { createClient } from '@/lib/supabase/server'
import { getChurchId } from '@/lib/utils/get-church-id'
import { revalidatePath } from 'next/cache'

export interface ReserveFundData {
  id: string
  balance: number
  last_transfer_date: string | null
}

export interface ReserveFundTransaction {
  id: string
  transaction_type: 'deposit' | 'withdrawal' | 'auto_transfer'
  amount: number
  description: string | null
  created_by: string | null
  created_at: string
}

/**
 * Obter ou criar fundo de reserva da igreja
 */
export async function getReserveFund() {
  const supabase = await createClient()
  
  // Verificar autenticação
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Usuário não autenticado', data: null }
  }

  // Obter church_id
  const { churchId, error: churchError } = await getChurchId()
  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  // Buscar fundo de reserva existente
  const { data: existing, error: fetchError } = await supabase
    .from('reserve_fund')
    .select('*')
    .eq('church_id', churchId)
    .maybeSingle()

  // Se houver erro que não seja "não encontrado", retornar
  if (fetchError) {
    // PGRST116 = nenhuma linha encontrada (isso é OK)
    if (fetchError.code !== 'PGRST116') {
      console.error('Erro ao buscar fundo de reserva:', fetchError)
      return { 
        error: `Erro ao buscar fundo de reserva: ${fetchError.message}`, 
        data: null 
      }
    }
  }

  // Se existe, retornar
  if (existing) {
    return { data: existing, error: null }
  }

  // Se não existe, criar
  const { data: newFund, error: createError } = await supabase
    .from('reserve_fund')
    .insert({
      church_id: churchId,
      balance: 0,
    })
    .select()
    .single()

  if (createError) {
    console.error('Erro ao criar fundo de reserva:', createError)
    return { 
      error: `Erro ao criar fundo de reserva: ${createError.message}. Verifique as permissões RLS no banco de dados.`, 
      data: null 
    }
  }

  if (!newFund) {
    return { 
      error: 'Fundo de reserva criado mas não foi retornado. Tente recarregar a página.', 
      data: null 
    }
  }

  return { data: newFund, error: null }
}

/**
 * Obter saldo disponível (receitas - despesas)
 */
export async function getAvailableBalance() {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', balance: 0 }
  }

  const { data: revenues, error: revenueError } = await supabase
    .from('revenues')
    .select('amount')
    .eq('church_id', churchId)

  if (revenueError) {
    console.error('Erro ao buscar receitas:', revenueError)
    return { error: revenueError.message, balance: 0 }
  }

  const { data: expenses, error: expenseError } = await supabase
    .from('expenses')
    .select('amount')
    .eq('church_id', churchId)

  if (expenseError) {
    console.error('Erro ao buscar despesas:', expenseError)
    return { error: expenseError.message, balance: 0 }
  }

  const totalRevenues = revenues?.reduce((sum, r) => sum + Number(r.amount || 0), 0) || 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0
  const balance = totalRevenues - totalExpenses

  return { error: null, balance }
}

/**
 * Obter histórico de transações do fundo de reserva
 */
export async function getReserveFundTransactions(limit: number = 50) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  // Obter fundo de reserva primeiro
  const reserveFundResult = await getReserveFund()
  if (reserveFundResult.error || !reserveFundResult.data) {
    return { 
      error: reserveFundResult.error || 'Erro ao obter fundo de reserva', 
      data: null 
    }
  }

  // Buscar transações
  const { data, error } = await supabase
    .from('reserve_fund_transactions')
    .select('*')
    .eq('reserve_fund_id', reserveFundResult.data.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Erro ao buscar transações:', error)
    return { error: error.message, data: null }
  }

  return { data: data || [], error: null }
}

/**
 * Depositar dinheiro no fundo de reserva
 * Retira dinheiro do saldo disponível (cria uma despesa)
 */
export async function depositToReserveFund(amount: number, description?: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  if (amount <= 0) {
    return { error: 'Valor deve ser maior que zero' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  // Verificar saldo disponível
  const { balance: availableBalance, error: balanceError } = await getAvailableBalance()
  if (balanceError) {
    return { error: `Erro ao verificar saldo: ${balanceError}` }
  }

  if (amount > availableBalance) {
    return { error: `Saldo disponível insuficiente. Saldo atual: R$ ${availableBalance.toFixed(2)}` }
  }

  // Obter ou criar fundo de reserva
  const reserveFundResult = await getReserveFund()
  if (reserveFundResult.error || !reserveFundResult.data) {
    return { error: reserveFundResult.error || 'Erro ao obter fundo de reserva' }
  }

  const reserveFund = reserveFundResult.data

  // Buscar ou criar categoria "Fundo de Reserva" para despesas
  let expenseCategoryId: string | null = null
  
  const { data: existingCategory, error: categoryFetchError } = await supabase
    .from('expense_categories')
    .select('id')
    .eq('church_id', churchId)
    .eq('name', 'Fundo de Reserva')
    .maybeSingle()

  if (categoryFetchError && categoryFetchError.code !== 'PGRST116') {
    return { error: `Erro ao buscar categoria: ${categoryFetchError.message}` }
  }

  if (existingCategory) {
    expenseCategoryId = existingCategory.id
  } else {
    const { data: newCategory, error: categoryError } = await supabase
      .from('expense_categories')
      .insert({
        church_id: churchId,
        name: 'Fundo de Reserva',
        description: 'Transferências para o fundo de reserva',
      })
      .select('id')
      .single()

    if (categoryError) {
      return { error: `Erro ao criar categoria: ${categoryError.message}` }
    }
    
    if (!newCategory) {
      return { error: 'Categoria criada mas não retornada' }
    }
    
    expenseCategoryId = newCategory.id
  }

  // Criar despesa (retira do saldo disponível)
  const today = new Date().toISOString().split('T')[0]
  const { error: expenseError } = await supabase
    .from('expenses')
    .insert({
      church_id: churchId,
      category_id: expenseCategoryId,
      amount,
      description: description ? `Depósito no fundo de reserva: ${description}` : 'Depósito no fundo de reserva',
      payment_method: 'cash',
      transaction_date: today,
      created_by: user.id,
    })

  if (expenseError) {
    console.error('Erro ao criar despesa:', expenseError)
    return { error: `Erro ao criar despesa: ${expenseError.message}` }
  }

  // Criar transação do fundo de reserva
  const { error: transactionError } = await supabase
    .from('reserve_fund_transactions')
    .insert({
      reserve_fund_id: reserveFund.id,
      church_id: churchId,
      transaction_type: 'deposit',
      amount,
      description: description || 'Depósito manual',
      created_by: user.id,
    })

  if (transactionError) {
    console.error('Erro ao criar transação:', transactionError)
    return { error: `Erro ao criar transação: ${transactionError.message}` }
  }

  // Atualizar saldo do fundo de reserva
  const newBalance = Number(reserveFund.balance) + amount
  const { error: updateError } = await supabase
    .from('reserve_fund')
    .update({ balance: newBalance })
    .eq('id', reserveFund.id)

  if (updateError) {
    console.error('Erro ao atualizar saldo:', updateError)
    return { error: `Erro ao atualizar saldo: ${updateError.message}` }
  }

  revalidatePath('/fundo-reserva')
  revalidatePath('/dashboard')
  revalidatePath('/despesas')
  return { success: true }
}

/**
 * Retirar dinheiro do fundo de reserva
 * Adiciona dinheiro ao saldo disponível (cria uma receita)
 */
export async function withdrawFromReserveFund(amount: number, description?: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  if (amount <= 0) {
    return { error: 'Valor deve ser maior que zero' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  // Obter fundo de reserva
  const reserveFundResult = await getReserveFund()
  if (reserveFundResult.error || !reserveFundResult.data) {
    return { error: reserveFundResult.error || 'Erro ao obter fundo de reserva' }
  }

  const reserveFund = reserveFundResult.data

  // Verificar saldo suficiente
  if (Number(reserveFund.balance) < amount) {
    return { error: 'Saldo insuficiente no fundo de reserva' }
  }

  // Buscar ou criar categoria "Fundo de Reserva" para receitas
  let revenueCategoryId: string | null = null
  
  const { data: existingCategory, error: categoryFetchError } = await supabase
    .from('revenue_categories')
    .select('id')
    .eq('church_id', churchId)
    .eq('name', 'Fundo de Reserva')
    .maybeSingle()

  if (categoryFetchError && categoryFetchError.code !== 'PGRST116') {
    return { error: `Erro ao buscar categoria: ${categoryFetchError.message}` }
  }

  if (existingCategory) {
    revenueCategoryId = existingCategory.id
  } else {
    const { data: newCategory, error: categoryError } = await supabase
      .from('revenue_categories')
      .insert({
        church_id: churchId,
        name: 'Fundo de Reserva',
        description: 'Retiradas do fundo de reserva',
      })
      .select('id')
      .single()

    if (categoryError) {
      return { error: `Erro ao criar categoria: ${categoryError.message}` }
    }
    
    if (!newCategory) {
      return { error: 'Categoria criada mas não retornada' }
    }
    
    revenueCategoryId = newCategory.id
  }

  // Criar receita (adiciona ao saldo disponível)
  const today = new Date().toISOString().split('T')[0]
  const { error: revenueError } = await supabase
    .from('revenues')
    .insert({
      church_id: churchId,
      category_id: revenueCategoryId,
      amount,
      description: description ? `Retirada do fundo de reserva: ${description}` : 'Retirada do fundo de reserva',
      payment_method: 'cash',
      transaction_date: today,
      created_by: user.id,
    })

  if (revenueError) {
    console.error('Erro ao criar receita:', revenueError)
    return { error: `Erro ao criar receita: ${revenueError.message}` }
  }

  // Criar transação do fundo de reserva
  const { error: transactionError } = await supabase
    .from('reserve_fund_transactions')
    .insert({
      reserve_fund_id: reserveFund.id,
      church_id: churchId,
      transaction_type: 'withdrawal',
      amount,
      description: description || 'Retirada manual',
      created_by: user.id,
    })

  if (transactionError) {
    console.error('Erro ao criar transação:', transactionError)
    return { error: `Erro ao criar transação: ${transactionError.message}` }
  }

  // Atualizar saldo do fundo de reserva
  const newBalance = Number(reserveFund.balance) - amount
  const { error: updateError } = await supabase
    .from('reserve_fund')
    .update({ balance: newBalance })
    .eq('id', reserveFund.id)

  if (updateError) {
    console.error('Erro ao atualizar saldo:', updateError)
    return { error: `Erro ao atualizar saldo: ${updateError.message}` }
  }

  revalidatePath('/fundo-reserva')
  revalidatePath('/dashboard')
  revalidatePath('/receitas')
  return { success: true }
}

/**
 * Transferir automaticamente o saldo em caixa para o fundo de reserva
 * Esta função deve ser chamada todo dia 01 de cada mês
 */
export async function autoTransferToReserveFund() {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  // Obter fundo de reserva
  const reserveFundResult = await getReserveFund()
  if (reserveFundResult.error || !reserveFundResult.data) {
    return { error: reserveFundResult.error || 'Erro ao obter fundo de reserva' }
  }

  const reserveFund = reserveFundResult.data

  // Verificar se já foi transferido este mês
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  if (reserveFund.last_transfer_date) {
    const lastTransferDate = new Date(reserveFund.last_transfer_date)
    if (lastTransferDate >= firstDayOfMonth) {
      return { error: 'Transferência automática já realizada este mês', success: false }
    }
  }

  // Calcular saldo em caixa (receitas - despesas)
  const { balance: cashBalance, error: balanceError } = await getAvailableBalance()
  if (balanceError) {
    return { error: `Erro ao calcular saldo: ${balanceError}`, success: false }
  }

  if (cashBalance <= 0) {
    return { error: 'Não há saldo em caixa para transferir', success: false }
  }

  // Criar transação de transferência automática
  const { error: transactionError } = await supabase
    .from('reserve_fund_transactions')
    .insert({
      reserve_fund_id: reserveFund.id,
      church_id: churchId,
      transaction_type: 'auto_transfer',
      amount: cashBalance,
      description: `Transferência automática de ${formatDate(today)}`,
      created_by: user.id,
    })

  if (transactionError) {
    console.error('Erro ao criar transação:', transactionError)
    return { error: transactionError.message, success: false }
  }

  // Atualizar saldo e data da última transferência
  const newBalance = Number(reserveFund.balance) + cashBalance
  const { error: updateError } = await supabase
    .from('reserve_fund')
    .update({
      balance: newBalance,
      last_transfer_date: today.toISOString().split('T')[0],
    })
    .eq('id', reserveFund.id)

  if (updateError) {
    console.error('Erro ao atualizar saldo:', updateError)
    return { error: updateError.message, success: false }
  }

  revalidatePath('/fundo-reserva')
  revalidatePath('/dashboard')
  return { success: true, amount: cashBalance }
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}
