'use client'

import { useState } from 'react'
import { FaUser, FaChurch, FaUsers } from 'react-icons/fa'
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
                  'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200'
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

