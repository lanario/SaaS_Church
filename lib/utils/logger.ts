/**
 * Utilitário para registrar logs de ações do sistema
 */

export interface LogData {
  actionType: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'export' | 'import' | 'other'
  entityType: 'member' | 'revenue' | 'expense' | 'event' | 'user' | 'church' | 'category' | 'permission' | 'invite' | 'report' | 'other'
  entityId?: string
  description: string
  metadata?: Record<string, any>
}

/**
 * Registra uma ação no log do sistema
 * Esta função deve ser chamada de server actions
 */
export async function logAction(
  supabase: any,
  churchId: string,
  userId: string | null,
  data: LogData,
  request?: {
    ip?: string
    userAgent?: string
  }
) {
  try {
    const { error } = await supabase
      .from('system_logs')
      .insert({
        church_id: churchId,
        user_id: userId,
        action_type: data.actionType,
        entity_type: data.entityType,
        entity_id: data.entityId || null,
        description: data.description,
        metadata: data.metadata || null,
        ip_address: request?.ip || null,
        user_agent: request?.userAgent || null,
      })

    if (error) {
      // Não lançar erro para não quebrar o fluxo principal
      // Apenas logar no console em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao registrar log:', error)
      }
    }
  } catch (error) {
    // Silenciosamente ignorar erros de log para não quebrar o sistema
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao registrar log:', error)
    }
  }
}

/**
 * Obtém informações da requisição para log
 */
export function getRequestInfo(headers: Headers): {
  ip?: string
  userAgent?: string
} {
  return {
    ip: headers.get('x-forwarded-for')?.split(',')[0] || 
        headers.get('x-real-ip') || 
        undefined,
    userAgent: headers.get('user-agent') || undefined,
  }
}
