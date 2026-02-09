'use client'

import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'

interface MonthNavigatorProps {
  currentDate: Date
  onDateChange: (date: Date) => void
}

export function MonthNavigator({ currentDate, onDateChange }: MonthNavigatorProps) {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  function goToPreviousMonth() {
    const newDate = new Date(currentYear, currentMonth - 1, 1)
    onDateChange(newDate)
  }

  function goToNextMonth() {
    const newDate = new Date(currentYear, currentMonth + 1, 1)
    onDateChange(newDate)
  }

  function goToCurrentMonth() {
    onDateChange(new Date())
  }

  const isCurrentMonth = 
    currentMonth === new Date().getMonth() && 
    currentYear === new Date().getFullYear()

  return (
    <div className="flex items-center justify-between bg-slate-700 p-4 rounded-xl border border-slate-600 mb-6">
      <button
        onClick={goToPreviousMonth}
        className="p-2 hover:bg-slate-600 rounded-lg transition-colors text-slate-300 hover:text-white"
        aria-label="Mês anterior"
      >
        <FaChevronLeft className="text-xl" />
      </button>

      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-white">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        {!isCurrentMonth && (
          <button
            onClick={goToCurrentMonth}
            className="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Hoje
          </button>
        )}
      </div>

      <button
        onClick={goToNextMonth}
        className="p-2 hover:bg-slate-600 rounded-lg transition-colors text-slate-300 hover:text-white"
        aria-label="Próximo mês"
        disabled={isCurrentMonth}
      >
        <FaChevronRight className={`text-xl ${isCurrentMonth ? 'opacity-50 cursor-not-allowed' : ''}`} />
      </button>
    </div>
  )
}
