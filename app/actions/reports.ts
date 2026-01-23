'use server'

import { createClient } from '@/lib/supabase/server'
import { getChurchId } from '@/lib/utils/get-church-id'
import { filterReserveFundRevenues, filterReserveFundExpenses } from '@/lib/utils/filter-reserve-fund'
import type { ReportFilterInput } from '@/lib/validations/reports'

// ============================================
// RELATÓRIOS FINANCEIROS
// ============================================

/**
 * Obter dados para relatório de Receitas vs Despesas
 */
export async function getRevenueVsExpenseReport(filters: ReportFilterInput) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  // Calcular datas com base no período
  const { startDate, endDate } = calculateDateRange(filters)

  // Buscar receitas
  let revenueQuery = supabase
    .from('revenues')
    .select('amount, transaction_date, category_id, revenue_categories(name)')
    .eq('church_id', churchId)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  if (filters.categoryId) {
    revenueQuery = revenueQuery.eq('category_id', filters.categoryId)
  }

  const { data: revenues, error: revenueError } = await revenueQuery

  if (revenueError) {
    return { error: revenueError.message, data: null }
  }

  // Buscar despesas
  let expenseQuery = supabase
    .from('expenses')
    .select('amount, transaction_date, category_id, expense_categories(name)')
    .eq('church_id', churchId)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  if (filters.categoryId) {
    expenseQuery = expenseQuery.eq('category_id', filters.categoryId)
  }

  const { data: expenses, error: expenseError } = await expenseQuery

  if (expenseError) {
    return { error: expenseError.message, data: null }
  }

  // Filtrar fundo de reserva
  const filteredRevenues = filterReserveFundRevenues(revenues || [])
  const filteredExpenses = filterReserveFundExpenses(expenses || [])

  const totalRevenue = filteredRevenues.reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const balance = totalRevenue - totalExpense

  // Agrupar por mês
  const monthlyData = groupByMonth(filteredRevenues, filteredExpenses)

  return {
    error: null,
    data: {
      totalRevenue,
      totalExpense,
      balance,
      monthlyData,
      revenues: filteredRevenues,
      expenses: filteredExpenses,
    },
  }
}

/**
 * Relatório por categorias
 */
export async function getCategoryReport(filters: ReportFilterInput) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  const { startDate, endDate } = calculateDateRange(filters)

  // Buscar categorias de receitas com totais
  const { data: revenueCategories } = await supabase
    .from('revenue_categories')
    .select('id, name, color')
    .eq('church_id', churchId)

  // Buscar categorias de despesas com totais
  const { data: expenseCategories } = await supabase
    .from('expense_categories')
    .select('id, name, color')
    .eq('church_id', churchId)

  // Calcular totais por categoria de receitas
  const revenueTotals = await Promise.all(
    (revenueCategories || []).map(async (category) => {
      // Pular categoria "Fundo de Reserva"
      if (category.name.toLowerCase() === 'fundo de reserva') {
        return { ...category, total: 0, type: 'revenue' as const }
      }

      const { data: revenues } = await supabase
        .from('revenues')
        .select('amount, revenue_categories(name), description')
        .eq('church_id', churchId)
        .eq('category_id', category.id)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)

      const filteredRevenues = filterReserveFundRevenues(revenues || [])
      const total = filteredRevenues.reduce((sum, r) => sum + Number(r.amount || 0), 0)
      return { ...category, total, type: 'revenue' as const }
    })
  )

  // Calcular totais por categoria de despesas
  const expenseTotals = await Promise.all(
    (expenseCategories || []).map(async (category) => {
      // Pular categoria "Fundo de Reserva"
      if (category.name.toLowerCase() === 'fundo de reserva') {
        return { ...category, total: 0, type: 'expense' as const }
      }

      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, expense_categories(name), description')
        .eq('church_id', churchId)
        .eq('category_id', category.id)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)

      const filteredExpenses = filterReserveFundExpenses(expenses || [])
      const total = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
      return { ...category, total, type: 'expense' as const }
    })
  )

  return {
    error: null,
    data: {
      revenueCategories: revenueTotals.filter(c => c.total > 0),
      expenseCategories: expenseTotals.filter(c => c.total > 0),
    },
  }
}

/**
 * Relatório de fluxo de caixa
 */
export async function getCashFlowReport(filters: ReportFilterInput) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  const { startDate, endDate } = calculateDateRange(filters)

  // Buscar todas as transações ordenadas por data
  const { data: revenues } = await supabase
    .from('revenues')
    .select('amount, transaction_date, revenue_categories(name), description')
    .eq('church_id', churchId)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date', { ascending: true })

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, transaction_date, expense_categories(name), description')
    .eq('church_id', churchId)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date', { ascending: true })

  // Filtrar fundo de reserva
  const filteredRevenues = filterReserveFundRevenues(revenues || [])
  const filteredExpenses = filterReserveFundExpenses(expenses || [])

  // Calcular saldo acumulado dia a dia
  const dailyBalances = calculateDailyBalances(filteredRevenues, filteredExpenses, startDate, endDate)

  return {
    error: null,
    data: {
      dailyBalances,
      startingBalance: dailyBalances[0]?.balance || 0,
      endingBalance: dailyBalances[dailyBalances.length - 1]?.balance || 0,
    },
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function calculateDateRange(filters: ReportFilterInput) {
  const now = new Date()
  let startDate: string
  let endDate: string

  if (filters.period === 'month' && filters.month && filters.year) {
    startDate = new Date(filters.year, filters.month - 1, 1).toISOString().split('T')[0]
    endDate = new Date(filters.year, filters.month, 0).toISOString().split('T')[0]
  } else if (filters.period === 'quarter' && filters.quarter && filters.year) {
    const startMonth = (filters.quarter - 1) * 3
    startDate = new Date(filters.year, startMonth, 1).toISOString().split('T')[0]
    endDate = new Date(filters.year, startMonth + 3, 0).toISOString().split('T')[0]
  } else if (filters.period === 'year' && filters.year) {
    startDate = new Date(filters.year, 0, 1).toISOString().split('T')[0]
    endDate = new Date(filters.year, 11, 31).toISOString().split('T')[0]
  } else if (filters.startDate && filters.endDate) {
    startDate = filters.startDate
    endDate = filters.endDate
  } else {
    // Padrão: mês atual
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  }

  return { startDate, endDate }
}

function groupByMonth(revenues: any[], expenses: any[]) {
  const months: Record<string, { revenue: number; expense: number }> = {}

  revenues.forEach((r) => {
    const month = r.transaction_date.substring(0, 7) // YYYY-MM
    if (!months[month]) {
      months[month] = { revenue: 0, expense: 0 }
    }
    months[month].revenue += Number(r.amount || 0)
  })

  expenses.forEach((e) => {
    const month = e.transaction_date.substring(0, 7) // YYYY-MM
    if (!months[month]) {
      months[month] = { revenue: 0, expense: 0 }
    }
    months[month].expense += Number(e.amount || 0)
  })

  return Object.entries(months).map(([month, data]) => ({
    month,
    revenue: data.revenue,
    expense: data.expense,
    balance: data.revenue - data.expense,
  }))
}

function calculateDailyBalances(revenues: any[], expenses: any[], startDate: string, endDate: string) {
  const balances: Array<{ date: string; revenue: number; expense: number; balance: number }> = []
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  let currentBalance = 0

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0]
    const dayRevenue = revenues
      .filter(r => r.transaction_date === dateStr)
      .reduce((sum, r) => sum + Number(r.amount || 0), 0)
    
    const dayExpense = expenses
      .filter(e => e.transaction_date === dateStr)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0)

    currentBalance += dayRevenue - dayExpense

    balances.push({
      date: dateStr,
      revenue: dayRevenue,
      expense: dayExpense,
      balance: currentBalance,
    })
  }

  return balances
}

/**
 * Obter dados para relatório mensal completo
 */
export async function getMonthlyReport(month: number, year: number) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  // Buscar receitas do mês
  const { data: revenues } = await supabase
    .from('revenues')
    .select(`
      id,
      amount,
      description,
      transaction_date,
      revenue_categories(name),
      member_id
    `)
    .eq('church_id', churchId)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  // Buscar despesas do mês
  const { data: expenses } = await supabase
    .from('expenses')
    .select(`
      id,
      amount,
      description,
      transaction_date,
      expense_categories(name)
    `)
    .eq('church_id', churchId)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  // Filtrar fundo de reserva
  const filteredRevenues = filterReserveFundRevenues(revenues || [])
  const filteredExpenses = filterReserveFundExpenses(expenses || [])

  const totalRevenue = filteredRevenues.reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const balance = totalRevenue - totalExpense

  // Calcular mês anterior para variação
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const prevStartDate = new Date(prevYear, prevMonth - 1, 1).toISOString().split('T')[0]
  const prevEndDate = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0]

  // Buscar dados do mês anterior
  const { data: prevRevenues } = await supabase
    .from('revenues')
    .select('amount, revenue_categories(name), description')
    .eq('church_id', churchId)
    .gte('transaction_date', prevStartDate)
    .lte('transaction_date', prevEndDate)

  const { data: prevExpenses } = await supabase
    .from('expenses')
    .select('amount, expense_categories(name), description')
    .eq('church_id', churchId)
    .gte('transaction_date', prevStartDate)
    .lte('transaction_date', prevEndDate)

  const filteredPrevRevenues = filterReserveFundRevenues(prevRevenues || [])
  const filteredPrevExpenses = filterReserveFundExpenses(prevExpenses || [])

  const prevTotalRevenue = filteredPrevRevenues.reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const prevTotalExpense = filteredPrevExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const prevBalance = prevTotalRevenue - prevTotalExpense

  const variation = balance - prevBalance
  const variationPercent = prevBalance !== 0 ? (variation / Math.abs(prevBalance)) * 100 : 0

  // Criar dados mensais para o gráfico (um ponto para o mês atual)
  const monthName = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })
  const monthlyData = [{
    month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
    revenue: totalRevenue,
    expense: totalExpense,
  }]

  // Formatar transações
  const transactions: Array<{
    id: string
    date: string
    description: string | null
    category: string | null
    member: string | null
    type: 'revenue' | 'expense'
    amount: number
  }> = []

  filteredRevenues.forEach((rev) => {
    const categoryName = Array.isArray(rev.revenue_categories)
      ? rev.revenue_categories[0]?.name
      : (rev.revenue_categories as any)?.name
    transactions.push({
      id: rev.id,
      date: rev.transaction_date,
      description: rev.description,
      category: categoryName || null,
      member: rev.member_id ? 'Dízimo' : null,
      type: 'revenue',
      amount: Number(rev.amount),
    })
  })

  filteredExpenses.forEach((exp) => {
    const categoryName = Array.isArray(exp.expense_categories)
      ? exp.expense_categories[0]?.name
      : (exp.expense_categories as any)?.name
    transactions.push({
      id: exp.id,
      date: exp.transaction_date,
      description: exp.description,
      category: categoryName || null,
      member: null,
      type: 'expense',
      amount: Number(exp.amount),
    })
  })

  // Ordenar transações por data (mais recente primeiro)
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return {
    error: null,
    data: {
      month,
      year,
      totalRevenue,
      totalExpense,
      balance,
      variation,
      variationPercent,
      monthlyData,
      transactions,
    },
  }
}

/**
 * Obter dados para relatório anual completo
 */
export async function getAnnualReport(year: number) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  const startDate = new Date(year, 0, 1).toISOString().split('T')[0]
  const endDate = new Date(year, 11, 31).toISOString().split('T')[0]

  // Buscar todas as receitas do ano
  const { data: revenues } = await supabase
    .from('revenues')
    .select('amount, transaction_date, revenue_categories(name), description')
    .eq('church_id', churchId)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  // Buscar todas as despesas do ano
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, transaction_date, expense_categories(name), description')
    .eq('church_id', churchId)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  // Filtrar fundo de reserva
  const filteredRevenues = filterReserveFundRevenues(revenues || [])
  const filteredExpenses = filterReserveFundExpenses(expenses || [])

  const totalRevenue = filteredRevenues.reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const balance = totalRevenue - totalExpense

  // Calcular ano anterior para variação
  const prevYear = year - 1
  const prevStartDate = new Date(prevYear, 0, 1).toISOString().split('T')[0]
  const prevEndDate = new Date(prevYear, 11, 31).toISOString().split('T')[0]

  // Buscar dados do ano anterior
  const { data: prevRevenues } = await supabase
    .from('revenues')
    .select('amount, revenue_categories(name), description')
    .eq('church_id', churchId)
    .gte('transaction_date', prevStartDate)
    .lte('transaction_date', prevEndDate)

  const { data: prevExpenses } = await supabase
    .from('expenses')
    .select('amount, expense_categories(name), description')
    .eq('church_id', churchId)
    .gte('transaction_date', prevStartDate)
    .lte('transaction_date', prevEndDate)

  const filteredPrevRevenues = filterReserveFundRevenues(prevRevenues || [])
  const filteredPrevExpenses = filterReserveFundExpenses(prevExpenses || [])

  const prevTotalRevenue = filteredPrevRevenues.reduce((sum, r) => sum + Number(r.amount || 0), 0)
  const prevTotalExpense = filteredPrevExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const prevBalance = prevTotalRevenue - prevTotalExpense

  const variation = balance - prevBalance
  const variationPercent = prevBalance !== 0 ? (variation / Math.abs(prevBalance)) * 100 : 0

  // Agrupar dados por mês
  const monthlyData = groupByMonth(filteredRevenues, filteredExpenses)
  
  // Garantir que todos os 12 meses estejam presentes
  const allMonths = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  
  const completeMonthlyData = allMonths.map((monthName, index) => {
    const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`
    const existingData = monthlyData.find(m => m.month === monthKey)
    
    return {
      month: monthName,
      revenue: existingData?.revenue || 0,
      expense: existingData?.expense || 0,
      balance: (existingData?.revenue || 0) - (existingData?.expense || 0),
    }
  })

  return {
    error: null,
    data: {
      year,
      totalRevenue,
      totalExpense,
      balance,
      variation,
      variationPercent,
      monthlyData: completeMonthlyData,
    },
  }
}

/**
 * Obter dados para relatório de Dízimos por Membro
 */
export async function getTithesByMemberReport(year?: number) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  // Se não especificar ano, usar ano atual
  const currentYear = year || new Date().getFullYear()
  const startDate = new Date(currentYear, 0, 1).toISOString().split('T')[0]
  const endDate = new Date(currentYear, 11, 31).toISOString().split('T')[0]

  // Buscar todas as receitas que são dízimos (têm member_id) do ano
  const { data: tithes, error: tithesError } = await supabase
    .from('revenues')
    .select(`
      id,
      amount,
      transaction_date,
      member_id,
      members(id, full_name, status)
    `)
    .eq('church_id', churchId)
    .not('member_id', 'is', null)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  if (tithesError) {
    return { error: tithesError.message, data: null }
  }

  // Filtrar apenas membros ativos e processar dados
  const activeTithes = tithes?.filter(tithe => {
    const member = tithe.members as any
    return member && member.status === 'active'
  }) || []

  // Agrupar por membro
  const memberTotals: Record<string, {
    memberId: string
    memberName: string
    total: number
    count: number
    transactions: Array<{ date: string; amount: number }>
  }> = {}

  activeTithes.forEach((tithe) => {
    const memberId = tithe.member_id as string
    const memberName = (tithe.members as any)?.full_name || 'Membro Desconhecido'
    const amount = Number(tithe.amount || 0)

    if (!memberTotals[memberId]) {
      memberTotals[memberId] = {
        memberId,
        memberName,
        total: 0,
        count: 0,
        transactions: [],
      }
    }

    memberTotals[memberId].total += amount
    memberTotals[memberId].count += 1
    memberTotals[memberId].transactions.push({
      date: tithe.transaction_date,
      amount,
    })
  })

  // Converter para array e ordenar por total (maior primeiro)
  const memberData = Object.values(memberTotals)
    .map(member => ({
      ...member,
      transactions: member.transactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    }))
    .sort((a, b) => b.total - a.total)

  const totalTithes = memberData.reduce((sum, m) => sum + m.total, 0)
  const totalMembers = memberData.length
  const averageTithe = totalMembers > 0 ? totalTithes / totalMembers : 0

  return {
    error: null,
    data: {
      year: currentYear,
      totalTithes,
      totalMembers,
      averageTithe,
      memberData,
    },
  }
}

