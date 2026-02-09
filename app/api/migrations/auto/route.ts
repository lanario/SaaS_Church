import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

/**
 * API Route que executa automaticamente na primeira inicialização
 * Verifica se o banco precisa ser inicializado e executa se necessário
 * Esta rota pode ser chamada automaticamente pelo sistema
 */
export async function GET(_request: NextRequest) {
  try {
    // Verificar se as variáveis de ambiente estão definidas
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        needsInitialization: true,
        message: 'SUPABASE_SERVICE_ROLE_KEY não está definido. Adicione no .env.local',
        error: 'SUPABASE_SERVICE_ROLE_KEY não está definido',
      })
    }

    // Verificar se já foi inicializado
    const { data: existing, error: checkError } = await adminClient
      .from('schema_migrations')
      .select('filename')
      .eq('filename', 'TOTAL_SQL.sql')
      .maybeSingle()

    if (checkError && checkError.code === '42P01') {
      // Tabela não existe, precisa inicializar
      return NextResponse.json({
        needsInitialization: true,
        message: 'Banco de dados precisa ser inicializado. Execute TOTAL_SQL.sql manualmente primeiro.',
      })
    }

    if (existing) {
      return NextResponse.json({
        needsInitialization: false,
        message: 'Banco de dados já foi inicializado',
      })
    }

    return NextResponse.json({
      needsInitialization: true,
      message: 'Banco de dados precisa ser inicializado',
    })
  } catch (error: any) {
    return NextResponse.json({
      needsInitialization: true,
      message: error.message || 'Erro ao verificar status do banco',
      error: error.message,
    })
  }
}
