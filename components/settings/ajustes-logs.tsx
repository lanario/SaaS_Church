'use client'

import { useState, useEffect } from 'react'
import { getSystemLogs, clearSystemLogs, type SystemLog } from '@/app/actions/logs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FaTrash, FaSpinner, FaUser, FaCalendar, FaInfoCircle } from 'react-icons/fa'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function AjustesLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isClearing, setIsClearing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadLogs() {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getSystemLogs(200)
      if (result.error) {
        setError(result.error)
      } else {
        setLogs(result.data || [])
      }
    } catch (err) {
      setError('Erro ao carregar logs')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  async function handleClearLogs() {
    if (!confirm('Tem certeza que deseja limpar TODOS os logs? Esta ação não pode ser desfeita.')) {
      return
    }

    setIsClearing(true)
    setError(null)
    try {
      const result = await clearSystemLogs()
      if (result.error) {
        setError(result.error)
      } else {
        await loadLogs()
        alert('Logs limpos com sucesso!')
      }
    } catch (err) {
      setError('Erro ao limpar logs')
    } finally {
      setIsClearing(false)
    }
  }

  function getActionColor(actionType: string) {
    const colors: Record<string, string> = {
      create: 'bg-green-500/20 text-green-400 border-green-500/30',
      update: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      delete: 'bg-red-500/20 text-red-400 border-red-500/30',
      view: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      login: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      logout: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      export: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      import: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    }
    return colors[actionType] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }

  function getEntityIcon(entityType: string) {
    const icons: Record<string, string> = {
      member: '👤',
      revenue: '💰',
      expense: '💸',
      event: '📅',
      user: '👥',
      church: '⛪',
      category: '📁',
      permission: '🔐',
      invite: '✉️',
      report: '📊',
    }
    return icons[entityType] || '📝'
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de limpar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Logs do Sistema</h2>
          <p className="text-slate-400 mt-1">
            Histórico de todas as ações realizadas no sistema
          </p>
        </div>
        <Button
          onClick={handleClearLogs}
          disabled={isClearing || logs.length === 0}
          variant="outline"
          className="flex items-center gap-2 text-red-400 border-red-500/30 hover:bg-red-900/20 hover:border-red-500"
        >
          {isClearing ? (
            <>
              <FaSpinner className="animate-spin" />
              Limpando...
            </>
          ) : (
            <>
              <FaTrash />
              Limpar Todos os Logs
            </>
          )}
        </Button>
      </div>

      {error && (
        <Card className="bg-red-900/30 border-red-700">
          <CardContent className="p-4">
            <p className="text-red-300 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white">Histórico de Ações</h3>
            <span className="text-sm text-slate-400">
              {logs.length} {logs.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <FaSpinner className="animate-spin text-indigo-400 text-2xl" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FaInfoCircle className="text-slate-400 text-4xl mx-auto mb-4" />
              <p className="text-slate-400">Nenhum log registrado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getEntityIcon(log.entity_type)}</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${getActionColor(log.action_type)}`}>
                          {log.action_type.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400 px-2 py-1 rounded bg-slate-700/50">
                          {log.entity_type}
                        </span>
                      </div>
                      
                      <p className="text-white mb-3">{log.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        {log.user_profiles ? (
                          <div className="flex items-center gap-2">
                            <FaUser className="text-xs" />
                            <span>{log.user_profiles.full_name} ({log.user_profiles.email})</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <FaUser className="text-xs" />
                            <span>Sistema</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <FaCalendar className="text-xs" />
                          <span>
                            {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
