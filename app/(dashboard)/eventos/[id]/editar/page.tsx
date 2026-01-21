import { getEvent } from '@/app/actions/events'
import { notFound } from 'next/navigation'
import { EventForm } from '@/components/events/event-form'

export default async function EditarEventoPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: event, error } = await getEvent(params.id)

  if (error || !event) {
    notFound()
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Editar Evento</h1>
        <EventForm
          event={{
            id: event.id,
            title: event.title,
            description: event.description || '',
            eventDate: event.event_date,
            eventTime: event.event_time || '',
            location: event.location || '',
            eventType: event.event_type as 'worship' | 'meeting' | 'special' | 'other',
            whatsappMessage: event.whatsapp_message || '',
            isPublic: event.is_public,
          }}
          mode="edit"
        />
      </div>
    </div>
  )
}

