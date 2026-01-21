'use client'

import { useState, useEffect } from 'react'
import { FaWhatsapp, FaTimes, FaCheckCircle, FaUser } from 'react-icons/fa'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getMembers } from '@/app/actions/members'

interface Event {
  id: string
  title: string
  event_date: string
  event_time?: string | null
  location?: string | null
  whatsapp_message?: string | null
}

interface Member {
  id: string
  full_name: string
  phone?: string | null
}

interface WhatsAppSendModalProps {
  event: Event
  onClose: () => void
}

export function WhatsAppSendModal({ event, onClose }: WhatsAppSendModalProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    async function loadMembers() {
      const { data } = await getMembers()
      if (data) {
        setMembers(data.filter(m => m.phone)) // Apenas membros com telefone
      }
      setIsLoading(false)
    }
    loadMembers()
  }, [])

  function toggleMember(memberId: string) {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  function toggleSelectAll() {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(members.map(m => m.id))
    }
  }

  async function handleSend() {
    if (selectedMembers.length === 0) {
      alert('Selecione pelo menos um membro')
      return
    }

    if (!event.whatsapp_message) {
      alert('Este evento não tem mensagem configurada')
      return
    }

    setIsSending(true)

    // Formatar mensagem com dados do evento
    let message = event.whatsapp_message
      .replace('[Título]', event.title)
      .replace('[Data]', new Date(event.event_date).toLocaleDateString('pt-BR'))
      .replace('[Horário]', event.event_time || '')
      .replace('[Local]', event.location || '')

    // Criar link do WhatsApp
    const encodedMessage = encodeURIComponent(message)
    
    // Abrir WhatsApp Web para cada membro selecionado
    for (const memberId of selectedMembers) {
      const member = members.find(m => m.id === memberId)
      if (member && member.phone) {
        // Remover caracteres não numéricos do telefone
        const phone = member.phone.replace(/\D/g, '')
        // Abrir WhatsApp Web
        window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank')
        // Pequeno delay para não abrir todas as abas de uma vez
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    setTimeout(() => {
      setIsSending(false)
      setSent(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    }, 500)
  }

  if (sent) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="text-green-600 text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Mensagens Abertas!</h3>
            <p className="text-gray-600">
              Os links do WhatsApp foram abertos. Complete o envio manualmente.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FaWhatsapp className="text-green-500 text-xl" />
            <h3 className="text-xl font-bold text-gray-800">Enviar Lembrete via WhatsApp</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-800 mb-2">Mensagem que será enviada:</p>
              <p className="text-green-700 whitespace-pre-wrap">
                {event.whatsapp_message
                  ?.replace('[Título]', event.title)
                  .replace('[Data]', new Date(event.event_date).toLocaleDateString('pt-BR'))
                  .replace('[Horário]', event.event_time || '')
                  .replace('[Local]', event.location || '') || 'Mensagem não configurada'}
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-semibold text-gray-700">
                  Selecione os membros ({selectedMembers.length} selecionados)
                </p>
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {selectedMembers.length === members.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Carregando membros...</div>
              ) : members.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">
                    Nenhum membro com telefone cadastrado. Adicione telefones aos membros para enviar mensagens.
                  </p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-4">
                  {members.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => toggleMember(member.id)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <FaUser className="text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{member.full_name}</p>
                        <p className="text-xs text-gray-500">{member.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Nota:</strong> Esta funcionalidade abrirá o WhatsApp Web com a mensagem pronta para cada membro selecionado.
                  Para uma integração automática completa, será necessário configurar uma API do WhatsApp (como Twilio ou WhatsApp Business API).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleSend}
                disabled={isSending || selectedMembers.length === 0 || members.length === 0}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                <FaWhatsapp className="mr-2" />
                {isSending ? 'Abrindo WhatsApp...' : `Abrir WhatsApp (${selectedMembers.length})`}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
