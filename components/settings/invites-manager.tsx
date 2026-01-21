'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createInvite, getChurchInvites, cancelInvite } from '@/app/actions/invites'
import { createInviteSchema } from '@/lib/validations/invites'
import type { CreateInviteInput } from '@/lib/validations/invites'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { FaEnvelope, FaCheck, FaTimes, FaTrash, FaCopy } from 'react-icons/fa'

interface Invite {
  id: string
  email: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  token: string
  expires_at: string
  created_at: string
  accepted_at?: string | null
}

export function InvitesManager() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateInviteInput>({
    resolver: zodResolver(createInviteSchema),
    defaultValues: {
      expires_in_days: 7,
    },
  })

  useEffect(() => {
    loadInvites()
  }, [])

  async function loadInvites() {
    setLoading(true)
    const result = await getChurchInvites()
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else if (result.invites) {
      setInvites(result.invites as Invite[])
    }
    
    setLoading(false)
  }

  async function onSubmit(data: CreateInviteInput) {
    setIsSubmitting(true)
    setMessage(null)

    const result = await createInvite(data)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Convite criado com sucesso!' })
      reset()
      await loadInvites()
    }
    
    setIsSubmitting(false)
  }

  async function handleCancel(inviteId: string) {
    if (!confirm('Tem certeza que deseja cancelar este convite?')) {
      return
    }

    setMessage(null)
    const result = await cancelInvite(inviteId)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Convite cancelado com sucesso!' })
      await loadInvites()
    }
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/convite/${token}`
    navigator.clipboard.writeText(url)
    setMessage({ type: 'success', text: 'Link do convite copiado para a área de transferência!' })
  }

  function getStatusBadge(status: string) {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      accepted: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      expired: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    
    const labels = {
      pending: 'Pendente',
      accepted: 'Aceito',
      rejected: 'Rejeitado',
      expired: 'Expirado',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badges[status as keyof typeof badges] || badges.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">Carregando convites...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FaEnvelope className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">Gerenciar Convites</h2>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <FaCheck className="w-5 h-5" />
          ) : (
            <FaTimes className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Formulário para criar convite */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Criar Novo Convite</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mail do Convidado
            </label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="convidado@exemplo.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="expires_in_days" className="block text-sm font-medium text-gray-700 mb-1">
              Válido por (dias)
            </label>
            <Input
              id="expires_in_days"
              type="number"
              min={1}
              max={30}
              {...register('expires_in_days', { valueAsNumber: true })}
              placeholder="7"
            />
            {errors.expires_in_days && (
              <p className="mt-1 text-sm text-red-600">{errors.expires_in_days.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Convite'}
            </Button>
          </div>
        </form>
      </div>

      {/* Lista de convites */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Convites Enviados</h3>
        {invites.length === 0 ? (
          <div className="text-center py-8 border border-gray-200 rounded-lg">
            <p className="text-gray-600">Nenhum convite criado ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-gray-900">{invite.email}</span>
                    {getStatusBadge(invite.status)}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Criado em: {new Date(invite.created_at).toLocaleDateString('pt-BR')}</p>
                    <p>Expira em: {new Date(invite.expires_at).toLocaleDateString('pt-BR')}</p>
                    {invite.accepted_at && (
                      <p>Aceito em: {new Date(invite.accepted_at).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                  {invite.status === 'pending' && (
                    <div className="mt-2">
                      <Button
                        onClick={() => copyInviteLink(invite.token)}
                        variant="outline"
                        size="sm"
                      >
                        <FaCopy className="w-4 h-4 mr-2" />
                        Copiar Link do Convite
                      </Button>
                    </div>
                  )}
                </div>
                {invite.status === 'pending' && (
                  <Button
                    onClick={() => handleCancel(invite.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <FaTrash className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

