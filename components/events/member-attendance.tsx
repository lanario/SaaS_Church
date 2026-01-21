'use client'

import { useState, useEffect } from 'react'
import { FaUserCheck, FaUserTimes, FaUserClock } from 'react-icons/fa'
import { confirmAttendance, getMemberEventAttendance } from '@/app/actions/events'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface MemberAttendanceProps {
  eventId: string
}

export function MemberAttendance({ eventId }: MemberAttendanceProps) {
  const [status, setStatus] = useState<'confirmed' | 'pending' | 'absent' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [memberId, setMemberId] = useState<string | null>(null)

  useEffect(() => {
    async function loadMemberAttendance() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Buscar member_id do usuário
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('church_id')
        .eq('id', user.id)
        .single()

      if (!profile) return

      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .eq('church_id', profile.church_id)
        .single()

      if (!member) return

      setMemberId(member.id)

      // Buscar status de confirmação
      const { data: attendance } = await getMemberEventAttendance(member.id, eventId)
      if (attendance) {
        setStatus(attendance.status as 'confirmed' | 'pending' | 'absent')
      } else {
        setStatus('pending')
      }

      setIsLoading(false)
    }

    loadMemberAttendance()
  }, [eventId])

  async function handleConfirm(newStatus: 'confirmed' | 'pending' | 'absent') {
    if (!memberId) {
      alert('Você precisa ser um membro para confirmar presença')
      return
    }

    setIsSaving(true)
    try {
      const result = await confirmAttendance(eventId, memberId, newStatus)
      if (result?.error) {
        alert(result.error)
      } else {
        setStatus(newStatus)
      }
    } catch (error) {
      alert('Erro ao confirmar presença')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!memberId) {
    return null
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-bold text-gray-800 mb-4">Confirmar Presença</h3>
        <div className="flex gap-2">
          <Button
            variant={status === 'confirmed' ? 'primary' : 'outline'}
            onClick={() => handleConfirm('confirmed')}
            disabled={isSaving}
            className="flex-1"
          >
            <FaUserCheck className="mr-2" />
            Confirmar
          </Button>
          <Button
            variant={status === 'absent' ? 'primary' : 'outline'}
            onClick={() => handleConfirm('absent')}
            disabled={isSaving}
            className="flex-1"
          >
            <FaUserTimes className="mr-2" />
            Ausente
          </Button>
        </div>
        {status && (
          <p className="text-sm text-gray-500 mt-3 text-center">
            Status atual: <span className="font-semibold">
              {status === 'confirmed' && 'Confirmado'}
              {status === 'absent' && 'Ausente'}
              {status === 'pending' && 'Pendente'}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}

