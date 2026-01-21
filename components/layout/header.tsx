'use client'

import { useState } from 'react'
import { FaSearch, FaBell, FaPlus } from 'react-icons/fa'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  userName?: string
  userEmail?: string
  userAvatar?: string
}

export function Header({ userName, userEmail, userAvatar }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Visão Geral</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar transação..."
            className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>
        <button
          className="relative text-gray-500 hover:text-indigo-600 transition-colors"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <FaBell className="text-xl" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
            0
          </span>
        </button>
        <Button
          size="sm"
          className="flex items-center gap-2"
          onClick={() => window.location.href = '/receitas/nova'}
        >
          <FaPlus />
          Nova Entrada
        </Button>
        <button
          onClick={() => signOut()}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          Sair
        </button>
      </div>
    </header>
  )
}

