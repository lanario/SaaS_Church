import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * API Route para executar transferência automática do fundo de reserva
 * Esta rota deve ser chamada todo dia 01 de cada mês via cron job
 * 
 * Para configurar no Supabase:
 * 1. Vá em Database > Functions
 * 2. Crie um cron job que chame esta rota no dia 01 de cada mês
 * 
 * Ou use um serviço externo como:
 * - Vercel Cron Jobs
 * - GitHub Actions
 * - Cron-job.org
 */
export async function GET(request: NextRequest) {
  // Verificar se há uma chave secreta para segurança (opcional)
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.CRON_SECRET

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    // Chamar a função PostgreSQL
    const { data, error } = await supabase.rpc('auto_transfer_reserve_fund')

    if (error) {
      console.error('Erro ao executar transferência automática:', error)
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Transferência automática executada',
      results: data || [],
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', success: false },
      { status: 500 }
    )
  }
}

