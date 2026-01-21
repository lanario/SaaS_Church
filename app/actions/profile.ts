'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Verificar e criar perfil se não existir
 */
export async function ensureProfile() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Usuário não autenticado', profile: null }
  }

  // Verificar se o perfil existe
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Se o perfil não existe, criar um básico
  if (profileError && profileError.code === 'PGRST116') {
    // Buscar igreja existente (não criar nova automaticamente devido a RLS)
    const { data: existingChurches } = await supabase
      .from('churches')
      .select('id')
      .limit(1)

    const churchId = existingChurches && existingChurches.length > 0 ? existingChurches[0].id : null

    // Se não houver igreja existente, não pode criar perfil
    if (!churchId) {
      return { 
        error: 'Nenhuma igreja encontrada. Por favor, entre em contato com o administrador do sistema para criar sua igreja.', 
        profile: null 
      }
    }

    // Criar perfil
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        church_id: churchId,
        full_name: user.email?.split('@')[0] || 'Usuário',
        email: user.email || '',
        role: 'owner',
      })
      .select()
      .single()

    if (createError) {
      return { error: `Erro ao criar perfil: ${createError.message}`, profile: null }
    }

    // Criar permissões iniciais
    await supabase
      .from('user_permissions')
      .insert({
        user_id: user.id,
        church_id: churchId,
        can_manage_finances: true,
        can_manage_members: true,
        can_manage_events: true,
        can_view_reports: true,
        can_send_whatsapp: true,
      })

    // Garantir categorias padrão de receitas
    const { ensureDefaultCategories } = await import('@/app/actions/financial')
    await ensureDefaultCategories(churchId)

    revalidatePath('/', 'layout')
    return { error: null, profile: newProfile }
  }

  if (profileError) {
    return { error: `Erro ao buscar perfil: ${profileError.message}`, profile: null }
  }

  return { error: null, profile }
}

