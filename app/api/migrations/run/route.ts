import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { readFile, readdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * API Route para executar migrações SQL automaticamente
 * Esta rota lê os arquivos SQL da pasta supabase/ e os executa em ordem
 * Após execução bem-sucedida, deleta os arquivos processados
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

    // Verificar autenticação (apenas owners podem executar migrações)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.MIGRATION_SECRET || 'migration-secret-key-change-in-production'

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Criar tabela de migrações se não existir
    await ensureMigrationsTable()

    // 2. Ler arquivos SQL da pasta supabase/
    const supabasePath = join(process.cwd(), 'supabase')
    const files = await readdir(supabasePath)
    const sqlFiles = files
      .filter(file => file.endsWith('.sql') && file !== 'TOTAL_SQL.sql')
      .sort() // Executar em ordem alfabética

    // 3. Executar TOTAL_SQL.sql primeiro (se não foi executado)
    const totalSqlPath = join(supabasePath, 'TOTAL_SQL.sql')
    if (existsSync(totalSqlPath)) {
      const totalSqlExecuted = await checkMigrationExecuted('TOTAL_SQL.sql')
      if (!totalSqlExecuted) {
        console.log('Executando TOTAL_SQL.sql...')
        const success = await executeSqlFile(totalSqlPath, 'TOTAL_SQL.sql')
        if (success) {
          console.log('✅ TOTAL_SQL.sql executado com sucesso')
        } else {
          return NextResponse.json(
            { error: 'Falha ao executar TOTAL_SQL.sql' },
            { status: 500 }
          )
        }
      } else {
        console.log('ℹ️ TOTAL_SQL.sql já foi executado anteriormente')
      }
    }

    // 4. Executar outros arquivos SQL
    const results = []
    for (const file of sqlFiles) {
      const executed = await checkMigrationExecuted(file)
      if (executed) {
        console.log(`ℹ️ ${file} já foi executado, pulando...`)
        continue
      }

      const filePath = join(supabasePath, file)
      console.log(`Executando ${file}...`)
      
      const success = await executeSqlFile(filePath, file)
      if (success) {
        results.push({ file, status: 'success' })
        // Deletar arquivo após execução bem-sucedida
        try {
          await unlink(filePath)
          console.log(`✅ ${file} executado e deletado com sucesso`)
        } catch (deleteError) {
          console.error(`⚠️ Erro ao deletar ${file}:`, deleteError)
        }
      } else {
        results.push({ file, status: 'error' })
        console.error(`❌ Erro ao executar ${file}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migrações executadas',
      results,
    })
  } catch (error: any) {
    console.error('Erro ao executar migrações:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * Garantir que a tabela de migrações existe
 */
async function ensureMigrationsTable() {
  const { error } = await adminClient.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_schema_migrations_filename 
      ON schema_migrations(filename);
    `
  })

  // Se a função exec_sql não existir, criar a tabela diretamente
  if (error && error.message.includes('function') && error.message.includes('does not exist')) {
    // Tentar criar via query direta (pode falhar se RLS estiver ativo)
    const { error: directError } = await adminClient
      .from('schema_migrations')
      .select('id')
      .limit(1)

    if (directError && directError.code === '42P01') {
      // Tabela não existe, criar via SQL direto
      console.log('Criando tabela schema_migrations...')
      // Usar uma abordagem diferente: criar função que cria a tabela
      await createMigrationsTableViaFunction()
    }
  }
}

/**
 * Criar tabela de migrações via função RPC
 */
async function createMigrationsTableViaFunction() {
  // Primeiro, criar função que cria a tabela
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION create_migrations_table()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_schema_migrations_filename 
      ON schema_migrations(filename);
    END;
    $$;
  `

  // Executar via query direta (service role bypassa RLS)
  const { error } = await adminClient.rpc('exec_sql', { sql: createFunctionSql })
  if (error) {
    // Se ainda falhar, tentar criar diretamente (pode não funcionar se RLS estiver muito restritivo)
    console.warn('Não foi possível criar função, tentando abordagem alternativa...')
  }
}

/**
 * Verificar se uma migração já foi executada
 */
async function checkMigrationExecuted(filename: string): Promise<boolean> {
  try {
    const { data, error } = await adminClient
      .from('schema_migrations')
      .select('id')
      .eq('filename', filename)
      .limit(1)
      .maybeSingle()

    if (error && error.code !== '42P01') {
      console.error('Erro ao verificar migração:', error)
      return false
    }

    return !!data
  } catch {
    return false
  }
}

/**
 * Executar arquivo SQL usando Supabase REST API
 */
async function executeSqlFile(filePath: string, filename: string): Promise<boolean> {
  try {
    const sql = await readFile(filePath, 'utf-8')
    
    // Usar Supabase REST API para executar SQL diretamente
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
      console.error(`Erro ao executar ${filename}:`, errorData)
      
      // Se a função exec_sql não existir, retornar false
      // O usuário precisará executar TOTAL_SQL.sql primeiro manualmente
      if (response.status === 404 || errorData.message?.includes('does not exist')) {
        console.warn('Função exec_sql não encontrada. Execute TOTAL_SQL.sql primeiro.')
        return false
      }
      
      // Ignorar alguns erros comuns (idempotência)
      const errorMessage = errorData.message || ''
      if (errorMessage.includes('already exists') || 
          errorMessage.includes('duplicate') ||
          errorMessage.includes('does not exist')) {
        // Continuar mesmo com esses erros
      } else {
        return false
      }
    }

    // Marcar como executado
    await markMigrationExecuted(filename)
    return true
  } catch (error: any) {
    console.error(`Erro ao executar arquivo ${filename}:`, error)
    return false
  }
}


/**
 * Marcar migração como executada
 */
async function markMigrationExecuted(filename: string) {
  try {
    await adminClient
      .from('schema_migrations')
      .upsert({
        filename,
        executed_at: new Date().toISOString(),
      }, {
        onConflict: 'filename',
      })
  } catch (error) {
    console.error('Erro ao marcar migração como executada:', error)
  }
}
