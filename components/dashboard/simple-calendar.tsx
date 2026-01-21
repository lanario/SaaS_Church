'use client'

import { useState, useRef } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FaChevronLeft, FaChevronRight, FaClock, FaMapMarkerAlt, FaInfoCircle } from 'react-icons/fa'
import { Card } from '@/components/ui/card'

interface Event {
  id: string
  title: string
  description?: string | null
  event_date: string
  event_time?: string | null
  location?: string | null
  event_type?: string | null
  is_public?: boolean | null
  is_birthday?: boolean
  member_name?: string
}

interface SimpleCalendarProps {
  events?: Event[]
  onDateClick?: (date: Date) => void
}

export function SimpleCalendar({ events = [], onDateClick }: SimpleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Adicionar dias do mês anterior para completar a primeira semana
  const firstDayOfWeek = getDay(monthStart)
  const previousMonthDays = []
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(monthStart)
    date.setDate(date.getDate() - (i + 1))
    previousMonthDays.push(date)
  }

  // Adicionar dias do próximo mês para completar a última semana
  const lastDayOfWeek = getDay(monthEnd)
  const nextMonthDays = []
  const daysToAdd = 6 - lastDayOfWeek
  for (let i = 1; i <= daysToAdd; i++) {
    const date = new Date(monthEnd)
    date.setDate(date.getDate() + i)
    nextMonthDays.push(date)
  }

  const allDays = [...previousMonthDays, ...monthDays, ...nextMonthDays]

  function handlePreviousMonth() {
    setCurrentDate(subMonths(currentDate, 1))
  }

  function handleNextMonth() {
    setCurrentDate(addMonths(currentDate, 1))
  }

  function hasEvent(date: Date) {
    return events.some(event => isSameDay(new Date(event.event_date), date))
  }

  function getEventForDate(date: Date) {
    return events.find(event => isSameDay(new Date(event.event_date), date))
  }

  function getAllEventsForDate(date: Date) {
    return events.filter(event => isSameDay(new Date(event.event_date), date))
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

  function handleMouseEnter(date: Date, event: React.MouseEvent<HTMLButtonElement>) {
    if (hasEvent(date)) {
      setHoveredDate(date)
      const rect = event.currentTarget.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      
      // Calcular posição central do botão
      let x = rect.left + rect.width / 2
      let y = rect.top - 10

      // Ajustar horizontalmente se necessário (estimativa de 250px de largura do tooltip)
      const tooltipWidth = 250
      if (x + tooltipWidth / 2 > viewportWidth - 10) {
        x = viewportWidth - tooltipWidth / 2 - 10
      } else if (x - tooltipWidth / 2 < 10) {
        x = tooltipWidth / 2 + 10
      }

      setTooltipPosition({ x, y })
    }
  }

  function handleMouseLeave() {
    setHoveredDate(null)
    setTooltipPosition(null)
  }

  const daysOfWeek = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado']
  const daysOfWeekShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const hoveredEvents = hoveredDate ? getAllEventsForDate(hoveredDate) : []

  return (
    <Card className="p-4 md:p-6">
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Mês anterior"
          >
            <FaChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Próximo mês"
          >
            <FaChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-1 min-w-[600px]">
          {/* Header - Dias da semana */}
          <div className="hidden sm:contents">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="text-center py-2 text-xs font-medium text-white bg-gray-700 rounded"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="contents sm:hidden">
            {daysOfWeekShort.map((day) => (
              <div
                key={day}
                className="text-center py-2 text-xs font-medium text-white bg-gray-700 rounded"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Dias do calendário */}
          {allDays.map((date, index) => {
            const isCurrentMonth = isSameMonth(date, currentDate)
            const isToday = isSameDay(date, new Date())
            const hasEventOnDay = hasEvent(date)
            const isHovered = hoveredDate && isSameDay(date, hoveredDate)

            return (
              <button
                key={index}
                onClick={() => onDateClick?.(date)}
                onMouseEnter={(e) => handleMouseEnter(date, e)}
                onMouseLeave={handleMouseLeave}
                className={`
                  aspect-square rounded-lg transition-all text-sm
                  ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-600'}
                  ${isToday ? 'bg-indigo-100 text-indigo-700 font-semibold ring-2 ring-indigo-300' : ''}
                  ${hasEventOnDay && !isToday ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : ''}
                  ${!hasEventOnDay && !isToday && isCurrentMonth ? 'hover:bg-gray-50' : ''}
                  ${isHovered ? 'ring-2 ring-indigo-400 scale-105' : ''}
                  flex flex-col items-center justify-center relative cursor-pointer
                `}
              >
                <span className="text-xs md:text-sm">{format(date, 'd')}</span>
                {hasEventOnDay && (
                  <span className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                    getAllEventsForDate(date).some(e => e.is_birthday) 
                      ? 'bg-pink-500' 
                      : 'bg-indigo-600'
                  }`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tooltip com informações do evento */}
      {hoveredDate && hoveredEvents.length > 0 && tooltipPosition && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
        >
          <div className="bg-gray-900 text-white rounded-lg shadow-xl p-4 max-w-xs min-w-[250px] mb-2 relative">
            {/* Seta do tooltip */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
            
            {hoveredEvents.map((event, idx) => (
              <div key={event.id} className={idx > 0 ? 'mt-4 pt-4 border-t border-gray-700' : ''}>
                <div className="flex items-start gap-2 mb-2">
                  <FaInfoCircle className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <h4 className="font-bold text-sm text-white">{event.title}</h4>
                </div>
                
                <div className="space-y-1.5 text-xs text-gray-300 pl-6">
                  <div className="flex items-center gap-2">
                    <FaClock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span>
                      {format(new Date(event.event_date), "dd 'de' MMMM", { locale: ptBR })}
                      {event.event_time && ` às ${event.event_time.substring(0, 5)}`}
                    </span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-start gap-2">
                      <FaMapMarkerAlt className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="break-words">{event.location}</span>
                    </div>
                  )}
                  
                  {event.event_type && (
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        event.event_type === 'birthday'
                          ? 'bg-pink-500/20 text-pink-300'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {getEventTypeLabel(event.event_type)}
                      </span>
                    </div>
                  )}
                  
                  {event.description && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{event.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legenda */}
      {events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
            <span>Evento</span>
          </div>
          {events.some(e => e.is_birthday) && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
              <span>Aniversário</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-100 rounded-full border border-indigo-600"></span>
            <span>Hoje</span>
          </div>
        </div>
      )}
    </Card>
  )
}

