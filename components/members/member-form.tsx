'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { memberSchema, type MemberInput } from '@/lib/validations/members'
import { createMember, updateMember } from '@/app/actions/members'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FaUser, FaEnvelope, FaPhone, FaCalendar } from 'react-icons/fa'

interface MemberFormProps {
  member?: MemberInput & { id?: string }
  mode?: 'create' | 'edit'
}

export function MemberForm({ member, mode = 'create' }: MemberFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MemberInput>({
    resolver: zodResolver(memberSchema),
    defaultValues: member || {
      status: 'active',
    },
  })

  async function onSubmit(data: MemberInput) {
    setIsLoading(true)
    setError(null)

    try {
      let result
      if (mode === 'edit' && member?.id) {
        result = await updateMember(member.id, data)
      } else {
        result = await createMember(data)
      }

      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/membros')
        router.refresh()
      }
    } catch (err) {
      setError('Erro ao salvar membro. Tente novamente.')
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
              Nome Completo *
            </label>
            <Input
              type="text"
              placeholder="João da Silva"
              icon={<FaUser />}
              error={errors.fullName?.message}
              {...register('fullName')}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              E-mail
            </label>
            <Input
              type="email"
              placeholder="joao@email.com"
              icon={<FaEnvelope />}
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Telefone
            </label>
            <Input
              type="tel"
              placeholder="(11) 98765-4321"
              icon={<FaPhone />}
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Data de Nascimento
              </label>
              <Input
                type="date"
                icon={<FaCalendar />}
                error={errors.birthDate?.message}
                {...register('birthDate')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Membro desde
              </label>
              <Input
                type="date"
                icon={<FaCalendar />}
                error={errors.memberSince?.message}
                {...register('memberSince')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Status
            </label>
            <select
              {...register('status')}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="visitor">Visitante</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Observações
            </label>
            <textarea
              {...register('notes')}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Observações sobre o membro..."
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Salvando...' : mode === 'edit' ? 'Atualizar Membro' : 'Salvar Membro'}
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

