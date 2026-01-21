'use client'

import { useState } from 'react'
import { FaChartLine, FaChartPie, FaMoneyBillWave } from 'react-icons/fa'
import { RevenueVsExpenseReport } from './revenue-vs-expense-report'
import { CategoryReport } from './category-report'
import { CashFlowReport } from './cash-flow-report'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

interface ReportTabsProps {
  revenueVsExpense: any
  categoryReport: any
  cashFlow: any
}

const tabs = [
  { id: 'revenue-expense', label: 'Receitas vs Despesas', icon: FaChartLine },
  { id: 'category', label: 'Por Categorias', icon: FaChartPie },
  { id: 'cash-flow', label: 'Fluxo de Caixa', icon: FaMoneyBillWave },
]

export function ReportTabs({ revenueVsExpense, categoryReport, cashFlow }: ReportTabsProps) {
  const [activeTab, setActiveTab] = useState('revenue-expense')

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-6 py-3 font-semibold transition-colors border-b-2',
                activeTab === tab.id
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
        {activeTab === 'revenue-expense' && (
          <RevenueVsExpenseReport data={revenueVsExpense} />
        )}
        {activeTab === 'category' && (
          <CategoryReport data={categoryReport} />
        )}
        {activeTab === 'cash-flow' && (
          <CashFlowReport data={cashFlow} />
        )}
      </div>
    </div>
  )
}

