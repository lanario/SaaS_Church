'use client'

import { FaWallet, FaDollarSign, FaFileInvoice, FaPiggyBank } from 'react-icons/fa'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { format, startOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Dados mockados para o preview
const mockStats = {
    balance: 42500,
    periodRevenues: 18500,
    periodExpenses: 12000,
    reserve: 12750,
}

const mockRevenueData = [
    { name: 'Dízimos', value: 12000, color: '#6366f1' },
    { name: 'Ofertas', value: 4500, color: '#10b981' },
    { name: 'Doações', value: 2000, color: '#f59e0b' },
]

// Função para criar eventos mockados no mês atual
function getMockEvents(currentDate: Date) {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    return [
        { date: new Date(year, month, 15), title: 'Culto de Oração' },
        { date: new Date(year, month, 20), title: 'Reunião de Jovens' },
        { date: new Date(year, month, 25), title: 'Aniversário de João Silva' },
    ]
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

export function DashboardPreview() {
    const currentDate = new Date()
    const monthStart = startOfMonth(currentDate)
    const monthDays = eachDayOfInterval({
        start: monthStart,
        end: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    })

    const firstDayOfWeek = getDay(monthStart)
    const previousMonthDays = []
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(monthStart)
        date.setDate(date.getDate() - (i + 1))
        previousMonthDays.push(date)
    }

    const lastDayOfWeek = getDay(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0))
    const nextMonthDays = []
    const daysToAdd = 6 - lastDayOfWeek
    for (let i = 1; i <= daysToAdd; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i)
        nextMonthDays.push(date)
    }

    const allDays = [...previousMonthDays, ...monthDays, ...nextMonthDays]

    const statsCards = [
        {
            title: 'Saldo em Caixa',
            value: formatCurrency(mockStats.balance),
            icon: FaWallet,
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600',
        },
        {
            title: 'Entradas (Mês)',
            value: formatCurrency(mockStats.periodRevenues),
            icon: FaDollarSign,
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
        },
        {
            title: 'Saídas (Mês)',
            value: formatCurrency(mockStats.periodExpenses),
            icon: FaFileInvoice,
            bgColor: 'bg-red-50',
            iconColor: 'text-red-600',
        },
        {
            title: 'Fundo de Reserva',
            value: formatCurrency(mockStats.reserve),
            icon: FaPiggyBank,
            bgColor: 'bg-amber-50',
            iconColor: 'text-amber-600',
        },
    ]

    const mockEvents = getMockEvents(currentDate)

    function getEventsForDate(date: Date) {
        return mockEvents.filter(e => isSameDay(e.date, date))
    }

    return (
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-white font-bold text-lg mb-2">Dashboard</h3>
                <p className="text-slate-400 text-sm">
                    {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                {statsCards.map((card) => {
                    const Icon = card.icon
                    return (
                        <div
                            key={card.title}
                            className="bg-slate-700/50 p-3 rounded-lg border border-slate-600/50"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`p-1.5 ${card.bgColor} ${card.iconColor} rounded-lg`}>
                                    <Icon className="text-sm" />
                                </div>
                                <p className="text-xs text-slate-400 font-medium">{card.title}</p>
                            </div>
                            <h3 className="text-sm font-bold text-white">{card.value}</h3>
                        </div>
                    )
                })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                {/* Revenue Chart */}
                <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600/50">
                    <h4 className="text-xs font-bold text-white mb-2">Receitas</h4>
                    <ResponsiveContainer width="100%" height={100}>
                        <PieChart>
                            <Pie
                                data={mockRevenueData}
                                cx="50%"
                                cy="50%"
                                outerRadius={35}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {mockRevenueData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #475569',
                                    borderRadius: '8px',
                                    fontSize: '11px'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Calendar Preview */}
                <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600/50">
                    <h4 className="text-xs font-bold text-white mb-2">Calendário</h4>
                    <div className="grid grid-cols-7 gap-1">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
                            <div key={idx} className="text-[8px] text-slate-400 text-center font-medium">
                                {day}
                            </div>
                        ))}
                        {allDays.slice(0, 21).map((date, idx) => {
                            const events = getEventsForDate(date)
                            const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                            const isToday = isSameDay(date, currentDate)

                            return (
                                <div
                                    key={idx}
                                    className={`
                    aspect-square flex items-center justify-center text-[9px] rounded
                    ${!isCurrentMonth ? 'text-slate-600' : 'text-slate-300'}
                    ${isToday ? 'bg-indigo-600 text-white font-bold' : ''}
                    ${events.length > 0 && !isToday ? 'bg-indigo-500/30' : ''}
                  `}
                                >
                                    {date.getDate()}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600/50">
                <h4 className="text-xs font-bold text-white mb-2">Últimas Movimentações</h4>
                <div className="space-y-2">
                    {[
                        { type: 'revenue', description: 'Dízimo - Maria Silva', amount: 500 },
                        { type: 'expense', description: 'Manutenção do Templo', amount: 1200 },
                        { type: 'revenue', description: 'Oferta do dia', amount: 350 },
                    ].map((transaction, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px]">
                            <span className={`text-slate-300 truncate ${idx === 0 ? 'font-semibold' : ''}`}>
                                {transaction.description}
                            </span>
                            <span className={`font-bold ${transaction.type === 'revenue' ? 'text-green-400' : 'text-red-400'}`}>
                                {transaction.type === 'revenue' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

