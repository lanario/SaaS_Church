'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/utils/get-church-id'
import type { 
  UpdateProfileInput, 
  ChangePasswordInput, 
  UpdateChurchInput,
  UpdatePermissionsInput 
} from '@/lib/validations/settings'

/**
 * Atualizar perfil do usuário
 */
export async function updateProfile(data: UpdateProfileInput) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Usuário não autenticado' }
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      avatar_url: data.avatar_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { error: `Erro ao atualizar perfil: ${error.message}` }
  }

  revalidatePath('/ajustes', 'layout')
  revalidatePath('/', 'layout')
  return { error: null }
}

/**
 * Trocar senha do usuário
 */
export async function changePassword(data: ChangePasswordInput) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Usuário não autenticado' }
  }

  // Verificar senha atual
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: data.currentPassword,
  })

  if (signInError) {
    return { error: 'Senha atual incorreta' }
  }

  // Atualizar senha
  const { error: updateError } = await supabase.auth.updateUser({
    password: data.newPassword,
  })

  if (updateError) {
    return { error: `Erro ao atualizar senha: ${updateError.message}` }
  }

  return { error: null }
}

/**
 * Atualizar informações da igreja
 */
export async function updateChurch(data: UpdateChurchInput) {
  const supabase = await createClient()
  const { error: churchIdError, churchId } = await getChurchId()

  if (churchIdError || !churchId) {
    return { error: churchIdError || 'Igreja não encontrada' }
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
    .limit(1)
    .single()

  if (profile?.role !== 'owner') {
    return { error: 'Apenas o proprietário pode editar as informações da igreja' }
  }

  const { error } = await supabase
    .from('churches')
    .update({
      name: data.name,
      logo_url: data.logo_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', churchId)

  if (error) {
    return { error: `Erro ao atualizar igreja: ${error.message}` }
  }

  revalidatePath('/ajustes', 'layout')
  return { error: null }
}

/**
 * Buscar igreja
 */
export async function getChurch() {
  const supabase = await createClient()
  const { error: churchIdError, churchId } = await getChurchId()

  if (churchIdError || !churchId) {
    return { error: churchIdError || 'Igreja não encontrada', church: null }
  }

  const { data: church, error } = await supabase
    .from('churches')
    .select('*')
    .eq('id', churchId)
    .single()

  if (error) {
    return { error: `Erro ao buscar igreja: ${error.message}`, church: null }
  }

  return { error: null, church }
}

/**
 * Listar todos os usuários da igreja
 */
export async function getChurchUsers() {
  const supabase = await createClient()
  const { error: churchIdError, churchId } = await getChurchId()

  if (churchIdError || !churchId) {
    return { error: churchIdError || 'Igreja não encontrada', users: null }
  }

  // Verificar se o usuário é owner
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado', users: null }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .limit(1)
    .single()

  if (profile?.role !== 'owner') {
    return { error: 'Apenas o proprietário pode ver os usuários', users: null }
  }

  // Usar função RPC para buscar usuários (evita problema de RLS)
  const { data: usersData, error: rpcError } = await supabase
    .rpc('get_church_users')

  if (rpcError) {
    // Se a função RPC não existir, tentar método direto (pode falhar por RLS)
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        role,
        avatar_url,
        created_at
      `)
      .eq('church_id', churchId)

    if (profilesError) {
      return { error: `Erro ao buscar usuários: ${profilesError.message}`, users: null }
    }

    // Buscar permissões de cada usuário
    const userIds = profiles?.map(p => p.id) || []
    const { data: permissions } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('church_id', churchId)
      .in('user_id', userIds)

    // Combinar perfis com permissões
    const users = profiles?.map(profile => {
      const permission = permissions?.find(p => p.user_id === profile.id)
      return {
        ...profile,
        permissions: permission || {
          can_manage_finances: false,
          can_manage_members: false,
          can_manage_events: false,
          can_view_reports: false,
          can_send_whatsapp: false,
        },
      }
    }) || []

    return { error: null, users }
  }

  // Se RPC funcionou, formatar dados
  const users = usersData?.map(user => ({
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar_url: user.avatar_url,
    created_at: user.created_at,
    permissions: {
      can_manage_finances: user.can_manage_finances,
      can_manage_members: user.can_manage_members,
      can_manage_events: user.can_manage_events,
      can_view_reports: user.can_view_reports,
      can_send_whatsapp: user.can_send_whatsapp,
    },
  })) || []

  return { error: null, users }
}

/**
 * Atualizar permissões de um usuário
 */
export async function updateUserPermissions(data: UpdatePermissionsInput) {
  const supabase = await createClient()
  
  // Verificar se o usuário atual é owner
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, church_id')
    .eq('id', user.id)
    .limit(1)
    .single()

  if (profile?.role !== 'owner') {
    return { error: 'Apenas o proprietário pode gerenciar permissões' }
  }

  // Se church_id não foi fornecido, usar do perfil do owner
  const churchId = data.church_id || profile.church_id
  
  if (!churchId) {
    return { error: 'Igreja não encontrada' }
  }

  // Verificar se o usuário a ser atualizado pertence à mesma igreja
  const { data: targetProfile } = await supabase
    .from('user_profiles')
    .select('church_id')
    .eq('id', data.user_id)
    .limit(1)
    .single()

  if (targetProfile?.church_id !== churchId) {
    return { error: 'Você só pode gerenciar usuários da sua própria igreja' }
  }

  // Atualizar role no perfil
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      role: data.role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.user_id)

  if (profileError) {
    return { error: `Erro ao atualizar role: ${profileError.message}` }
  }

  // Atualizar ou criar permissões
  const { error: permissionError } = await supabase
    .from('user_permissions')
    .upsert({
      user_id: data.user_id,
      church_id: churchId,
      can_manage_finances: data.can_manage_finances,
      can_manage_members: data.can_manage_members,
      can_manage_events: data.can_manage_events,
      can_view_reports: data.can_view_reports,
      can_send_whatsapp: data.can_send_whatsapp,
      updated_at: new Date().toISOString(),
    })

  if (permissionError) {
    return { error: `Erro ao atualizar permissões: ${permissionError.message}` }
  }

  revalidatePath('/ajustes', 'layout')
  return { error: null }
}

