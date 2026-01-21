import { getEvent, getEventAttendances, getEventStats } from '@/app/actions/events'
import { notFound } from 'next/navigation'
import { EventDetail } from '@/components/events/event-detail'

export default async function EventDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: event, error } = await getEvent(params.id)

  if (error || !event) {
    notFound()
  }

  const { data: attendances } = await getEventAttendances(params.id)
  const { data: stats } = await getEventStats(params.id)

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <EventDetail 
        event={event} 
        attendances={attendances || []} 
        stats={stats || { confirmed: 0, pending: 0, absent: 0, total: 0 }}
      />
    </div>
  )
}

