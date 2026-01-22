'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaEye } from 'react-icons/fa'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface Event {
  id: string
  title: string
  description?: string | null
  event_date: string
  event_time?: string | null
  location?: string | null
  event_type: string
}

interface EventsListProps {
  events: Event[]
}

export function EventsList({ events }: EventsListProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingEvents = events.filter((event) => {
    const eventDate = new Date(event.event_date)
    eventDate.setHours(0, 0, 0, 0)
    return eventDate >= today
  }).slice(0, 5)

  if (upcomingEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-bold text-white">Próximos Eventos</h3>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm text-center py-4">
            Nenhum evento próximo
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-bold text-white">Próximos Eventos</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingEvents.map((event) => {
            const eventDate = new Date(event.event_date)
            const isToday = format(eventDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
            const isTomorrow = format(eventDate, 'yyyy-MM-dd') === format(new Date(today.getTime() + 86400000), 'yyyy-MM-dd')

            return (
              <div
                key={event.id}
                className="p-4 border border-slate-600 rounded-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-white">{event.title}</h4>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-semibold',
                    event.event_type === 'worship' && 'bg-indigo-900/50 text-indigo-300',
                    event.event_type === 'meeting' && 'bg-blue-900/50 text-blue-300',
                    event.event_type === 'special' && 'bg-purple-900/50 text-purple-300',
                    event.event_type === 'other' && 'bg-slate-600 text-slate-200'
                  )}>
                    {event.event_type === 'worship' && 'Culto'}
                    {event.event_type === 'meeting' && 'Reunião'}
                    {event.event_type === 'special' && 'Especial'}
                    {event.event_type === 'other' && 'Outro'}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-slate-300 mb-3">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-indigo-400" />
                    <span>
                      {isToday && 'Hoje'}
                      {isTomorrow && 'Amanhã'}
                      {!isToday && !isTomorrow && format(eventDate, "dd 'de' MMM", { locale: ptBR })}
                    </span>
                  </div>
                  {event.event_time && (
                    <div className="flex items-center gap-2">
                      <FaClock className="text-indigo-400" />
                      <span>{event.event_time}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-indigo-400" />
                      <span>{event.location}</span>
                    </div>
                  )}
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
        <Link
          href="/eventos"
          className="block mt-4 text-center text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Ver todos os eventos →
        </Link>
      </CardContent>
    </Card>
  )
}

