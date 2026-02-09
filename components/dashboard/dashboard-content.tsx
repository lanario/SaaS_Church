'use client'

import { useState, useEffect } from 'react'
import { MonthNavigator } from './month-navigator'
import { DashboardStats } from './stats'
import { RecentTransactions } from './recent-transactions'
import { RevenueChart } from './revenue-chart'
import { ExpenseChart } from './expense-chart'
import { SimpleCalendar } from './simple-calendar'
import { UpcomingEvents } from './upcoming-events'
import { getFinancialStats, getRevenues, getExpenses } from '@/app/actions/financial'
import { getEvents } from '@/app/actions/events'
import { filterReserveFundRevenues, filterReserveFundExpenses } from '@/lib/utils/filter-reserve-fund'

interface DashboardContentProps {
  initialStats: any
  initialRevenues: any[]
  initialExpenses: any[]
  initialEvents: any[]
  initialUpcomingEvents: any[]
}

export function DashboardContent({
  initialStats,
  initialRevenues,
  initialExpenses,
  initialEvents,
  initialUpcomingEvents,
}: DashboardContentProps) {
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(today)
  const [stats, setStats] = useState(initialStats)
  const [revenues, setRevenues] = useState(initialRevenues)
  const [expenses, setExpenses] = useState(initialExpenses)
  const [events, setEvents] = useState(initialEvents)
  const [upcomingEvents, setUpcomingEvents] = useState(initialUpcomingEvents)
  const [loading, setLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    async function loadMonthData() {
      // Se for o carregamento inicial e a data selecionada for o mês atual, usar dados iniciais
      const selectedYear = selectedDate.getFullYear()
      const selectedMonth = selectedDate.getMonth()
      const currentYear = today.getFullYear()
      const currentMonth = today.getMonth()
      
      // Se for o carregamento inicial e o mês selecionado for o mês atual, não recarregar
      if (isInitialLoad && selectedYear === currentYear && selectedMonth === currentMonth) {
        setIsInitialLoad(false)
        return
      }

      // Se não for o carregamento inicial, recarregar os dados
      setLoading(true)
      setIsInitialLoad(false)
      
      try {
        const year = selectedDate.getFullYear()
        const month = selectedDate.getMonth()
        const startOfMonth = new Date(year, month, 1)
        const endOfMonth = new Date(year, month + 1, 0)
        
        // Buscar dados do mês selecionado
        const [statsData, revenuesData, expensesData, eventsData] = await Promise.all([
          getFinancialStats({ start: startOfMonth, end: endOfMonth }, selectedDate),
          getRevenues({ start: startOfMonth, end: endOfMonth }),
          getExpenses({ start: startOfMonth, end: endOfMonth }),
          getEvents(startOfMonth, endOfMonth),
        ])

        setStats(statsData)
        setRevenues(revenuesData.data || [])
        setExpenses(expensesData.data || [])
        setEvents(eventsData.data || [])

        // Buscar eventos futuros (sempre relativos à data atual)
        const futureEndDate = new Date(today)
        futureEndDate.setDate(futureEndDate.getDate() + 30)

        const upcomingData = await getEvents(today, futureEndDate, true) // Incluir aniversários
        setUpcomingEvents(upcomingData.data || [])
      } catch (error) {
        console.error('Erro ao carregar dados do mês:', error)
        setStats({ ...stats, error: 'Erro ao carregar dados do mês selecionado' })
      } finally {
        setLoading(false)
      }
    }

    loadMonthData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  // Filtrar fundo de reserva
  const filteredRevenues = filterReserveFundRevenues(revenues)
  const filteredExpenses = filterReserveFundExpenses(expenses)

  // Últimas transações
  const recentRevenues = filteredRevenues.slice(0, 5)
  const recentExpenses = filteredExpenses.slice(0, 5)
  const recentTransactions = [
    ...recentRevenues.map(r => ({ ...r, type: 'revenue' as const })),
    ...recentExpenses.map(e => ({ ...e, type: 'expense' as const })),
  ]
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    .slice(0, 10)

  if (stats.error) {
    const errorMessages = stats.error.split('\n\n').filter((msg: string) => msg.trim())
    
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-bold text-amber-300 mb-2">Atenção</h3>
          <div className="space-y-2">
            {errorMessages.map((message: string, index: number) => (
              <p key={index} className={`text-amber-200 ${index > 0 ? 'text-sm' : ''}`}>
                {message}
              </p>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <MonthNavigator currentDate={selectedDate} onDateChange={setSelectedDate} />
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">Carregando dados do mês...</div>
        </div>
      ) : (
        <>
          <DashboardStats stats={stats} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-4 sm:mt-6 lg:mt-8">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
              <RecentTransactions transactions={recentTransactions} />
              <SimpleCalendar events={events} />
            </div>
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <RevenueChart revenues={filteredRevenues} />
              <ExpenseChart expenses={filteredExpenses} />
              <UpcomingEvents events={upcomingEvents} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
