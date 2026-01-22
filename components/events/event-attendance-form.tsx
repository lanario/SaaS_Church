'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateEventAttendance } from '@/app/actions/events'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface EventAttendanceFormProps {
  eventId: string
  estimatedMembers: number
  estimatedVisitors: number
  actualMembers: number | null
  actualVisitors: number | null
  eventDate: string
}

export function EventAttendanceForm({
  eventId,
  estimatedMembers,
  estimatedVisitors,
  actualMembers,
  actualVisitors,
  eventDate,
}: EventAttendanceFormProps) {
  const router = useRouter()
  const [members, setMembers] = useState(actualMembers?.toString() || '')
  const [visitors, setVisitors] = useState(actualVisitors?.toString() || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const eventDateObj = new Date(eventDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  eventDateObj.setHours(0, 0, 0, 0)
  const isPastEvent = eventDateObj < today

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const membersNum = parseInt(members, 10)
    const visitorsNum = parseInt(visitors, 10)

    if (isNaN(membersNum) || membersNum < 0) {
      setError('Quantidade de membros inválida')
      return
    }

    if (isNaN(visitorsNum) || visitorsNum < 0) {
      setError('Quantidade de visitantes inválida')
      return
    }

    setIsLoading(true)

    const result = await updateEventAttendance({
      eventId,
      actualMembers: membersNum,
      actualVisitors: visitorsNum,
    })

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setIsLoading(false)
    router.refresh()
  }

  const totalEstimated = estimatedMembers + estimatedVisitors
  const totalActual = members && visitors 
    ? parseInt(members, 10) + parseInt(visitors, 10)
    : null

  return (
    <Card>
      <CardHeader>
        <h3 className="font-bold text-gray-800">Presença Real do Evento</h3>
        <p className="text-sm text-gray-600 mt-1">
          {isPastEvent 
            ? 'Registre a presença real após o evento' 
            : 'Você poderá registrar a presença real após o evento acontecer'}
        </p>
      </CardHeader>
      <CardContent>
        {!isPastEvent && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
            Este evento ainda não aconteceu. Você poderá registrar a presença real após a data do evento.
          </div>
        )}

        {/* Informações Estimadas */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-3">Presença Estimada</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Membros:</span>
              <span className="ml-2 font-semibold text-gray-800">{estimatedMembers}</span>
            </div>
            <div>
              <span className="text-gray-600">Visitantes:</span>
              <span className="ml-2 font-semibold text-gray-800">{estimatedVisitors}</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-gray-200">
              <span className="text-gray-600">Total Estimado:</span>
              <span className="ml-2 font-bold text-gray-800">{totalEstimated}</span>
            </div>
          </div>
        </div>

        {isPastEvent && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                Presença registrada com sucesso!
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Membros Presentes
                </label>
                <Input
                  type="number"
                  min="0"
                  value={members}
                  onChange={(e) => setMembers(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Visitantes Presentes
                </label>
                <Input
                  type="number"
                  min="0"
                  value={visitors}
                  onChange={(e) => setVisitors(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            {totalActual !== null && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Total Real:</span>
                  <span className="font-bold text-indigo-700">{totalActual}</span>
                </div>
                {totalActual !== totalEstimated && (
                  <div className={`mt-2 text-xs ${
                    totalActual > totalEstimated ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {totalActual > totalEstimated 
                      ? `+${totalActual - totalEstimated} pessoas a mais que o estimado`
                      : `${totalEstimated - totalActual} pessoas a menos que o estimado`
                    }
                  </div>
                )}
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Salvando...' : 'Salvar Presença Real'}
            </Button>
          </form>
        )}

        {!isPastEvent && actualMembers !== null && actualVisitors !== null && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Presença Real Registrada</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700">Membros:</span>
                <span className="ml-2 font-semibold text-green-800">{actualMembers}</span>
              </div>
              <div>
                <span className="text-green-700">Visitantes:</span>
                <span className="ml-2 font-semibold text-green-800">{actualVisitors}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-green-200">
                <span className="text-green-700">Total Real:</span>
                <span className="ml-2 font-bold text-green-800">{actualMembers + actualVisitors}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

