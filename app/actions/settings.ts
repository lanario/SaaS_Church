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

  // Permitir que owners e collaborators vejam os usuários
  if (profile?.role !== 'owner' && profile?.role !== 'collaborator') {
    return { error: 'Apenas proprietários e colaboradores podem ver os usuários', users: null }
  }

  // Tentar usar função RPC primeiro (evita problema de RLS)
  // A função RPC usa SECURITY DEFINER e contorna RLS
  const { data: usersData, error: rpcError } = await supabase
    .rpc('get_church_users')

  if (rpcError) {
    console.error('Erro ao chamar get_church_users RPC:', rpcError)
    // Se a função não existir (erro 42883), usar método direto
    // Caso contrário, retornar erro
    if (rpcError.code !== '42883' && rpcError.code !== 'P0001') {
      return { error: `Erro ao buscar usuários: ${rpcError.message}`, users: null }
    }
  } else if (usersData) {
    // Se RPC funcionou, formatar dados
    const users = usersData.map((user: any) => ({
      id: user.id,
      full_name: user.full_name || user.email?.split('@')[0] || 'Usuário',
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      permissions: {
        can_manage_finances: Boolean(user.can_manage_finances),
        can_manage_members: Boolean(user.can_manage_members),
        can_manage_events: Boolean(user.can_manage_events),
        can_view_reports: Boolean(user.can_view_reports),
        can_send_whatsapp: Boolean(user.can_send_whatsapp),
      },
    }))

    return { error: null, users }
  }

  // Se a função RPC não existir ou falhar, usar método direto
  // Com a nova política RLS, owners e colaboradores podem ver outros usuários
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
    .order('created_at', { ascending: false })

  if (profilesError) {
    console.error('Erro ao buscar perfis:', profilesError)
    return { error: `Erro ao buscar usuários: ${profilesError.message}`, users: null }
  }

  if (!profiles || profiles.length === 0) {
    return { error: null, users: [] }
  }

  // Buscar permissões de todos os usuários de uma vez
  const userIds = profiles.map(p => p.id)
  const { data: permissions, error: permissionsError } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('church_id', churchId)
    .in('user_id', userIds)

  if (permissionsError) {
    console.error('Erro ao buscar permissões:', permissionsError)
    // Continuar mesmo sem permissões
  }

  // Combinar perfis com permissões
  const users = profiles.map(profile => {
    const permission = permissions?.find(p => p.user_id === profile.id)
    return {
      ...profile,
      permissions: permission ? {
        can_manage_finances: permission.can_manage_finances || false,
        can_manage_members: permission.can_manage_members || false,
        can_manage_events: permission.can_manage_events || false,
        can_view_reports: permission.can_view_reports || false,
        can_send_whatsapp: permission.can_send_whatsapp || false,
      } : {
        can_manage_finances: false,
        can_manage_members: false,
        can_manage_events: false,
        can_view_reports: false,
        can_send_whatsapp: false,
      },
    }
  })

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

