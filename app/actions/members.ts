'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/utils/get-church-id'
import type { MemberInput, CreateMemberAccountInput } from '@/lib/validations/members'

// ============================================
// MEMBROS
// ============================================

export async function createMember(data: MemberInput) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  // Normalizar birthDate: string vazia vira null, string válida é mantida
  const birthDate = data.birthDate && data.birthDate.trim() !== '' 
    ? data.birthDate.trim() 
    : null
  const memberSince = data.memberSince && data.memberSince.trim() !== '' 
    ? data.memberSince.trim() 
    : null

  const { error } = await supabase
    .from('members')
    .insert({
      church_id: churchId,
      full_name: data.fullName,
      email: data.email || null,
      phone: data.phone || null,
      birth_date: birthDate,
      member_since: memberSince,
      status: data.status,
      notes: data.notes || null,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/membros')
  return { success: true }
}

export async function getMembers(search?: string, status?: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  let query = supabase
    .from('members')
    .select('*')
    .eq('church_id', churchId)
    .order('full_name')

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function getMember(id: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .eq('church_id', churchId)
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function updateMember(id: string, data: MemberInput) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  // Normalizar birthDate: string vazia vira null, string válida é mantida
  const birthDate = data.birthDate && data.birthDate.trim() !== '' 
    ? data.birthDate.trim() 
    : null
  const memberSince = data.memberSince && data.memberSince.trim() !== '' 
    ? data.memberSince.trim() 
    : null

  const { error } = await supabase
    .from('members')
    .update({
      full_name: data.fullName,
      email: data.email || null,
      phone: data.phone || null,
      birth_date: birthDate,
      member_since: memberSince,
      status: data.status,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('church_id', churchId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/membros')
  revalidatePath(`/membros/${id}`)
  return { success: true }
}

export async function deleteMember(id: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id)
    .eq('church_id', churchId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/membros')
  return { success: true }
}

export async function updateMemberAvatar(memberId: string, avatarUrl: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  const { error } = await supabase
    .from('members')
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', memberId)
    .eq('church_id', churchId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/membros')
  revalidatePath(`/membros/${memberId}`)
  return { success: true }
}

// ============================================
// CRIAR CONTA PARA MEMBRO
// ============================================

export async function createMemberAccount(data: CreateMemberAccountInput) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  // Verificar se o membro existe e pertence à igreja
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('*')
    .eq('id', data.memberId)
    .eq('church_id', churchId)
    .single()

  if (memberError || !member) {
    return { error: 'Membro não encontrado' }
  }

  // Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Erro ao criar usuário' }
  }

  // Atualizar membro com user_id
  const { error: updateError } = await supabase
    .from('members')
    .update({
      user_id: authData.user.id,
      email: data.email,
    })
    .eq('id', data.memberId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Criar perfil do usuário usando função SQL (contorna RLS)
  const { error: profileError } = await supabase.rpc('create_member_profile', {
    p_user_id: authData.user.id,
    p_church_id: churchId,
    p_full_name: member.full_name,
    p_email: data.email,
    p_phone: member.phone || null,
  })

  if (profileError) {
    return { error: profileError.message }
  }

  revalidatePath('/membros')
  return { success: true }
}

// ============================================
// ANIVERSÁRIOS
// ============================================

/**
 * Busca membros com aniversário no mês especificado
 */
export async function getMemberBirthdays(startDate?: Date, endDate?: Date) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  // Buscar membros ativos com aniversário no período
  const { data: members, error } = await supabase
    .from('members')
    .select('id, full_name, birth_date')
    .eq('church_id', churchId)
    .eq('status', 'active')
    .not('birth_date', 'is', null)

  if (error) {
    return { error: error.message, data: null }
  }

  if (!members || members.length === 0) {
    return { data: [], error: null }
  }

  // Filtrar membros cujo aniversário cai no período especificado
  const birthdays: Array<{
    id: string
    title: string
    description: string | null
    event_date: string
    event_time: string | null
    location: string | null
    event_type: string | null
    is_public: boolean | null
    is_birthday?: boolean
    member_name?: string
  }> = []

  if (!startDate || !endDate) {
    return { data: [], error: null }
  }

  // Normalizar datas para comparação
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  const startYear = start.getFullYear()
  const endYear = end.getFullYear()

  for (const member of members) {
    if (!member.birth_date) continue

    try {
      // Parse da data de nascimento (Supabase retorna como string YYYY-MM-DD)
      let birthDate: Date
      if (typeof member.birth_date === 'string') {
        // Se já é uma string no formato ISO, usar diretamente
        birthDate = new Date(member.birth_date)
      } else {
        birthDate = new Date(member.birth_date)
      }

      // Verificar se a data é válida
      if (isNaN(birthDate.getTime())) {
        continue
      }

      // Extrair mês e dia do aniversário (ignorar o ano de nascimento)
      const birthMonth = birthDate.getMonth()
      const birthDay = birthDate.getDate()

      // Verificar todos os anos no intervalo do período
      for (let year = startYear; year <= endYear; year++) {
        // Criar data do aniversário para este ano
        const birthdayThisYear = new Date(year, birthMonth, birthDay)
        birthdayThisYear.setHours(0, 0, 0, 0)

        // Verificar se o aniversário está dentro do período
        if (birthdayThisYear >= start && birthdayThisYear <= end) {
          birthdays.push({
            id: `birthday-${member.id}-${year}`,
            title: `Aniversário de ${member.full_name}`,
            description: `🎉 Aniversário de ${member.full_name}`,
            event_date: birthdayThisYear.toISOString().split('T')[0],
            event_time: null,
            location: null,
            event_type: 'birthday',
            is_public: true,
            is_birthday: true,
            member_name: member.full_name,
          })
        }
      }
    } catch (error) {
      // Se houver erro ao processar a data, pular este membro
      console.error(`Erro ao processar aniversário de ${member.full_name}:`, error)
      continue
    }
  }

  return { data: birthdays, error: null }
}

// ============================================
// HISTÓRICO DE CONTRIBUIÇÕES
// ============================================

export async function getMemberContributions(memberId: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  // Verificar se o membro pertence à igreja
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('id', memberId)
    .eq('church_id', churchId)
    .single()

  if (!member) {
    return { error: 'Membro não encontrado', data: null }
  }

  const { data, error } = await supabase
    .from('revenues')
    .select(`
      *,
      revenue_categories(name, color)
    `)
    .eq('member_id', memberId)
    .eq('church_id', churchId)
    .order('transaction_date', { ascending: false })

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

