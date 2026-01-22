import { FaWallet, FaDollarSign, FaFileInvoice, FaPiggyBank } from 'react-icons/fa'

interface Stats {
  error?: string | null
  balance: number
  periodRevenues: number
  periodExpenses: number
  totalRevenues: number
  totalExpenses: number
}

interface DashboardStatsProps {
  stats: Stats
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statsCards = [
    {
      title: 'Saldo em Caixa',
      value: formatCurrency(stats.balance),
      icon: FaWallet,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      trend: stats.balance >= 0 ? '+8.2%' : undefined,
    },
    {
      title: 'Entradas (Mês)',
      value: formatCurrency(stats.periodRevenues),
      icon: FaDollarSign,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Saídas (Mês)',
      value: formatCurrency(stats.periodExpenses),
      icon: FaFileInvoice,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      title: 'Fundo de Reserva',
      value: formatCurrency(stats.balance * 0.3), // 30% do saldo
      icon: FaPiggyBank,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className="bg-slate-700 p-6 rounded-xl border border-slate-600 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 ${card.bgColor} ${card.iconColor} rounded-lg`}>
                <Icon className="text-xl" />
              </div>
              {card.trend && (
                <span className="text-xs font-medium text-green-400 bg-green-900/30 px-2 py-1 rounded">
                  {card.trend}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-300 font-medium">{card.title}</p>
            <h3 className="text-2xl font-bold text-white">{card.value}</h3>
          </div>
        )
      })}
    </div>
  )
}

