'use client'

import { FaUserCheck, FaUserTimes, FaUserClock } from 'react-icons/fa'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface Attendance {
  id: string
  status: string
  confirmed_at?: string | null
  members: {
    id: string
    full_name: string
    avatar_url?: string | null
  }
}

interface AttendanceListProps {
  attendances: Attendance[]
}

function getStatusInfo(status: string) {
  const statuses = {
    confirmed: {
      label: 'Confirmado',
      icon: FaUserCheck,
      color: 'text-green-600 bg-green-50',
      borderColor: 'border-green-200',
    },
    pending: {
      label: 'Pendente',
      icon: FaUserClock,
      color: 'text-amber-600 bg-amber-50',
      borderColor: 'border-amber-200',
    },
    absent: {
      label: 'Ausente',
      icon: FaUserTimes,
      color: 'text-red-600 bg-red-50',
      borderColor: 'border-red-200',
    },
  }
  return statuses[status as keyof typeof statuses] || statuses.pending
}

export function AttendanceList({ attendances }: AttendanceListProps) {
  if (attendances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-bold text-gray-800">Confirmados</h3>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Ainda não há confirmações de presença
          </p>
        </CardContent>
      </Card>
    )
  }

  const groupedByStatus = {
    confirmed: attendances.filter(a => a.status === 'confirmed'),
    pending: attendances.filter(a => a.status === 'pending'),
    absent: attendances.filter(a => a.status === 'absent'),
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-bold text-gray-800">Lista de Confirmações</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {['confirmed', 'pending', 'absent'].map((status) => {
            const group = groupedByStatus[status as keyof typeof groupedByStatus]
            if (group.length === 0) return null

            const statusInfo = getStatusInfo(status)
            const Icon = statusInfo.icon

            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={statusInfo.color.split(' ')[0]} />
                  <h4 className="font-semibold text-gray-700">{statusInfo.label}s ({group.length})</h4>
                </div>
                <div className="space-y-2">
                  {group.map((attendance) => (
                    <div
                      key={attendance.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${statusInfo.borderColor} ${statusInfo.color.split(' ')[1]}`}
                    >
                      <div className="flex items-center gap-3">
                        {attendance.members.avatar_url ? (
                          <img
                            src={attendance.members.avatar_url}
                            alt={attendance.members.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold text-sm">
                              {attendance.members.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">{attendance.members.full_name}</p>
                          {attendance.confirmed_at && (
                            <p className="text-xs text-gray-500">
                              Confirmado em {format(new Date(attendance.confirmed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

