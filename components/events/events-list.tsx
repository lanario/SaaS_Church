'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
          <h3 className="font-bold text-gray-800">Próximos Eventos</h3>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm text-center py-4">
            Nenhum evento próximo
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-bold text-gray-800">Próximos Eventos</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingEvents.map((event) => {
            const eventDate = new Date(event.event_date)
            const isToday = format(eventDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
            const isTomorrow = format(eventDate, 'yyyy-MM-dd') === format(new Date(today.getTime() + 86400000), 'yyyy-MM-dd')

            return (
              <Link
                key={event.id}
                href={`/eventos/${event.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-800">{event.title}</h4>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-semibold',
                    event.event_type === 'worship' && 'bg-indigo-100 text-indigo-700',
                    event.event_type === 'meeting' && 'bg-blue-100 text-blue-700',
                    event.event_type === 'special' && 'bg-purple-100 text-purple-700',
                    event.event_type === 'other' && 'bg-gray-100 text-gray-700'
                  )}>
                    {event.event_type === 'worship' && 'Culto'}
                    {event.event_type === 'meeting' && 'Reunião'}
                    {event.event_type === 'special' && 'Especial'}
                    {event.event_type === 'other' && 'Outro'}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-indigo-500" />
                    <span>
                      {isToday && 'Hoje'}
                      {isTomorrow && 'Amanhã'}
                      {!isToday && !isTomorrow && format(eventDate, "dd 'de' MMM", { locale: ptBR })}
                    </span>
                  </div>
                  {event.event_time && (
                    <div className="flex items-center gap-2">
                      <FaClock className="text-indigo-500" />
                      <span>{event.event_time}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-indigo-500" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
        <Link
          href="/eventos"
          className="block mt-4 text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Ver todos os eventos →
        </Link>
      </CardContent>
    </Card>
  )
}

