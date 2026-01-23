'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface Tab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface SettingsTabsProps {
  tabs: Tab[]
  defaultTab?: string
  children: (activeTab: string) => React.ReactNode
}

export function SettingsTabs({ tabs, defaultTab, children }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '')

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Menu Lateral - Tabs */}
      <div className="lg:w-64 flex-shrink-0">
        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-150 text-left',
                  isActive
                    ? 'bg-indigo-600 text-white scale-105'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white hover:scale-105 active:scale-95 border border-slate-600'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Conteúdo da Aba Ativa */}
      <div className="flex-1">
        {children(activeTab)}
      </div>
    </div>
  )
}

