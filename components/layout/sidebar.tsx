'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { 
  FaChurch, 
  FaChartPie, 
  FaArrowCircleUp, 
  FaArrowCircleDown, 
  FaUsers, 
  FaFileInvoiceDollar, 
  FaCog, 
  FaFolder,
  FaCalendarAlt,
  FaPiggyBank,
  FaBars,
  FaTimes
} from 'react-icons/fa'
import { cn } from '@/lib/utils/cn'
import { NavLink } from './nav-link'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: FaChartPie },
  { href: '/receitas', label: 'Entradas / Dízimos', icon: FaArrowCircleUp, color: 'text-green-400' },
  { href: '/despesas', label: 'Saídas / Gastos', icon: FaArrowCircleDown, color: 'text-red-400' },
  { href: '/categorias', label: 'Categorias', icon: FaFolder },
  { href: '/membros', label: 'Membros', icon: FaUsers },
  { href: '/eventos', label: 'Eventos', icon: FaCalendarAlt },
  { href: '/fundo-reserva', label: 'Fundo de Reserva', icon: FaPiggyBank },
  { href: '/relatorios', label: 'Relatórios', icon: FaFileInvoiceDollar },
  { href: '/ajustes', label: 'Ajustes', icon: FaCog },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Fechar sidebar mobile ao navegar
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Fechar sidebar ao pressionar ESC
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMobileOpen])

  // Prevenir scroll do body quando sidebar mobile está aberta
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileOpen])

  const handleClose = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all duration-150 shadow-lg"
        aria-label="Toggle menu"
        aria-expanded={isMobileOpen}
      >
        {isMobileOpen ? <FaTimes className="w-5 h-5 transition-transform duration-150" /> : <FaBars className="w-5 h-5 transition-transform duration-150" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-100"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col flex-shrink-0',
          'transform transition-transform duration-100 ease-out will-change-transform',
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Navegação principal"
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 flex-shrink-0">
          <div className="bg-indigo-600 p-2 rounded-lg transition-transform duration-150 hover:scale-110 active:scale-95 cursor-pointer">
            <FaChurch className="text-xl" />
          </div>
          <span className="font-bold text-lg tracking-tight truncate">Tesouraria</span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {menuItems.map((item) => {
            const Icon = item.icon
            if (!Icon) {
              console.error('Icon undefined for:', item.label)
              return null
            }
            
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            
            return (
              <NavLink
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={handleClose}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg',
                  'transition-all duration-150 ease-out',
                  'will-change-transform',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]'
                )}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0 transition-all duration-150', item.color && !isActive && item.color, !isActive && 'hover:scale-110')} />
                <span className="truncate font-medium text-sm">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
