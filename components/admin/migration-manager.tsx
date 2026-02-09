'use client'

import { useState } from 'react'
import { initializeDatabase, runMigrations } from '@/app/actions/migrations'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * Componente para gerenciar migrações do banco de dados
 * Apenas para uso administrativo
 */
export function MigrationManager() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleInitialize() {
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const result = await initializeDatabase()
      if (result.error) {
        setError(result.error)
      } else {
        setMessage('Banco de dados inicializado com sucesso!')
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao inicializar banco de dados')
    } finally {
      setLoading(false)
    }
  }

  async function handleRunMigrations() {
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const result = await runMigrations()
      if (result.error) {
        setError(result.error)
      } else {
        setMessage('Migrações executadas com sucesso!')
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao executar migrações')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 bg-slate-700 border border-slate-600">
      <h2 className="text-xl font-bold text-white mb-4">Gerenciador de Migrações</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-slate-300 mb-2">
            Execute as migrações do banco de dados automaticamente.
          </p>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleInitialize}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? 'Executando...' : 'Inicializar Banco de Dados'}
          </Button>

          <Button
            onClick={handleRunMigrations}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? 'Executando...' : 'Executar Migrações'}
          </Button>
        </div>

        {message && (
          <div className="p-4 bg-green-600/20 border border-green-600 rounded-lg">
            <p className="text-green-400">{message}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-600/20 border border-red-600 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </div>
    </Card>
  )
}
