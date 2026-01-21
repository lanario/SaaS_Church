'use client'

import Link from 'next/link'
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
  FaCalendarAlt
} from 'react-icons/fa'
import { cn } from '@/lib/utils/cn'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: FaChartPie },
  { href: '/receitas', label: 'Entradas / Dízimos', icon: FaArrowCircleUp, color: 'text-green-400' },
  { href: '/despesas', label: 'Saídas / Gastos', icon: FaArrowCircleDown, color: 'text-red-400' },
  { href: '/categorias', label: 'Categorias', icon: FaFolder },
  { href: '/membros', label: 'Membros', icon: FaUsers },
  { href: '/eventos', label: 'Eventos', icon: FaCalendarAlt },
  { href: '/relatorios', label: 'Relatórios', icon: FaFileInvoiceDollar },
  { href: '/ajustes', label: 'Ajustes', icon: FaCog },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
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
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon className={cn('w-5', item.color && !isActive && item.color)} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
