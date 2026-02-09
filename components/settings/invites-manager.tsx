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
  invite_type?: 'collaborator' | 'member'
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
      invite_type: 'collaborator',
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
      const inviteLink = `${window.location.origin}/convite/${result.invite?.token}`
      setMessage({ 
        type: 'success', 
        text: `Convite criado com sucesso! Link: ${inviteLink} (copie e envie para o convidado)` 
      })
      
      // Tentar enviar email (magic link para colaboradores)
      if (data.invite_type === 'collaborator') {
        try {
          const emailResult = await fetch('/api/invites/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: data.email,
              token: result.invite?.token,
              inviteType: data.invite_type,
            }),
          })
          
          if (emailResult.ok) {
            const emailData = await emailResult.json()
            if (emailData.magicLinkSent) {
              setMessage({ 
                type: 'success', 
                text: `Convite criado e magic link enviado com sucesso para ${data.email}! O colaborador receberá um email com link de login automático.` 
              })
            } else {
              setMessage({ 
                type: 'success', 
                text: `Convite criado! Link: ${inviteLink} (Copie e envie para ${data.email})` 
              })
            }
          } else {
            await emailResult.json()
            setMessage({ 
              type: 'success', 
              text: `Convite criado! Link: ${inviteLink} (Email não pôde ser enviado automaticamente. Copie o link e envie manualmente.)` 
            })
          }
        } catch (error) {
          // Se falhar o envio de email, apenas mostrar o link
          setMessage({ 
            type: 'success', 
            text: `Convite criado! Link: ${inviteLink} (Copie e envie para ${data.email})` 
          })
        }
      } else {
        // Para membros, apenas mostrar o link
        setMessage({ 
          type: 'success', 
          text: `Convite criado! Link: ${inviteLink} (Copie e envie para ${data.email})` 
        })
      }
      
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
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      accepted: 'bg-green-500/20 text-green-300 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
      expired: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
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
      <Card className="p-6 bg-slate-700 border border-slate-600">
        <div className="text-center py-8">
          <p className="text-white">Carregando convites...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-slate-700 border border-slate-600">
      <div className="flex items-center gap-3 mb-6">
        <FaEnvelope className="w-6 h-6 text-indigo-400" />
        <h2 className="text-xl font-bold text-white">Gerenciar Convites</h2>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-900/30 text-green-300 border border-green-500/30'
              : 'bg-red-900/30 text-red-300 border border-red-500/30'
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
      <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
        <h3 className="font-semibold text-white mb-4">Criar Novo Convite</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
              E-mail do Convidado
            </label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="convidado@exemplo.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="invite_type" className="block text-sm font-medium text-white mb-1">
              Tipo de Convite
            </label>
            <select
              id="invite_type"
              {...register('invite_type')}
              className="w-full px-3 py-2 border border-slate-500 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="collaborator" className="bg-slate-700 text-white">Colaborador (Acesso completo ao sistema)</option>
              <option value="member" className="bg-slate-700 text-white">Membro (Apenas receberá lembretes via WhatsApp)</option>
            </select>
            {errors.invite_type && (
              <p className="mt-1 text-sm text-red-300">{errors.invite_type.message}</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Colaboradores terão o mesmo acesso que você. Membros apenas receberão lembretes de eventos.
            </p>
          </div>

          <div>
            <label htmlFor="expires_in_days" className="block text-sm font-medium text-white mb-1">
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
              <p className="mt-1 text-sm text-red-300">{errors.expires_in_days.message}</p>
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
        <h3 className="font-semibold text-white mb-4">Convites Enviados</h3>
        {invites.length === 0 ? (
          <div className="text-center py-8 border border-slate-600 rounded-lg bg-slate-800/50">
            <p className="text-white">Nenhum convite criado ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="border border-slate-600 rounded-lg p-4 flex items-center justify-between bg-slate-800/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-white">{invite.email}</span>
                    {getStatusBadge(invite.status)}
                    {invite.invite_type && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invite.invite_type === 'collaborator'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {invite.invite_type === 'collaborator' ? 'Colaborador' : 'Membro'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-300 space-y-1">
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

