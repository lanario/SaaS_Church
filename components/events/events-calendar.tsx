'use client'

import { useState, useMemo } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FaCalendarAlt } from 'react-icons/fa'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  event_date: string
  event_time?: string | null
  event_type: string
}

interface EventsCalendarProps {
  events: Event[]
}

export function EventsCalendar({ events }: EventsCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Criar mapa de eventos por data
  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {}
    events.forEach((event) => {
      const dateKey = event.event_date
      if (!map[dateKey]) {
        map[dateKey] = []
      }
      map[dateKey].push(event)
    })
    return map
  }, [events])

  // Estilizar datas que têm eventos
  function tileContent({ date }: { date: Date }) {
    const dateKey = format(date, 'yyyy-MM-dd')
    const dayEvents = eventsByDate[dateKey] || []
    
    if (dayEvents.length > 0) {
      return (
        <div className="flex justify-center gap-1 mt-1">
          {dayEvents.slice(0, 3).map((event) => (
            <div
              key={event.id}
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                event.event_type === 'worship' && 'bg-indigo-500',
                event.event_type === 'meeting' && 'bg-blue-500',
                event.event_type === 'special' && 'bg-purple-500',
                event.event_type === 'other' && 'bg-gray-500'
              )}
            />
          ))}
          {dayEvents.length > 3 && (
            <span className="text-xs text-gray-500">+{dayEvents.length - 3}</span>
          )}
        </div>
      )
    }
    return null
  }

  // Filtrar eventos da data selecionada
  const selectedDateEvents = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    return eventsByDate[dateKey] || []
  }, [selectedDate, eventsByDate])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-indigo-600" />
          <h3 className="font-bold text-gray-800">Calendário de Eventos</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex justify-center">
            <Calendar
              onChange={(value) => setSelectedDate(value as Date)}
              value={selectedDate}
              tileContent={tileContent}
              locale="pt-BR"
              className="w-full border-none rounded-xl"
            />
          </div>

          {selectedDateEvents.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-4">
                Eventos em {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </h4>
              <div className="space-y-2">
                {selectedDateEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/eventos/${event.id}`}
                    className="block p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-gray-800">{event.title}</h5>
                        {event.event_time && (
                          <p className="text-sm text-gray-600 mt-1">
                            <FaCalendarAlt className="inline mr-1" />
                            {event.event_time}
                          </p>
                        )}
                      </div>
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
                  </Link>
                ))}
              </div>
            </div>
          )}

          {selectedDateEvents.length === 0 && (
            <div className="mt-6 text-center text-gray-500 py-8">
              <p>Nenhum evento nesta data</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

