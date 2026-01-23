'use client'

import { useState } from 'react'
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

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-800 text-white p-2 rounded-lg border border-slate-700"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 transform transition-transform duration-150 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <FaChurch className="text-xl" />
          </div>
          <span className="font-bold text-lg tracking-tight">Tesouraria</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-all duration-150',
                  isActive
                    ? 'bg-indigo-600 text-white scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95'
                )}
              >
                <Icon className={cn('w-5 flex-shrink-0', item.color && !isActive && item.color)} />
                <span className="truncate">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
