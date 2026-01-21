import { createClient } from '@/lib/supabase/server'
import { getFinancialStats, getRevenues, getExpenses } from '@/app/actions/financial'
import { getEvents } from '@/app/actions/events'
import { DashboardStats } from '@/components/dashboard/stats'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { ExpenseChart } from '@/components/dashboard/expense-chart'
import { SimpleCalendar } from '@/components/dashboard/simple-calendar'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Buscar estatísticas
  const stats = await getFinancialStats()
  const { data: revenues } = await getRevenues()
  const { data: expenses } = await getExpenses()

  // Buscar eventos para o calendário
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const { data: events } = await getEvents(startOfMonth, endOfMonth)

  // Verificar erros
  if (stats.error) {
    // Separar mensagens por quebra de linha se houver
    const errorMessages = stats.error.split('\n\n').filter(msg => msg.trim())
    
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-bold text-amber-800 mb-2">Atenção</h3>
          <div className="space-y-2">
            {errorMessages.map((message, index) => (
              <p key={index} className={`text-amber-700 ${index > 0 ? 'text-sm' : ''}`}>
                {message}
              </p>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Últimas transações (últimas 5 receitas e 5 despesas)
  const recentRevenues = revenues?.slice(0, 5) || []
  const recentExpenses = expenses?.slice(0, 5) || []
  const recentTransactions = [
    ...recentRevenues.map(r => ({ ...r, type: 'revenue' as const })),
    ...recentExpenses.map(e => ({ ...e, type: 'expense' as const })),
  ]
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    .slice(0, 10)

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <DashboardStats stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 space-y-8">
          <RecentTransactions transactions={recentTransactions} />
          <SimpleCalendar events={events || []} />
        </div>
        <div className="space-y-8">
          <RevenueChart revenues={revenues || []} />
          <ExpenseChart expenses={expenses || []} />
        </div>
      </div>
    </div>
  )
}
