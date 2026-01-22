'use server'

import { createClient } from '@/lib/supabase/server'
import { getChurchId } from '@/lib/utils/get-church-id'
import { revalidatePath } from 'next/cache'

export interface ReserveFundData {
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
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  // Verificar se já existe
  const { data: existing, error: fetchError } = await supabase
    .from('reserve_fund')
    .select('*')
    .eq('church_id', churchId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    return { error: fetchError.message, data: null }
  }

  // Se não existe, criar
  if (!existing) {
    const { data: newFund, error: createError } = await supabase
      .from('reserve_fund')
      .insert({
        church_id: churchId,
        balance: 0,
      })
      .select()
      .single()

    if (createError) {
      return { error: createError.message, data: null }
    }

    return { data: newFund, error: null }
  }

  return { data: existing, error: null }
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

  const { data: reserveFund } = await getReserveFund()
  if (reserveFund?.error || !reserveFund?.data) {
    return { error: 'Erro ao obter fundo de reserva', data: null }
  }

  const { data, error } = await supabase
    .from('reserve_fund_transactions')
    .select('*')
    .eq('reserve_fund_id', reserveFund.data.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { error: error.message, data: null }
  }

  return { data: data || [], error: null }
}

/**
 * Depositar dinheiro no fundo de reserva
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

  // Obter ou criar fundo de reserva
  const { data: reserveFund, error: fundError } = await getReserveFund()
  if (fundError || !reserveFund?.data) {
    return { error: 'Erro ao obter fundo de reserva' }
  }

  // Criar transação
  const { error: transactionError } = await supabase
    .from('reserve_fund_transactions')
    .insert({
      reserve_fund_id: reserveFund.data.id,
      church_id: churchId,
      transaction_type: 'deposit',
      amount,
      description: description || 'Depósito manual',
      created_by: user?.id,
    })

  if (transactionError) {
    return { error: transactionError.message }
  }

  // Atualizar saldo
  const newBalance = Number(reserveFund.data.balance) + amount
  const { error: updateError } = await supabase
    .from('reserve_fund')
    .update({ balance: newBalance })
    .eq('id', reserveFund.data.id)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/fundo-reserva')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Retirar dinheiro do fundo de reserva
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

  // Obter fundo de reserva
  const { data: reserveFund, error: fundError } = await getReserveFund()
  if (fundError || !reserveFund?.data) {
    return { error: 'Erro ao obter fundo de reserva' }
  }

  // Verificar saldo suficiente
  if (Number(reserveFund.data.balance) < amount) {
    return { error: 'Saldo insuficiente no fundo de reserva' }
  }

  // Criar transação
  const { error: transactionError } = await supabase
    .from('reserve_fund_transactions')
    .insert({
      reserve_fund_id: reserveFund.data.id,
      church_id: churchId,
      transaction_type: 'withdrawal',
      amount,
      description: description || 'Retirada manual',
      created_by: user?.id,
    })

  if (transactionError) {
    return { error: transactionError.message }
  }

  // Atualizar saldo
  const newBalance = Number(reserveFund.data.balance) - amount
  const { error: updateError } = await supabase
    .from('reserve_fund')
    .update({ balance: newBalance })
    .eq('id', reserveFund.data.id)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/fundo-reserva')
  revalidatePath('/dashboard')
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

  // Verificar se já foi transferido este mês
  const { data: reserveFund, error: fundError } = await getReserveFund()
  if (fundError || !reserveFund?.data) {
    return { error: 'Erro ao obter fundo de reserva' }
  }

  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastTransferDate = reserveFund.data.last_transfer_date
    ? new Date(reserveFund.data.last_transfer_date)
    : null

  // Se já transferiu este mês, não transferir novamente
  if (lastTransferDate && lastTransferDate >= firstDayOfMonth) {
    return { error: 'Transferência automática já realizada este mês', success: false }
  }

  // Calcular saldo em caixa (receitas - despesas)
  const { data: revenues } = await supabase
    .from('revenues')
    .select('amount')
    .eq('church_id', churchId)

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('church_id', churchId)

  const totalRevenues = revenues?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const cashBalance = totalRevenues - totalExpenses

  if (cashBalance <= 0) {
    return { error: 'Não há saldo em caixa para transferir', success: false }
  }

  const { data: { user } } = await supabase.auth.getUser()

  // Criar transação de transferência automática
  const { error: transactionError } = await supabase
    .from('reserve_fund_transactions')
    .insert({
      reserve_fund_id: reserveFund.data.id,
      church_id: churchId,
      transaction_type: 'auto_transfer',
      amount: cashBalance,
      description: `Transferência automática de ${formatDate(new Date())}`,
      created_by: user?.id,
    })

  if (transactionError) {
    return { error: transactionError.message }
  }

  // Atualizar saldo e data da última transferência
  const newBalance = Number(reserveFund.data.balance) + cashBalance
  const { error: updateError } = await supabase
    .from('reserve_fund')
    .update({
      balance: newBalance,
      last_transfer_date: today.toISOString().split('T')[0],
    })
    .eq('id', reserveFund.data.id)

  if (updateError) {
    return { error: updateError.message }
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

