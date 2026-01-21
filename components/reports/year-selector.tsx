'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'

interface YearSelectorProps {
  currentYear: number
}

export function YearSelector({ currentYear }: YearSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleYearChange(newYear: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', newYear.toString())
    router.push(`/relatorios?${params.toString()}`)
  }

  function handlePreviousYear() {
    handleYearChange(currentYear - 1)
  }

  function handleNextYear() {
    handleYearChange(currentYear + 1)
  }

  return (
    <div className="flex items-center justify-center gap-4 bg-white rounded-lg border border-gray-200 p-4 w-fit mx-auto">
      <button
        onClick={handlePreviousYear}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Ano anterior"
      >
        <FaChevronLeft className="w-4 h-4 text-gray-600" />
      </button>
      <span className="text-lg font-semibold text-gray-800 min-w-[120px] text-center">
        {currentYear}
      </span>
      <button
        onClick={handleNextYear}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Próximo ano"
      >
        <FaChevronRight className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  )
}

