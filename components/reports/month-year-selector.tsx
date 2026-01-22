'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'

interface MonthYearSelectorProps {
  currentMonth: number
  currentYear: number
}

export function MonthYearSelector({ currentMonth, currentYear }: MonthYearSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleMonthChange(newMonth: number, newYear: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', newMonth.toString())
    params.set('year', newYear.toString())
    router.push(`/relatorios?${params.toString()}`)
  }

  function handlePreviousMonth() {
    if (currentMonth === 1) {
      handleMonthChange(12, currentYear - 1)
    } else {
      handleMonthChange(currentMonth - 1, currentYear)
    }
  }

  function handleNextMonth() {
    if (currentMonth === 12) {
      handleMonthChange(1, currentYear + 1)
    } else {
      handleMonthChange(currentMonth + 1, currentYear)
    }
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  return (
    <div className="flex items-center justify-center gap-4 bg-slate-700 rounded-lg border border-slate-600 p-4 w-fit mx-auto">
      <button
        onClick={handlePreviousMonth}
        className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
        aria-label="Mês anterior"
      >
        <FaChevronLeft className="w-4 h-4 text-slate-300" />
      </button>
      <span className="text-lg font-semibold text-white min-w-[200px] text-center">
        {monthNames[currentMonth - 1]} de {currentYear}
      </span>
      <button
        onClick={handleNextMonth}
        className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
        aria-label="Próximo mês"
      >
        <FaChevronRight className="w-4 h-4 text-slate-300" />
      </button>
    </div>
  )
}

