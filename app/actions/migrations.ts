'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Server Actions para executar migrações automaticamente
 */

const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'migration-secret-key-change-in-production'

/**
 * Verifica se os campos de endereço existem na tabela members
 */
export async function checkMembersAddressFields() {
  const supabase = await createClient()
  
  try {
    // Tentar fazer uma query que inclua os campos de endereço
    // Se os campos não existirem, a query vai falhar
    const result = await supabase
      .from('members')
      .select('id, zip_code')
      .limit(0) // Apenas verificar estrutura, não buscar dados

    // Se não houver erro, os campos existem
    if (!result.error) {
      return { exists: true, message: null, error: null }
    } else {
      // Verificar se o erro é sobre coluna não existir
      const errorMessage = result.error?.message || ''
      const errorCode = result.error?.code || ''
      
      // PostgreSQL error code 42703 = column does not exist
      if (errorCode === '42703' || errorMessage.includes('does not exist') || 
          (errorMessage.includes('column') && errorMessage.includes('zip_code'))) {
        return { 
          exists: false, 
          message: 'Campos de endereço não foram criados ainda. Execute a migração para habilitar esta funcionalidade.',
          error: null 
        }
      } else {
        // Se for outro tipo de erro, retornar o erro
        return { exists: false, message: null, error: errorMessage }
      }
    }
  } catch (err: any) {
    // Se houver exceção, assumir que os campos não existem
    return { 
      exists: false, 
      message: 'Erro ao verificar campos de endereço',
      error: err.message || 'Erro desconhecido'
    }
  }
}

/**
 * Inicializar banco de dados (executar TOTAL_SQL.sql)
 */
export async function initializeDatabase() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/migrations/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIGRATION_SECRET}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return { error: error.error || 'Erro ao inicializar banco de dados' }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error: any) {
    console.error('Erro ao inicializar banco de dados:', error)
    return { error: error.message || 'Erro ao inicializar banco de dados' }
  }
}

/**
 * Executar migrações pendentes
 */
export async function runMigrations() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/migrations/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIGRATION_SECRET}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return { error: error.error || 'Erro ao executar migrações' }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error: any) {
    console.error('Erro ao executar migrações:', error)
    return { error: error.message || 'Erro ao executar migrações' }
  }
}
