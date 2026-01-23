'use client'

import { useState, useRef, useEffect } from 'react'
import { FaBell } from 'react-icons/fa'
import { signOut } from '@/app/actions/auth'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  created_at: string
}

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notificationRef = useRef<HTMLDivElement>(null)

  // Carregar notificações (mock por enquanto)
  useEffect(function loadNotifications() {
    // TODO: Implementar busca real de notificações do banco
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Transferência Automática',
        message: 'A transferência automática para o fundo de reserva será realizada no dia 01 do próximo mês.',
        type: 'info',
        read: false,
        created_at: new Date().toISOString(),
      },
    ]
    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter(n => !n.read).length)
  }, [])

  // Fechar notificações ao clicar fora
  useEffect(function handleClickOutside() {
    function handleClick(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
    return undefined
  }, [showNotifications])

  function markAsRead(notificationId: string) {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  function markAllAsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  return (
    <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
      <div className="flex items-center gap-2 lg:gap-4 min-w-0">
        <h2 className="text-lg lg:text-xl font-semibold text-white truncate">Visão Geral</h2>
        <span className="hidden sm:inline text-sm text-slate-300 bg-slate-700 px-3 py-1 rounded-full whitespace-nowrap">
          {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        <div className="relative" ref={notificationRef}>
          <button
            className="relative text-slate-300 hover:text-indigo-400 transition-colors"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FaBell className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-semibold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown de Notificações */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-700 rounded-lg shadow-xl border border-slate-600 z-50 max-h-96 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-600 flex items-center justify-between">
                <h3 className="font-bold text-white">Notificações</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    Nenhuma notificação
                  </div>
                ) : (
                  <div className="divide-y divide-slate-600">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-slate-600 transition-colors cursor-pointer ${
                          !notification.read ? 'bg-indigo-900/30' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            !notification.read ? 'bg-indigo-400' : 'bg-transparent'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-white mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-slate-300 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => signOut()}
          className="text-sm text-slate-300 hover:text-white transition-colors"
        >
          Sair
        </button>
      </div>
    </header>
  )
}

