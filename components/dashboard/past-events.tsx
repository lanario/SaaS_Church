'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaEye } from 'react-icons/fa'
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
  estimated_members?: number | null
  estimated_visitors?: number | null
  actual_members?: number | null
  actual_visitors?: number | null
}

interface PastEventsProps {
  events: Event[]
  noHover?: boolean
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

function getTotalEstimated(event: Event): number {
  return (event.estimated_members || 0) + (event.estimated_visitors || 0)
}

function getTotalActual(event: Event): number | null {
  if (event.actual_members === null && event.actual_visitors === null) {
    return null
  }
  return (event.actual_members || 0) + (event.actual_visitors || 0)
}

export function PastEvents({ events, noHover = false }: PastEventsProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const pastEvents = events
    .filter((event) => {
      const eventDate = new Date(event.event_date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate < today
    })
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
    .slice(0, 5)

  if (pastEvents.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="font-bold text-white mb-4">Histórico de Eventos</h3>
        <p className="text-slate-400 text-sm text-center py-4">
          Nenhum evento passado
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="font-bold text-white mb-4">Histórico de Eventos</h3>
      <div className="space-y-3">
        {pastEvents.map((event) => {
          const eventDate = new Date(event.event_date)
          const totalEstimated = getTotalEstimated(event)
          const totalActual = getTotalActual(event)
          const hasActualData = totalActual !== null

          return (
            <div
              key={event.id}
              className={cn(
                "p-3 border border-slate-600 rounded-lg",
                !noHover && "hover:border-indigo-500 hover:bg-slate-600 transition-all"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm text-white line-clamp-1 flex-1">{event.title}</h4>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ml-2',
                  event.event_type === 'worship' && 'bg-indigo-900/50 text-indigo-300',
                  event.event_type === 'meeting' && 'bg-blue-900/50 text-blue-300',
                  event.event_type === 'special' && 'bg-purple-900/50 text-purple-300',
                  event.event_type === 'other' && 'bg-slate-600 text-slate-200'
                )}>
                  {getEventTypeLabel(event.event_type)}
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-300 mb-3">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span>{format(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                  {event.event_time && (
                    <>
                      <span className="mx-1">•</span>
                      <FaClock className="w-3 h-3 text-slate-400" />
                      <span>{event.event_time.substring(0, 5)}</span>
                    </>
                  )}
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                )}
                {/* Informações de presença */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-600">
                  <FaUsers className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-400">
                      Estimado: <span className="font-semibold text-slate-200">{totalEstimated}</span>
                    </span>
                    {hasActualData && (
                      <>
                        <span className="text-slate-500">•</span>
                        <span className={cn(
                          'font-semibold',
                          totalActual! >= totalEstimated ? 'text-green-400' : 'text-orange-400'
                        )}>
                          Real: {totalActual}
                        </span>
                      </>
                    )}
                    {!hasActualData && (
                      <span className="text-slate-500 text-[10px]">(não registrado)</span>
                    )}
                  </div>
                </div>
              </div>
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
            </div>
          )
        })}
      </div>
      {pastEvents.length >= 5 && (
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

