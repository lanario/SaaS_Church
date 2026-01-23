'use client'

import { useState } from 'react'
import { PermissionsManager } from './permissions-manager'
import { InvitesManager } from './invites-manager'
import { FaUsers, FaEnvelope } from 'react-icons/fa'
import { cn } from '@/lib/utils/cn'

export function AjustesUsuarios() {
  const [activeTab, setActiveTab] = useState<'permissions' | 'invites'>('permissions')

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-600">
        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 font-medium transition-all duration-200',
            activeTab === 'permissions'
              ? 'text-indigo-400 border-b-2 border-indigo-400 scale-105'
              : 'text-slate-400 hover:text-white hover:scale-105'
          )}
        >
          <FaUsers className="w-4 h-4" />
          Usuários e Permissões
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('invites')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 font-medium transition-all duration-200',
            activeTab === 'invites'
              ? 'text-indigo-400 border-b-2 border-indigo-400 scale-105'
              : 'text-slate-400 hover:text-white hover:scale-105'
          )}
        >
          <FaEnvelope className="w-4 h-4" />
          Convites
        </button>
      </div>

      {/* Conteúdo */}
      {activeTab === 'permissions' && <PermissionsManager />}
      {activeTab === 'invites' && <InvitesManager />}
    </div>
  )
}


