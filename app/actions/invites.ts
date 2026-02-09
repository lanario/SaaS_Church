'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getChurchId } from '@/lib/utils/get-church-id'
import type { CreateInviteInput, AcceptInviteInput } from '@/lib/validations/invites'

// Função para gerar token único (apenas servidor)
function generateToken(): string {
  const crypto = require('crypto')
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Criar convite para membro
 */
export async function createInvite(data: CreateInviteInput) {
  const supabase = await createClient()
  const { error: churchIdError, churchId } = await getChurchId()

  if (churchIdError || !churchId) {
    return { error: churchIdError || 'Igreja não encontrada', invite: null }
  }

  // Verificar se o usuário é owner
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado', invite: null }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .limit(1)
    .single()

  if (profile?.role !== 'owner') {
    return { error: 'Apenas o proprietário pode criar convites', invite: null }
  }

  // Verificar se já existe convite pendente para este email
  const { data: existingInvite } = await supabase
    .from('church_invites')
    .select('id, status')
    .eq('church_id', churchId)
    .eq('email', data.email)
    .eq('status', 'pending')
    .single()

  if (existingInvite) {
    return { error: 'Já existe um convite pendente para este e-mail', invite: null }
  }

  // Gerar token único
  const token = generateToken()

  // Calcular data de expiração
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + data.expires_in_days)

  // Criar convite
  // Verificar se a coluna invite_type existe antes de usar
  const inviteData: any = {
    church_id: churchId,
    email: data.email,
    invited_by: user.id,
    token,
    expires_at: expiresAt.toISOString(),
    status: 'pending',
  }
  
  // Adicionar invite_type apenas se a coluna existir (após migração)
  // Se não existir, o banco usará o valor padrão 'member'
  if (data.invite_type) {
    inviteData.invite_type = data.invite_type
  }

  const { data: invite, error } = await supabase
    .from('church_invites')
    .insert(inviteData)
    .select()
    .single()

  if (error) {
    // Se o erro for sobre coluna não existir, orientar sobre migração
    if (error.message.includes('invite_type') || error.message.includes('column') || error.code === '42703') {
      return { 
        error: 'A coluna invite_type não existe no banco. Execute o arquivo 00_MIGRACOES_INCREMENTAIS.sql no Supabase SQL Editor primeiro.', 
        invite: null 
      }
    }
    return { error: `Erro ao criar convite: ${error.message}`, invite: null }
  }

  // Registrar log da ação
  if (user && churchId && invite) {
    const { logAction } = await import('@/lib/utils/logger')
    await logAction(supabase, churchId, user.id, {
      actionType: 'create',
      entityType: 'invite',
      entityId: invite.id,
      description: `Convite ${data.invite_type === 'collaborator' ? 'de colaborador' : 'de membro'} criado para ${data.email}`,
      metadata: { email: data.email, inviteType: data.invite_type },
    })
  }

  revalidatePath('/ajustes', 'layout')
  return { error: null, invite }
}

/**
 * Listar convites da igreja
 */
export async function getChurchInvites() {
  const supabase = await createClient()
  const { error: churchIdError, churchId } = await getChurchId()

  if (churchIdError || !churchId) {
    return { error: churchIdError || 'Igreja não encontrada', invites: null }
  }

  // Verificar se o usuário é owner
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado', invites: null }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .limit(1)
    .single()

  if (profile?.role !== 'owner') {
    return { error: 'Apenas o proprietário pode ver convites', invites: null }
  }

  // Buscar convites
  // Selecionar apenas colunas que existem (invite_type pode não existir ainda)
  const { data: invites, error } = await supabase
    .from('church_invites')
    .select('id, email, status, token, expires_at, created_at, accepted_at, rejected_at, invite_type')
    .eq('church_id', churchId)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: `Erro ao buscar convites: ${error.message}`, invites: null }
  }

  return { error: null, invites: invites || [] }
}

/**
 * Fazer logout e redirecionar para página de convite
 */
export async function signOutAndRedirectToInvite(token: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect(`/convite/${token}`)
}

/**
 * Criar conta a partir de convite (com senha padrão)
 */
export async function createAccountFromInvite(token: string, password: string = '12345678') {
  const supabase = await createClient()

  // Buscar convite pelo token
  const { data: invite, error: inviteError } = await supabase
    .from('church_invites')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (inviteError || !invite) {
    return { error: 'Convite não encontrado ou já foi usado', user: null }
  }

  // Verificar se o convite não expirou
  if (new Date(invite.expires_at) < new Date()) {
    await supabase
      .from('church_invites')
      .update({ status: 'expired' })
      .eq('id', invite.id)
    return { error: 'Este convite expirou', user: null }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  // URL para onde o usuário vai após clicar no link de confirmação (Supabase envia token no hash)
  // Adicione em Supabase: Authentication > URL Configuration > Redirect URLs: baseUrl/auth/confirmar e baseUrl/auth/callback
  const redirectAfterConfirm = `${baseUrl}/auth/confirmar?next=${encodeURIComponent(`/convite/${token}`)}`

  // Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: invite.email,
    password: password,
    options: {
      emailRedirectTo: redirectAfterConfirm,
      data: {
        invite_token: token,
      },
    },
  })

  if (authError) {
    // Se o erro for sobre usuário já existir, sugerir login
    if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
      return { error: 'Já existe uma conta com este e-mail. Faça login para aceitar o convite.', user: null, existingUser: true }
    }
    return { error: `Erro ao criar conta: ${authError.message}`, user: null }
  }

  if (!authData.user) {
    return { error: 'Erro ao criar usuário', user: null }
  }

  // Criar perfil do usuário JÁ COM church_id e role 'owner' (todos têm as mesmas permissões)
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      church_id: invite.church_id, // Já incluir church_id desde o início
      email: invite.email,
      full_name: invite.email.split('@')[0], // Nome temporário baseado no email
      role: 'owner', // Todos os usuários são 'owner' com permissões completas
    })

  if (profileError) {
    console.error('Erro ao criar perfil:', profileError)
    // Se o perfil já existir, atualizar com church_id e role 'owner'
    if (profileError.code === '23505') { // Violação de constraint única
      await supabase
        .from('user_profiles')
        .update({
          church_id: invite.church_id,
          role: 'owner',
          updated_at: new Date().toISOString(),
        })
        .eq('id', authData.user.id)
    }
  } else {
    // Criar permissões imediatamente após criar perfil
    await supabase
      .from('user_permissions')
      .upsert({
        user_id: authData.user.id,
        church_id: invite.church_id,
        can_manage_finances: true,
        can_manage_members: true,
        can_manage_events: true,
        can_view_reports: true,
        can_send_whatsapp: true,
      }, {
        onConflict: 'user_id,church_id'
      })
  }

  // Aguardar um pouco para garantir que o perfil foi criado
  await new Promise(resolve => setTimeout(resolve, 500))

  // Verificar se o usuário precisa confirmar email
  if (authData.user && !authData.session) {
    // Usuário criado mas precisa confirmar email
    return { 
      error: `Conta criada com sucesso! Verifique seu email (${invite.email}) para confirmar a conta. Após confirmar, faça login e acesse o link do convite novamente.`, 
      user: authData.user,
      needsEmailConfirmation: true 
    }
  }

  // Se já tem sessão, usar diretamente
  if (authData.session && authData.user) {
    // Aguardar um pouco para garantir que a sessão foi estabelecida
    await new Promise(resolve => setTimeout(resolve, 500))

    // Aceitar convite automaticamente
    const acceptResult = await acceptInvite({ token })

    if (acceptResult.error) {
      return { error: `Conta criada, mas erro ao aceitar convite: ${acceptResult.error}`, user: authData.user }
    }

    return { error: null, user: authData.user }
  }

  // Tentar fazer login automaticamente após criar conta
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: invite.email,
    password: password,
  })

  if (signInError || !signInData.user) {
    // Se não conseguir fazer login, retornar erro mas informar que a conta foi criada
    return { 
      error: `Conta criada com sucesso, mas não foi possível fazer login automaticamente. Por favor, faça login manualmente e acesse o link do convite novamente.`, 
      user: authData.user,
      needsLogin: true 
    }
  }

  // Aguardar um pouco para garantir que a sessão foi estabelecida
  await new Promise(resolve => setTimeout(resolve, 500))

  // Aceitar convite automaticamente após criar conta e fazer login
  const acceptResult = await acceptInvite({ token })

  if (acceptResult.error) {
    return { error: `Conta criada e login realizado, mas erro ao aceitar convite: ${acceptResult.error}`, user: signInData.user }
  }

  return { error: null, user: signInData.user }
}

/**
 * Aceitar convite
 */
export async function acceptInvite(data: AcceptInviteInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  // Buscar convite pelo token
  const { data: invite, error: inviteError } = await supabase
    .from('church_invites')
    .select('*')
    .eq('token', data.token)
    .eq('status', 'pending')
    .single()

  if (inviteError || !invite) {
    return { error: 'Convite não encontrado ou já foi usado' }
  }

  // Verificar se o convite não expirou
  if (new Date(invite.expires_at) < new Date()) {
    // Marcar como expirado
    await supabase
      .from('church_invites')
      .update({ status: 'expired' })
      .eq('id', invite.id)

    return { error: 'Este convite expirou' }
  }

  // Verificar se o email do convite corresponde ao email do usuário autenticado
  // Usar o email do auth.users (que é o email de login) ao invés do user_profiles
  if (user.email && user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return { error: `Este convite foi enviado para ${invite.email}, mas você está logado com ${user.email}. Por favor, faça login com o email correto ou use o link do convite.` }
  }

  // Se o usuário não tem email no auth, verificar no perfil
  if (!user.email) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', user.id)
      .limit(1)
      .single()

    if (!profile || profile.email?.toLowerCase() !== invite.email.toLowerCase()) {
      return { error: `Este convite foi enviado para ${invite.email}, mas seu perfil está associado a outro email.` }
    }
  }

  // Definir role baseado no tipo de convite
  const role = invite.invite_type === 'collaborator' ? 'collaborator' : 'member'
  
  // Colaboradores têm acesso completo, membros têm acesso limitado
  const hasFullAccess = invite.invite_type === 'collaborator'
  
  const { error: updateProfileError } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      church_id: invite.church_id, // Colaboradores acessam dados da igreja do dono
      email: user.email || invite.email,
      full_name: user.email?.split('@')[0] || invite.email.split('@')[0] || 'Usuário',
      role: role,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    })

  if (updateProfileError) {
    return { error: `Erro ao atualizar perfil: ${updateProfileError.message}` }
  }

  // Definir permissões baseado no tipo de convite
  const { error: permissionError } = await supabase
    .from('user_permissions')
    .upsert({
      user_id: user.id,
      church_id: invite.church_id,
      can_manage_finances: hasFullAccess,
      can_manage_members: hasFullAccess,
      can_manage_events: hasFullAccess,
      can_view_reports: hasFullAccess,
      can_send_whatsapp: hasFullAccess,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,church_id'
    })

  if (permissionError) {
    console.error('Erro ao criar permissões:', permissionError)
    // Não falhar se apenas as permissões falharem, mas logar o erro
  }

  // Marcar convite como aceito
  const { error: acceptError } = await supabase
    .from('church_invites')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invite.id)

  if (acceptError) {
    return { error: `Erro ao aceitar convite: ${acceptError.message}` }
  }

  revalidatePath('/', 'layout')
  return { error: null }
}

/**
 * Cancelar/Excluir convite
 */
export async function cancelInvite(inviteId: string) {
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
    return { error: 'Apenas o proprietário pode cancelar convites' }
  }

  // Verificar se o convite pertence à igreja
  const { data: invite } = await supabase
    .from('church_invites')
    .select('church_id, status')
    .eq('id', inviteId)
    .single()

  if (!invite || invite.church_id !== churchId) {
    return { error: 'Convite não encontrado' }
  }

  // Deletar convite (ou marcar como rejeitado se já foi aceito)
  if (invite.status === 'pending') {
    const { error } = await supabase
      .from('church_invites')
      .delete()
      .eq('id', inviteId)

    if (error) {
      return { error: `Erro ao cancelar convite: ${error.message}` }
    }
  } else {
    return { error: 'Apenas convites pendentes podem ser cancelados' }
  }

  revalidatePath('/ajustes', 'layout')
  return { error: null }
}

/**
 * Verificar se usuário tem convite aceito
 */
export async function hasAcceptedInvite() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado', hasInvite: false }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('email, church_id, role')
    .eq('id', user.id)
    .limit(1)
    .single()

  if (!profile) {
    return { error: 'Perfil não encontrado', hasInvite: false }
  }

  // Todos os usuários são 'owner' e têm acesso completo
  if (profile.role === 'owner') {
    return { error: null, hasInvite: true }
  }

  // Verificar se tem convite aceito
  const { data: invite } = await supabase
    .from('church_invites')
    .select('id')
    .eq('email', profile.email)
    .eq('church_id', profile.church_id)
    .eq('status', 'accepted')
    .limit(1)
    .single()

  return { error: null, hasInvite: !!invite }
}
