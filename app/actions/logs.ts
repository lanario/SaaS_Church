'use server'

import { createClient } from '@/lib/supabase/server'
import { getChurchId } from '@/lib/utils/get-church-id'
import { revalidatePath } from 'next/cache'

export interface SystemLog {
  id: string
  user_id: string | null
  action_type: string
  entity_type: string
  entity_id: string | null
  description: string
  metadata: any
  created_at: string
  user_profiles?: {
    full_name: string
    email: string
  } | null
}

/**
 * Busca logs do sistema da igreja atual
 */
export async function getSystemLogs(limit: number = 100) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  // Buscar logs
  const { data: logs, error } = await supabase
    .from('system_logs')
    .select('*')
    .eq('church_id', churchId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { error: error.message, data: null }
  }

  if (!logs || logs.length === 0) {
    return { data: [], error: null }
  }

  // Buscar perfis de usuários únicos
  const userIds = [...new Set(logs.map(log => log.user_id).filter(Boolean))] as string[]
  
  let userProfilesMap: Record<string, { full_name: string; email: string }> = {}
  
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    if (profiles) {
      profiles.forEach(profile => {
        userProfilesMap[profile.id] = {
          full_name: profile.full_name,
          email: profile.email,
        }
      })
    }
  }

  // Combinar logs com perfis
  const logsWithProfiles = logs.map(log => ({
    ...log,
    user_profiles: log.user_id ? userProfilesMap[log.user_id] || null : null,
  }))

  return { data: logsWithProfiles, error: null }
}

/**
 * Limpa todos os logs da igreja atual
 * Apenas owners podem executar esta ação
 */
export async function clearSystemLogs() {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  // Verificar se o usuário é owner
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .eq('church_id', churchId)
    .single()

  if (!profile || profile.role !== 'owner') {
    return { error: 'Apenas proprietários podem limpar os logs' }
  }

  // Contar logs antes de deletar
  const { count } = await supabase
    .from('system_logs')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', churchId)

  const { error } = await supabase
    .from('system_logs')
    .delete()
    .eq('church_id', churchId)

  if (error) {
    return { error: error.message }
  }

  // Registrar log da ação de limpar logs usando função PostgreSQL
  // (permite inserir mesmo após deletar todos os logs)
  if (user && churchId) {
    await supabase.rpc('create_system_log', {
      p_church_id: churchId,
      p_user_id: user.id,
      p_action_type: 'delete',
      p_entity_type: 'other',
      p_entity_id: null,
      p_description: `Todos os logs do sistema foram limpos (${count || 0} registros removidos)`,
      p_metadata: { logsCount: count || 0 },
    })
  }
  
  revalidatePath('/ajustes')
  return { success: true }
}

/**
 * Conta o total de logs da igreja
 */
export async function getLogsCount() {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', count: 0 }
  }

  const { count, error } = await supabase
    .from('system_logs')
    .select('*', { count: 'exact', head: true })
    .eq('church_id', churchId)

  if (error) {
    return { error: error.message, count: 0 }
  }

  return { count: count || 0, error: null }
}
