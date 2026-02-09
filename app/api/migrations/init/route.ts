import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * API Route para inicializar o banco de dados
 * Executa o TOTAL_SQL.sql automaticamente na primeira vez
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar se as variáveis de ambiente estão definidas
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY não está definido. Adicione no .env.local' },
        { status: 500 }
      )
    }

    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.MIGRATION_SECRET || 'migration-secret-key-change-in-production'

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se já foi inicializado
    const { data: existing } = await adminClient
      .from('schema_migrations')
      .select('filename')
      .eq('filename', 'TOTAL_SQL.sql')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Banco de dados já foi inicializado',
        alreadyInitialized: true,
      })
    }

    // Executar TOTAL_SQL.sql
    const totalSqlPath = join(process.cwd(), 'supabase', 'TOTAL_SQL.sql')
    if (!existsSync(totalSqlPath)) {
      return NextResponse.json(
        { error: 'Arquivo TOTAL_SQL.sql não encontrado' },
        { status: 404 }
      )
    }

    console.log('Executando inicialização do banco de dados...')
    const sql = await readFile(totalSqlPath, 'utf-8')

    // Executar SQL via REST API usando função exec_sql
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        body: JSON.stringify({ sql }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
      
      // Se a função exec_sql não existir, informar que precisa executar manualmente
      if (response.status === 404 || errorData.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Função exec_sql não encontrada. Execute o TOTAL_SQL.sql manualmente no SQL Editor do Supabase primeiro.',
            requiresManualExecution: true 
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: errorData.message || 'Erro ao executar SQL' },
        { status: response.status }
      )
    }

    const executed = 1
    const errors = 0

    // Marcar como executado
    await adminClient
      .from('schema_migrations')
      .upsert({
        filename: 'TOTAL_SQL.sql',
        executed_at: new Date().toISOString(),
      }, {
        onConflict: 'filename',
      })

    return NextResponse.json({
      success: true,
      message: 'Banco de dados inicializado com sucesso',
      executed,
      errors,
    })
  } catch (error: any) {
    console.error('Erro ao inicializar banco de dados:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
