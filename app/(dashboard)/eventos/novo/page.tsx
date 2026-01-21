import { EventForm } from '@/components/events/event-form'

export default function NovoEventoPage() {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Novo Evento</h1>
        <EventForm />
      </div>
    </div>
  )
}

