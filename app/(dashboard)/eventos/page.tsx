import { getEvents } from '@/app/actions/events'
import { hasAcceptedInvite } from '@/app/actions/invites'
import { SimpleCalendar } from '@/components/dashboard/simple-calendar'
import { EventsList } from '@/components/events/events-list'
import { PastEvents } from '@/components/dashboard/past-events'
import { CreateEventButton } from '@/components/events/create-event-button'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { FaEnvelope, FaExclamationTriangle } from 'react-icons/fa'

export default async function EventosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Verificar se o usuário tem convite aceito ou é owner/treasurer
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .limit(1)
    .single()

  const isOwnerOrTreasurer = profile?.role === 'owner' || profile?.role === 'treasurer'
  
  // Se não for owner/treasurer, verificar convite
  let hasInvite = isOwnerOrTreasurer
  if (!hasInvite) {
    const inviteResult = await hasAcceptedInvite()
    hasInvite = inviteResult.hasInvite || false
  }

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const { data: events, error } = await getEvents(startOfMonth, endOfMonth, true)

  // Buscar eventos passados (últimos 30 dias) para o histórico
  const pastStartDate = new Date(today)
  pastStartDate.setDate(pastStartDate.getDate() - 30)
  const { data: pastEvents } = await getEvents(pastStartDate, today, false) // Sem aniversários

  // Se não tem convite, mostrar mensagem
  if (!hasInvite && !isOwnerOrTreasurer) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <Card className="p-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <FaExclamationTriangle className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Acesso aos Eventos</h2>
          </div>
          <p className="text-slate-300 mb-4">
            Para ter acesso aos eventos da igreja, você precisa receber um convite.
            Entre em contato com o administrador da igreja para solicitar um convite.
          </p>
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
            <p className="text-sm text-yellow-200">
              <strong>Importante:</strong> Assim que você receber e aceitar um convite, 
              você terá acesso completo aos eventos da igreja.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300">
          Erro ao carregar eventos: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Eventos</h1>
          <p className="text-slate-300 mt-1">Gerencie eventos e cultos da igreja</p>
        </div>
        <CreateEventButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SimpleCalendar events={events || []} />
        </div>
        <div className="space-y-8">
          <EventsList events={events || []} />
          <PastEvents events={pastEvents || []} noHover />
        </div>
      </div>
    </div>
  )
}

