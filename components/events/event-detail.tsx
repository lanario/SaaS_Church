'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaEdit, FaTrash, FaWhatsapp, FaUserCheck, FaUserTimes, FaUserClock } from 'react-icons/fa'
import { deleteEvent } from '@/app/actions/events'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AttendanceList } from './attendance-list'
import { WhatsAppSendModal } from './whatsapp-send-modal'
import { MemberAttendance } from './member-attendance'
import { EventAttendanceForm } from './event-attendance-form'

interface Event {
  id: string
  title: string
  description?: string | null
  event_date: string
  event_time?: string | null
  location?: string | null
  event_type: string
  whatsapp_message?: string | null
  is_public: boolean
  created_by?: string | null
  estimated_members?: number | null
  estimated_visitors?: number | null
  actual_members?: number | null
  actual_visitors?: number | null
}

interface Attendance {
  id: string
  status: string
  confirmed_at?: string | null
  members: {
    id: string
    full_name: string
    avatar_url?: string | null
  }
}

interface EventDetailProps {
  event: Event
  attendances: Attendance[]
  stats: {
    confirmed: number
    pending: number
    absent: number
    total: number
  }
}

function getEventTypeLabel(type: string) {
  const types = {
    worship: { label: 'Culto', color: 'bg-indigo-100 text-indigo-700' },
    meeting: { label: 'Reunião', color: 'bg-blue-100 text-blue-700' },
    special: { label: 'Especial', color: 'bg-purple-100 text-purple-700' },
    other: { label: 'Outro', color: 'bg-gray-100 text-gray-700' },
  }
  return types[type as keyof typeof types] || types.other
}

export function EventDetail({ event, attendances, stats }: EventDetailProps) {
  const router = useRouter()
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir este evento?')) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteEvent(event.id)
      router.push('/eventos')
      router.refresh()
    } catch (error) {
      alert('Erro ao excluir evento')
    } finally {
      setIsDeleting(false)
    }
  }

  const eventType = getEventTypeLabel(event.event_type)
  const eventDate = new Date(event.event_date)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{event.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${eventType.color}`}>
              {eventType.label}
            </span>
            {event.is_public ? (
              <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                Público
              </span>
            ) : (
              <span className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                Privado
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {event.whatsapp_message && (
            <Button onClick={() => setShowWhatsAppModal(true)}>
              <FaWhatsapp className="mr-2" />
              Enviar Lembrete
            </Button>
          )}
          <Link href={`/eventos/${event.id}/editar`}>
            <Button variant="outline">
              <FaEdit className="mr-2" />
              Editar
            </Button>
          </Link>
          <Button variant="outline" onClick={handleDelete} disabled={isDeleting}>
            <FaTrash className="mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Informações do Evento */}
      <Card>
        <CardContent className="p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Data</p>
                <p className="font-semibold text-gray-800">
                  {format(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {event.event_time && (
              <div className="flex items-center gap-3">
                <FaClock className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Horário</p>
                  <p className="font-semibold text-gray-800">{event.event_time}</p>
                </div>
              </div>
            )}

            {event.location && (
              <div className="flex items-center gap-3">
                <FaMapMarkerAlt className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Local</p>
                  <p className="font-semibold text-gray-800">{event.location}</p>
                </div>
              </div>
            )}

            {event.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Descrição</p>
                <p className="text-gray-700">{event.description}</p>
              </div>
            )}

            {event.whatsapp_message && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                  <FaWhatsapp className="text-green-500" />
                  Mensagem WhatsApp
                </p>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {event.whatsapp_message}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas de Presença */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-gray-800">Estatísticas de Presença</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <FaUserCheck className="text-green-600 text-2xl mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">{stats.confirmed}</p>
              <p className="text-sm text-green-600">Confirmados</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <FaUserClock className="text-amber-600 text-2xl mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
              <p className="text-sm text-amber-600">Pendentes</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <FaUserTimes className="text-red-600 text-2xl mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
              <p className="text-sm text-red-600">Ausentes</p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <FaCalendarAlt className="text-indigo-600 text-2xl mx-auto mb-2" />
              <p className="text-2xl font-bold text-indigo-700">{stats.total}</p>
              <p className="text-sm text-indigo-600">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Presença Real */}
      <EventAttendanceForm
        eventId={event.id}
        estimatedMembers={event.estimated_members || 0}
        estimatedVisitors={event.estimated_visitors || 0}
        actualMembers={event.actual_members ?? null}
        actualVisitors={event.actual_visitors ?? null}
        eventDate={event.event_date}
      />

      {/* Confirmação de Presença (para membros) */}
      <MemberAttendance eventId={event.id} />

      {/* Lista de Confirmações */}
      <AttendanceList eventId={event.id} attendances={attendances} />

      {showWhatsAppModal && (
        <WhatsAppSendModal
          event={event}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}
    </div>
  )
}

