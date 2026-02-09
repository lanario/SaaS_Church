'use client'

import Link from 'next/link'
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaEdit, FaMapMarkerAlt } from 'react-icons/fa'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  zip_code?: string | null
  street?: string | null
  address_number?: string | null
  address_complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
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
    active: { label: 'Ativo', color: 'bg-green-500/20 text-green-400 border border-green-500/30' },
    inactive: { label: 'Inativo', color: 'bg-slate-500/20 text-slate-400 border border-slate-500/30' },
    visitor: { label: 'Visitante', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  }

  const badge = badges[status as keyof typeof badges] || badges.active

  return (
    <span className={`${badge.color} px-3 py-1 rounded-full text-sm font-semibold`}>
      {badge.label}
    </span>
  )
}

export function MemberProfile({ member, contributions }: MemberProfileProps) {
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
            <h1 className="text-3xl font-bold text-white">{member.full_name}</h1>
            <div className="flex items-center gap-3 mt-2">
              {getStatusBadge(member.status)}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
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
            <h3 className="font-bold text-white">Informações Pessoais</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {member.email && (
              <div className="flex items-center gap-3">
                <FaEnvelope className="text-white" />
                <span className="text-white">{member.email}</span>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-3">
                <FaPhone className="text-white" />
                <span className="text-white">{member.phone}</span>
              </div>
            )}
            {member.birth_date && (
              <div className="flex items-center gap-3">
                <FaCalendar className="text-white" />
                <span className="text-white">
                  {format(new Date(member.birth_date), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            )}
            {member.member_since && (
              <div className="flex items-center gap-3">
                <FaUser className="text-white" />
                <span className="text-white">
                  Membro desde {format(new Date(member.member_since), 'MMM yyyy', { locale: ptBR })}
                </span>
              </div>
            )}
            {member.notes && (
              <div className="pt-4 border-t border-slate-600">
                <p className="text-sm text-white">{member.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-bold text-white">Estatísticas</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-white">Total de Contribuições</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(totalContributions)}
                </p>
              </div>
              <div>
                <p className="text-sm text-white">Número de Contribuições</p>
                <p className="text-2xl font-bold text-white">
                  {contributions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Endereço */}
      {(member.zip_code || member.street || member.city) && (
        <Card>
          <CardHeader>
            <h3 className="font-bold text-white flex items-center gap-2">
              <FaMapMarkerAlt className="text-indigo-400" />
              Endereço
            </h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {member.street && (
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-white mt-1" />
                <div className="text-white">
                  <p>
                    {member.street}
                    {member.address_number && `, ${member.address_number}`}
                    {member.address_complement && ` - ${member.address_complement}`}
                  </p>
                  {member.neighborhood && (
                    <p className="text-white text-sm">{member.neighborhood}</p>
                  )}
                  {(member.city || member.state || member.zip_code) && (
                    <p className="text-white text-sm">
                      {[member.city, member.state].filter(Boolean).join(' - ')}
                      {member.zip_code && ` • CEP: ${member.zip_code}`}
                    </p>
                  )}
                </div>
              </div>
            )}
            {!member.street && member.zip_code && (
              <div className="flex items-center gap-3">
                <FaMapMarkerAlt className="text-white" />
                <span className="text-white">CEP: {member.zip_code}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Histórico de Contribuições */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-white">Histórico de Contribuições</h3>
        </CardHeader>
        <CardContent>
          {contributions.length === 0 ? (
            <p className="text-white text-center py-8">
              Nenhuma contribuição registrada
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-800 text-white text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Categoria</th>
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {contributions.map((contribution) => (
                    <tr key={contribution.id} className="hover:bg-slate-800/50">
                      <td className="px-6 py-4 text-sm text-white">
                        {format(new Date(contribution.transaction_date), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-white">
                        {contribution.revenue_categories?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-white">
                        {contribution.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-green-400 text-right">
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
    </div>
  )
}

