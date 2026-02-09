'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/utils/get-church-id'
import type { MemberInput, CreateMemberAccountInput } from '@/lib/validations/members'
import { logAction } from '@/lib/utils/logger'

/**
 * Adiciona 1 dia a uma data no formato YYYY-MM-DD
 * Trabalha apenas com strings para evitar problemas de timezone
 */
function addOneDay(dateStr: string): string {
  if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr // Retornar como está se não estiver no formato correto
  }
  
  const [year, month, day] = dateStr.split('-').map(Number)
  
  // Array com dias em cada mês
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  
  // Verificar se é ano bissexto
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
  if (isLeapYear) {
    daysInMonth[1] = 29 // Fevereiro tem 29 dias em ano bissexto
  }
  
  let newDay = day + 1
  let newMonth = month
  let newYear = year
  
  // Se o dia excede os dias do mês, avançar para o próximo mês
  if (newDay > daysInMonth[month - 1]) {
    newDay = 1
    newMonth = month + 1
    
    // Se o mês excede 12, avançar para o próximo ano
    if (newMonth > 12) {
      newMonth = 1
      newYear = year + 1
    }
  }
  
  // Formatar de volta para YYYY-MM-DD
  return `${newYear}-${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`
}

/**
 * Verifica se os campos de endereço existem na tabela members
 * Retorna false se os campos não existirem (sem lançar erro)
 * Esta função é segura e não propaga erros
 */
async function checkAddressFieldsExist(supabase: any): Promise<boolean> {
  // Por padrão, assumir que os campos não existem
  // Isso garante que o código funcione mesmo sem os campos
  let fieldsExist = false
  
  try {
    // Tentar fazer uma query que inclua os campos de endereço
    // Se os campos não existirem, a query vai falhar
    const result = await supabase
      .from('members')
      .select('id, zip_code')
      .limit(0) // Apenas verificar estrutura, não buscar dados

    // Se não houver erro, os campos existem
    if (!result.error) {
      fieldsExist = true
    } else {
      // Verificar se o erro é sobre coluna não existir
      const errorMessage = result.error?.message || ''
      const errorCode = result.error?.code || ''
      
      // PostgreSQL error code 42703 = column does not exist
      if (errorCode === '42703') {
        fieldsExist = false
      } else if (errorMessage.includes('does not exist')) {
        fieldsExist = false
      } else if (errorMessage.includes('column') && errorMessage.includes('zip_code')) {
        fieldsExist = false
      } else {
        // Se for outro tipo de erro, assumir que os campos não existem por segurança
        fieldsExist = false
      }
    }
  } catch (err: any) {
    // Se houver exceção, verificar se é sobre coluna não existir
    const errorMessage = err?.message || String(err) || ''
    if (errorMessage.includes('does not exist') || 
        errorMessage.includes('42703') ||
        errorMessage.includes('zip_code')) {
      fieldsExist = false
    } else {
      // Outras exceções: assumir que os campos não existem por segurança
      fieldsExist = false
    }
  }
  
  // Sempre retornar um valor booleano (nunca lançar erro)
  return fieldsExist
}

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
  // Adicionar 1 dia para compensar problema de timezone
  let birthDate: string | null = null
  if (data.birthDate && data.birthDate.trim() !== '') {
    const dateStr = data.birthDate.trim()
    // Se já está no formato YYYY-MM-DD, adicionar 1 dia
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      birthDate = addOneDay(dateStr)
    } else {
      birthDate = dateStr
    }
  }
  
  let memberSince: string | null = null
  if (data.memberSince && data.memberSince.trim() !== '') {
    const dateStr = data.memberSince.trim()
    // Se já está no formato YYYY-MM-DD, adicionar 1 dia
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      memberSince = addOneDay(dateStr)
    } else {
      memberSince = dateStr
    }
  }

  // Verificar se os campos de endereço existem no banco
  // Se a verificação falhar, assumir que não existem (modo seguro)
  let addressFieldsExist = false
  try {
    addressFieldsExist = await checkAddressFieldsExist(supabase)
  } catch {
    // Se houver qualquer erro na verificação, assumir que os campos não existem
    addressFieldsExist = false
  }
  
  // Normalizar campos de endereço (só se os campos existirem)
  const insertData: any = {
    church_id: churchId,
    full_name: data.fullName,
    email: data.email || null,
    phone: data.phone || null,
    birth_date: birthDate,
    member_since: memberSince,
    status: data.status,
    notes: data.notes || null,
  }

  // Adicionar campos de endereço apenas se existirem no banco
  if (addressFieldsExist) {
    const zipCode = data.zipCode && data.zipCode.trim() !== '' ? data.zipCode.trim() : null
    const street = data.street && data.street.trim() !== '' ? data.street.trim() : null
    const addressNumber = data.addressNumber && data.addressNumber.trim() !== '' ? data.addressNumber.trim() : null
    const addressComplement = data.addressComplement && data.addressComplement.trim() !== '' ? data.addressComplement.trim() : null
    const neighborhood = data.neighborhood && data.neighborhood.trim() !== '' ? data.neighborhood.trim() : null
    const city = data.city && data.city.trim() !== '' ? data.city.trim() : null
    const state = data.state && data.state.trim() !== '' ? data.state.trim().toUpperCase() : null

    insertData.zip_code = zipCode
    insertData.street = street
    insertData.address_number = addressNumber
    insertData.address_complement = addressComplement
    insertData.neighborhood = neighborhood
    insertData.city = city
    insertData.state = state
  }

  const { error } = await supabase
    .from('members')
    .insert(insertData)

  if (error) {
    return { error: error.message }
  }

  // Registrar log da ação
  const { data: { user } } = await supabase.auth.getUser()
  if (user && churchId) {
    await logAction(supabase, churchId, user.id, {
      actionType: 'create',
      entityType: 'member',
      description: `Membro "${data.fullName}" foi criado`,
      metadata: { memberName: data.fullName, status: data.status },
    })
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

  // Verificar se os campos de endereço existem
  const addressFieldsExist = await checkAddressFieldsExist(supabase)
  
  // Selecionar apenas campos que existem
  let selectFields = 'id, church_id, user_id, full_name, email, phone, birth_date, member_since, status, avatar_url, notes, created_at, updated_at'
  
  if (addressFieldsExist) {
    selectFields += ', zip_code, street, address_number, address_complement, neighborhood, city, state'
  }

  let query = supabase
    .from('members')
    .select(selectFields)
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

  // Verificar se os campos de endereço existem
  const addressFieldsExist = await checkAddressFieldsExist(supabase)
  
  // Selecionar apenas campos que existem
  let selectFields = 'id, church_id, user_id, full_name, email, phone, birth_date, member_since, status, avatar_url, notes, created_at, updated_at'
  
  if (addressFieldsExist) {
    selectFields += ', zip_code, street, address_number, address_complement, neighborhood, city, state'
  }

  const { data, error } = await supabase
    .from('members')
    .select(selectFields)
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
  // Adicionar 1 dia para compensar problema de timezone
  let birthDate: string | null = null
  if (data.birthDate && data.birthDate.trim() !== '') {
    const dateStr = data.birthDate.trim()
    // Se já está no formato YYYY-MM-DD, adicionar 1 dia
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      birthDate = addOneDay(dateStr)
    } else {
      birthDate = dateStr
    }
  }
  
  let memberSince: string | null = null
  if (data.memberSince && data.memberSince.trim() !== '') {
    const dateStr = data.memberSince.trim()
    // Se já está no formato YYYY-MM-DD, adicionar 1 dia
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      memberSince = addOneDay(dateStr)
    } else {
      memberSince = dateStr
    }
  }

  // Verificar se os campos de endereço existem no banco
  // Se a verificação falhar, assumir que não existem (modo seguro)
  let addressFieldsExist = false
  try {
    addressFieldsExist = await checkAddressFieldsExist(supabase)
  } catch {
    // Se houver qualquer erro na verificação, assumir que os campos não existem
    addressFieldsExist = false
  }
  
  // Normalizar campos de endereço (só se os campos existirem)
  const updateData: any = {
    full_name: data.fullName,
    email: data.email || null,
    phone: data.phone || null,
    birth_date: birthDate,
    member_since: memberSince,
    status: data.status,
    notes: data.notes || null,
    updated_at: new Date().toISOString(),
  }

  // Adicionar campos de endereço apenas se existirem no banco
  if (addressFieldsExist) {
    const zipCode = data.zipCode && data.zipCode.trim() !== '' ? data.zipCode.trim() : null
    const street = data.street && data.street.trim() !== '' ? data.street.trim() : null
    const addressNumber = data.addressNumber && data.addressNumber.trim() !== '' ? data.addressNumber.trim() : null
    const addressComplement = data.addressComplement && data.addressComplement.trim() !== '' ? data.addressComplement.trim() : null
    const neighborhood = data.neighborhood && data.neighborhood.trim() !== '' ? data.neighborhood.trim() : null
    const city = data.city && data.city.trim() !== '' ? data.city.trim() : null
    const state = data.state && data.state.trim() !== '' ? data.state.trim().toUpperCase() : null

    updateData.zip_code = zipCode
    updateData.street = street
    updateData.address_number = addressNumber
    updateData.address_complement = addressComplement
    updateData.neighborhood = neighborhood
    updateData.city = city
    updateData.state = state
  }

  const { error } = await supabase
    .from('members')
    .update(updateData)
    .eq('id', id)
    .eq('church_id', churchId)

  if (error) {
    return { error: error.message }
  }

  // Registrar log da ação
  const { data: { user } } = await supabase.auth.getUser()
  if (user && churchId) {
    await logAction(supabase, churchId, user.id, {
      actionType: 'update',
      entityType: 'member',
      entityId: id,
      description: `Membro "${data.fullName}" foi atualizado`,
      metadata: { memberName: data.fullName, status: data.status },
    })
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

  // Buscar nome do membro antes de deletar para o log
  const { data: memberData } = await supabase
    .from('members')
    .select('full_name')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id)
    .eq('church_id', churchId)

  if (error) {
    return { error: error.message }
  }

  // Registrar log da ação
  const { data: { user } } = await supabase.auth.getUser()
  if (user && churchId) {
    await logAction(supabase, churchId, user.id, {
      actionType: 'delete',
      entityType: 'member',
      entityId: id,
      description: `Membro "${memberData?.full_name || 'Desconhecido'}" foi excluído`,
      metadata: { memberName: memberData?.full_name },
    })
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

  // Verificar se os campos de endereço existem
  const addressFieldsExist = await checkAddressFieldsExist(supabase)
  
  // Selecionar apenas campos que existem
  let selectFields = 'id, church_id, user_id, full_name, email, phone, birth_date, member_since, status, avatar_url, notes, created_at, updated_at'
  
  if (addressFieldsExist) {
    selectFields += ', zip_code, street, address_number, address_complement, neighborhood, city, state'
  }

  // Verificar se o membro existe e pertence à igreja
  const memberResult = await supabase
    .from('members')
    .select(selectFields)
    .eq('id', data.memberId)
    .eq('church_id', churchId)
    .single()

  if (memberResult.error || !memberResult.data) {
    return { error: 'Membro não encontrado' }
  }

  const member = memberResult.data as unknown as {
    full_name: string
    phone: string | null
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
      // Trabalhar diretamente com a string para evitar problemas de timezone
      let birthDateStr: string
      if (typeof member.birth_date === 'string') {
        // Remover parte de tempo se existir (T00:00:00...)
        birthDateStr = member.birth_date.split('T')[0]
      } else {
        // Se for Date, converter para string YYYY-MM-DD usando UTC
        const date = new Date(member.birth_date)
        const year = date.getUTCFullYear()
        const month = String(date.getUTCMonth() + 1).padStart(2, '0')
        const day = String(date.getUTCDate()).padStart(2, '0')
        birthDateStr = `${year}-${month}-${day}`
      }

      // Validar formato YYYY-MM-DD
      if (!birthDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        continue
      }

      // Extrair mês e dia diretamente da string (ignorar o ano de nascimento)
      const parts = birthDateStr.split('-')
      const birthMonth = parseInt(parts[1], 10) // Mês 1-12 (não 0-indexed)
      const birthDay = parseInt(parts[2], 10)

      // Validar valores
      if (birthMonth < 1 || birthMonth > 12 || birthDay < 1 || birthDay > 31) {
        continue
      }

      // Verificar todos os anos no intervalo do período
      for (let year = startYear; year <= endYear; year++) {
        // Criar data do aniversário para este ano diretamente como string
        const yearStr = String(year).padStart(4, '0')
        const monthStr = String(birthMonth).padStart(2, '0')
        const dayStr = String(birthDay).padStart(2, '0')
        const eventDateStr = `${yearStr}-${monthStr}-${dayStr}`

        // Criar Date para comparação (usando UTC para evitar problemas)
        const birthdayThisYear = new Date(Date.UTC(year, birthMonth - 1, birthDay))
        birthdayThisYear.setUTCHours(0, 0, 0, 0)

        // Verificar se o aniversário está dentro do período
        if (birthdayThisYear >= start && birthdayThisYear <= end) {
          birthdays.push({
            id: `birthday-${member.id}-${year}`,
            title: `Aniversário de ${member.full_name}`,
            description: `🎉 Aniversário de ${member.full_name}`,
            event_date: eventDateStr, // Usar string formatada diretamente (YYYY-MM-DD)
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

