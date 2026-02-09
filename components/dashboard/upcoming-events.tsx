'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaEye, FaGift } from 'react-icons/fa'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface Event {
  id: string
  title: string
  event_date: string
  event_time?: string | null
  location?: string | null
  event_type?: string | null
  is_birthday?: boolean
  member_name?: string
}

interface UpcomingEventsProps {
  events: Event[]
}

function getEventTypeLabel(eventType: string | null | undefined) {
  const types: Record<string, string> = {
    worship: 'Culto',
    meeting: 'Reunião',
    special: 'Especial',
    birthday: '🎉 Aniversário',
    other: 'Outro',
  }
  return types[eventType || ''] || 'Evento'
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingEvents = events
    .filter((event) => {
      // Extrair apenas a parte da data (YYYY-MM-DD) para evitar problemas de timezone
      const eventDateStr = event.event_date.split('T')[0]
      const todayStr = today.toISOString().split('T')[0]
      
      // Comparar strings diretamente (YYYY-MM-DD)
      // Incluir tanto eventos normais quanto aniversários
      return eventDateStr >= todayStr
    })
    .sort((a, b) => {
      // Ordenar por data (mais próximo primeiro)
      const dateA = a.event_date.split('T')[0]
      const dateB = b.event_date.split('T')[0]
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB)
      }
      // Se mesma data, aniversários primeiro
      if (a.is_birthday && !b.is_birthday) return -1
      if (!a.is_birthday && b.is_birthday) return 1
      return 0
    })
    .slice(0, 5)

  if (upcomingEvents.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-bold text-white mb-4">Eventos Futuros</h3>
        <p className="text-slate-400 text-sm text-center py-4">
          Nenhum evento próximo
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="font-bold text-white mb-4">Eventos Futuros</h3>
      <div className="space-y-3">
        {upcomingEvents.map((event) => {
          // Extrair apenas a parte da data (YYYY-MM-DD) para evitar problemas de timezone
          const eventDateStr = event.event_date.split('T')[0]
          const todayStr = today.toISOString().split('T')[0]
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          const tomorrowStr = tomorrow.toISOString().split('T')[0]
          
          // Parsear a data diretamente da string YYYY-MM-DD usando UTC para evitar problemas de timezone
          const [year, month, day] = eventDateStr.split('-').map(Number)
          const eventDate = new Date(Date.UTC(year, month - 1, day))
          
          const isToday = eventDateStr === todayStr
          const isTomorrow = eventDateStr === tomorrowStr

          return (
            <div
              key={event.id}
              className="p-3 border border-slate-600 rounded-lg hover:border-indigo-500 hover:bg-slate-600 transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm text-white line-clamp-1 flex items-center gap-2">
                  {event.is_birthday && <FaGift className="w-4 h-4 text-pink-400 flex-shrink-0" />}
                  {event.title}
                </h4>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ml-2',
                  event.is_birthday && 'bg-pink-100 text-pink-700',
                  event.event_type === 'worship' && 'bg-indigo-100 text-indigo-700',
                  event.event_type === 'meeting' && 'bg-blue-100 text-blue-700',
                  event.event_type === 'special' && 'bg-purple-100 text-purple-700',
                  event.event_type === 'other' && 'bg-gray-100 text-gray-700'
                )}>
                  {event.is_birthday ? '🎉 Aniversário' : getEventTypeLabel(event.event_type)}
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-300 mb-3">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span>
                    {isToday && 'Hoje'}
                    {isTomorrow && 'Amanhã'}
                    {!isToday && !isTomorrow && format(eventDate, "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                  {event.event_time && (
                    <>
                      <span className="mx-1">•</span>
                      <FaClock className="w-3 h-3 text-slate-400" />
                      <span>{event.event_time.substring(0, 5)}</span>
                    </>
                  )}
                </div>
                {event.location && !event.is_birthday && (
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                )}
                {event.is_birthday && event.member_name && (
                  <div className="flex items-center gap-2">
                    <FaGift className="w-3 h-3 text-pink-400 flex-shrink-0" />
                    <span className="text-pink-300">Aniversário de {event.member_name}</span>
                  </div>
                )}
              </div>
              {!event.is_birthday && (
                <Link href={`/eventos/${event.id}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 text-xs hover:scale-105 active:scale-95 transition-transform duration-200"
                  >
                    <FaEye className="w-3 h-3" />
                    Ver Evento
                  </Button>
                </Link>
              )}
              {event.is_birthday && (
                <div className="text-xs text-pink-300 text-center py-2">
                  🎂 Aniversário
                </div>
              )}
            </div>
          )
        })}
      </div>
      {upcomingEvents.length >= 5 && (
        <Link
          href="/eventos"
          className="block mt-4 text-center text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Ver todos os eventos →
        </Link>
      )}
    </Card>
  )
}

