import { createClient } from '@/lib/supabase/server'
import { getFinancialStats, getRevenues, getExpenses } from '@/app/actions/financial'
import { getEvents } from '@/app/actions/events'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Buscar dados iniciais (mês atual)
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  
  const [stats, revenuesData, expensesData, eventsData] = await Promise.all([
    getFinancialStats({ start: startOfMonth, end: endOfMonth }, today),
    getRevenues({ start: startOfMonth, end: endOfMonth }),
    getExpenses({ start: startOfMonth, end: endOfMonth }),
    getEvents(startOfMonth, endOfMonth),
  ])

  // Buscar eventos futuros (próximos 30 dias) - incluir aniversários
  const futureEndDate = new Date(today)
  futureEndDate.setDate(futureEndDate.getDate() + 30)
  const { data: upcomingEvents } = await getEvents(today, futureEndDate, true)

  return (
    <DashboardContent
      initialStats={stats}
      initialRevenues={revenuesData.data || []}
      initialExpenses={expensesData.data || []}
      initialEvents={eventsData.data || []}
      initialUpcomingEvents={upcomingEvents || []}
    />
  )
}
