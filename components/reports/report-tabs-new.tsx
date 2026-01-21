'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FaCalendarAlt, FaChartLine, FaUsers } from 'react-icons/fa'
import { cn } from '@/lib/utils/cn'

interface ReportTabsProps {
  activeTab: string
  month: number
  year: number
  children: React.ReactNode
}

const tabs = [
  { id: 'monthly', label: 'Relatório Mensal', icon: FaCalendarAlt },
  { id: 'annual', label: 'Relatório Anual', icon: FaChartLine },
  { id: 'tithes', label: 'Dízimos por Membro', icon: FaUsers },
]

export function ReportTabs({ activeTab, month, year, children }: ReportTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleTabChange(tabId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    params.set('month', month.toString())
    params.set('year', year.toString())
    router.push(`/relatorios?${params.toString()}`)
  }

  return (
    <div>
      {/* Tabs Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-6 py-3 font-semibold transition-colors border-b-2',
                isActive
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              )}
            >
              <Icon />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div>
        {children}
      </div>
    </div>
  )
}

