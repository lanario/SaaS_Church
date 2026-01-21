'use server'

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
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
  const { data: invite, error } = await supabase
    .from('church_invites')
    .insert({
      church_id: churchId,
      email: data.email,
      invited_by: user.id,
      token,
      expires_at: expiresAt.toISOString(),
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return { error: `Erro ao criar convite: ${error.message}`, invite: null }
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
  const { data: invites, error } = await supabase
    .from('church_invites')
    .select('*')
    .eq('church_id', churchId)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: `Erro ao buscar convites: ${error.message}`, invites: null }
  }

  return { error: null, invites: invites || [] }
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

  // Verificar se o email do convite corresponde ao email do usuário
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('email')
    .eq('id', user.id)
    .limit(1)
    .single()

  if (!profile || profile.email !== invite.email) {
    return { error: 'Este convite não foi enviado para seu e-mail' }
  }

  // Atualizar perfil do usuário para associar à igreja
  const { error: updateProfileError } = await supabase
    .from('user_profiles')
    .update({
      church_id: invite.church_id,
      role: 'member',
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateProfileError) {
    return { error: `Erro ao atualizar perfil: ${updateProfileError.message}` }
  }

  // Criar permissões básicas para membro
  await supabase
    .from('user_permissions')
    .upsert({
      user_id: user.id,
      church_id: invite.church_id,
      can_manage_finances: false,
      can_manage_members: false,
      can_manage_events: false,
      can_view_reports: false,
      can_send_whatsapp: false,
    })

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

  // Owners e treasurers sempre têm acesso
  if (profile.role === 'owner' || profile.role === 'treasurer') {
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

