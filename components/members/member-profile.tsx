'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaEdit, FaPlus, FaTimes } from 'react-icons/fa'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreateMemberAccountModal } from './create-member-account-modal'
import { AvatarUpload } from './avatar-upload'

interface Member {
  id: string
  full_name: string
  email?: string | null
  phone?: string | null
  birth_date?: string | null
  member_since?: string | null
  status: string
  notes?: string | null
  avatar_url?: string | null
  user_id?: string | null
}

interface Contribution {
  id: string
  amount: number
  description?: string | null
  transaction_date: string
  revenue_categories?: { name: string; color: string } | null
}

interface MemberProfileProps {
  member: Member
  contributions: Contribution[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function getStatusBadge(status: string) {
  const badges = {
    active: { label: 'Ativo', color: 'bg-green-100 text-green-700' },
    inactive: { label: 'Inativo', color: 'bg-gray-100 text-gray-700' },
    visitor: { label: 'Visitante', color: 'bg-blue-100 text-blue-700' },
  }

  const badge = badges[status as keyof typeof badges] || badges.active

  return (
    <span className={`${badge.color} px-3 py-1 rounded-full text-sm font-semibold`}>
      {badge.label}
    </span>
  )
}

export function MemberProfile({ member, contributions }: MemberProfileProps) {
  const router = useRouter()
  const [showCreateAccount, setShowCreateAccount] = useState(false)

  const totalContributions = contributions.reduce(
    (sum, c) => sum + Number(c.amount),
    0
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-6">
          <AvatarUpload memberId={member.id} currentAvatar={member.avatar_url} />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{member.full_name}</h1>
            <div className="flex items-center gap-3 mt-2">
              {getStatusBadge(member.status)}
              {member.user_id ? (
                <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  Conta criada
                </span>
              ) : (
                <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                  Sem conta
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!member.user_id && (
            <Button onClick={() => setShowCreateAccount(true)}>
              Criar Conta
            </Button>
          )}
          <Link href={`/membros/${member.id}/editar`}>
            <Button variant="outline" className="flex items-center gap-2">
              <FaEdit />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* Informações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-bold text-gray-800">Informações Pessoais</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {member.email && (
              <div className="flex items-center gap-3">
                <FaEnvelope className="text-gray-400" />
                <span className="text-gray-700">{member.email}</span>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-3">
                <FaPhone className="text-gray-400" />
                <span className="text-gray-700">{member.phone}</span>
              </div>
            )}
            {member.birth_date && (
              <div className="flex items-center gap-3">
                <FaCalendar className="text-gray-400" />
                <span className="text-gray-700">
                  {format(new Date(member.birth_date), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            )}
            {member.member_since && (
              <div className="flex items-center gap-3">
                <FaUser className="text-gray-400" />
                <span className="text-gray-700">
                  Membro desde {format(new Date(member.member_since), 'MMM yyyy', { locale: ptBR })}
                </span>
              </div>
            )}
            {member.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">{member.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-bold text-gray-800">Estatísticas</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total de Contribuições</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalContributions)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Número de Contribuições</p>
                <p className="text-2xl font-bold text-gray-800">
                  {contributions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Contribuições */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-gray-800">Histórico de Contribuições</h3>
        </CardHeader>
        <CardContent>
          {contributions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma contribuição registrada
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Categoria</th>
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contributions.map((contribution) => (
                    <tr key={contribution.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {format(new Date(contribution.transaction_date), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {contribution.revenue_categories?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {contribution.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600 text-right">
                        {formatCurrency(Number(contribution.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateAccount && (
        <CreateMemberAccountModal
          memberId={member.id}
          memberEmail={member.email || ''}
          onClose={() => setShowCreateAccount(false)}
        />
      )}
    </div>
  )
}

