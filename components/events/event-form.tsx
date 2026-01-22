'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { eventSchema, type EventInput } from '@/lib/validations/events'
import { createEvent, updateEvent } from '@/app/actions/events'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FaCalendar, FaClock, FaMapMarkerAlt, FaWhatsapp } from 'react-icons/fa'

interface EventFormProps {
  event?: EventInput & { id?: string }
  mode?: 'create' | 'edit'
}

export function EventForm({ event, mode = 'create' }: EventFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: event || {
      eventType: 'worship',
      isPublic: true,
      eventDate: new Date().toISOString().split('T')[0],
    },
  })

  async function onSubmit(data: EventInput) {
    setIsLoading(true)
    setError(null)

    try {
      let result
      if (mode === 'edit' && event?.id) {
        result = await updateEvent(event.id, data)
      } else {
        result = await createEvent(data)
      }

      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/eventos')
        router.refresh()
      }
    } catch (err) {
      setError('Erro ao salvar evento. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Título *
            </label>
            <Input
              type="text"
              placeholder="Culto Dominical"
              error={errors.title?.message}
              {...register('title')}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Descrição
            </label>
            <textarea
              {...register('description')}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
              placeholder="Descrição do evento..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Data *
              </label>
              <Input
                type="date"
                icon={<FaCalendar />}
                error={errors.eventDate?.message}
                {...register('eventDate')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Horário
              </label>
              <Input
                type="time"
                icon={<FaClock />}
                error={errors.eventTime?.message}
                {...register('eventTime')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Local
            </label>
            <Input
              type="text"
              placeholder="Templo Principal"
              icon={<FaMapMarkerAlt />}
              error={errors.location?.message}
              {...register('location')}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tipo de Evento
            </label>
            <select
              {...register('eventType')}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="worship">Culto</option>
              <option value="meeting">Reunião</option>
              <option value="special">Especial</option>
              <option value="other">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Mensagem WhatsApp (Pré-pronta)
            </label>
            <div className="relative">
              <FaWhatsapp className="absolute left-4 top-3 text-green-500" />
              <textarea
                {...register('whatsappMessage')}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Olá! Lembrete: [Título] no dia [Data] às [Horário] no [Local]. Esperamos você!"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Esta mensagem será usada para enviar lembretes via WhatsApp
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Membros Estimados
              </label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                error={errors.estimatedMembers?.message}
                {...register('estimatedMembers', { valueAsNumber: true })}
              />
              <p className="mt-1 text-xs text-gray-500">
                Quantidade estimada de membros que participarão
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Visitantes Estimados
              </label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                error={errors.estimatedVisitors?.message}
                {...register('estimatedVisitors', { valueAsNumber: true })}
              />
              <p className="mt-1 text-xs text-gray-500">
                Quantidade estimada de visitantes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              {...register('isPublic')}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="isPublic" className="text-sm font-semibold text-slate-700">
              Evento público (visível para todos os membros)
            </label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Salvando...' : mode === 'edit' ? 'Atualizar Evento' : 'Salvar Evento'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

