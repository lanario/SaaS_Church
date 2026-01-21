'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FaUser, FaEdit, FaTrash, FaUserCheck, FaUserTimes } from 'react-icons/fa'
import { deleteMember } from '@/app/actions/members'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card } from '@/components/ui/card'

interface Member {
  id: string
  full_name: string
  email?: string | null
  phone?: string | null
  status: string
  member_since?: string | null
  avatar_url?: string | null
  user_id?: string | null
}

interface MemberListProps {
  members: Member[]
}

export function MemberList({ members }: MemberListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este membro?')) {
      return
    }

    setDeletingId(id)
    try {
      await deleteMember(id)
      window.location.reload()
    } catch (error) {
      alert('Erro ao excluir membro')
    } finally {
      setDeletingId(null)
    }
  }

  function getStatusBadge(status: string) {
    const badges = {
      active: {
        label: 'Ativo',
        color: 'bg-green-100 text-green-700',
        icon: FaUserCheck,
      },
      inactive: {
        label: 'Inativo',
        color: 'bg-gray-100 text-gray-700',
        icon: FaUserTimes,
      },
      visitor: {
        label: 'Visitante',
        color: 'bg-blue-100 text-blue-700',
        icon: FaUser,
      },
    }

    const badge = badges[status as keyof typeof badges] || badges.active
    const Icon = badge.icon

    return (
      <span className={`${badge.color} px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
        <Icon className="text-xs" />
        {badge.label}
      </span>
    )
  }

  if (members.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">Nenhum membro cadastrado ainda.</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {members.map((member) => (
        <Card key={member.id} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.full_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <FaUser className="text-indigo-600 text-2xl" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-gray-800">{member.full_name}</h3>
                {member.email && (
                  <p className="text-sm text-gray-500">{member.email}</p>
                )}
                {member.phone && (
                  <p className="text-sm text-gray-500">{member.phone}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            {getStatusBadge(member.status)}
            {member.member_since && (
              <p className="text-xs text-gray-500">
                Desde {format(new Date(member.member_since), 'MMM yyyy', { locale: ptBR })}
              </p>
            )}
          </div>

          {member.user_id ? (
            <div className="mb-4">
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                Conta criada
              </span>
            </div>
          ) : (
            <div className="mb-4">
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                Sem conta
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <Link
              href={`/membros/${member.id}`}
              className="flex-1 text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Ver Detalhes
            </Link>
            <button
              onClick={() => handleDelete(member.id)}
              disabled={deletingId === member.id}
              className="px-4 py-2 text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              <FaTrash />
            </button>
          </div>
        </Card>
      ))}
    </div>
  )
}

