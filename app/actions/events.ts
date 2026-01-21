'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/utils/get-church-id'
import { getMemberBirthdays } from '@/app/actions/members'
import type { EventInput, EventAttendanceInput } from '@/lib/validations/events'

// ============================================
// EVENTOS
// ============================================

export async function createEvent(data: EventInput) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  const { data: { user } } = await supabase.auth.getUser()

  const eventDate = typeof data.eventDate === 'string' 
    ? new Date(data.eventDate) 
    : data.eventDate

  const { error } = await supabase
    .from('events')
    .insert({
      church_id: churchId,
      title: data.title,
      description: data.description || null,
      event_date: eventDate.toISOString().split('T')[0],
      event_time: data.eventTime || null,
      location: data.location || null,
      event_type: data.eventType,
      whatsapp_message: data.whatsappMessage || null,
      is_public: data.isPublic,
      created_by: user?.id,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/eventos')
  return { success: true }
}

export async function getEvents(startDate?: Date, endDate?: Date, includeBirthdays: boolean = true) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  let query = supabase
    .from('events')
    .select('*')
    .eq('church_id', churchId)
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true, nullsFirst: false })

  if (startDate && endDate) {
    query = query
      .gte('event_date', startDate.toISOString().split('T')[0])
      .lte('event_date', endDate.toISOString().split('T')[0])
  }

  const { data: events, error } = await query

  if (error) {
    return { error: error.message, data: null }
  }

  // Incluir aniversários se solicitado
  if (includeBirthdays && startDate && endDate) {
    const { data: birthdays, error: birthdayError } = await getMemberBirthdays(startDate, endDate)
    
    if (!birthdayError && birthdays) {
      // Combinar eventos e aniversários
      const allEvents = [
        ...(events || []),
        ...birthdays,
      ].sort((a, b) => {
        const dateA = new Date(a.event_date).getTime()
        const dateB = new Date(b.event_date).getTime()
        if (dateA !== dateB) return dateA - dateB
        
        // Se mesma data, aniversários primeiro
        if ((a as any).is_birthday && !(b as any).is_birthday) return -1
        if (!(a as any).is_birthday && (b as any).is_birthday) return 1
        
        // Depois por hora
        const timeA = a.event_time || '00:00'
        const timeB = b.event_time || '00:00'
        return timeA.localeCompare(timeB)
      })
      
      return { data: allEvents, error: null }
    }
  }

  return { data: events || [], error: null }
}

export async function getEvent(id: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('church_id', churchId)
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function updateEvent(id: string, data: EventInput) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  const eventDate = typeof data.eventDate === 'string' 
    ? new Date(data.eventDate) 
    : data.eventDate

  const { error } = await supabase
    .from('events')
    .update({
      title: data.title,
      description: data.description || null,
      event_date: eventDate.toISOString().split('T')[0],
      event_time: data.eventTime || null,
      location: data.location || null,
      event_type: data.eventType,
      whatsapp_message: data.whatsappMessage || null,
      is_public: data.isPublic,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('church_id', churchId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/eventos')
  revalidatePath(`/eventos/${id}`)
  return { success: true }
}

export async function deleteEvent(id: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
    .eq('church_id', churchId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/eventos')
  return { success: true }
}

// ============================================
// CONFIRMAÇÕES DE PRESENÇA
// ============================================

export async function confirmAttendance(eventId: string, memberId: string, status: 'confirmed' | 'pending' | 'absent') {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja' }
  }

  // Verificar se o evento pertence à igreja
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('church_id', churchId)
    .single()

  if (!event) {
    return { error: 'Evento não encontrado' }
  }

  // Verificar se o membro pertence à igreja
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('id', memberId)
    .eq('church_id', churchId)
    .single()

  if (!member) {
    return { error: 'Membro não encontrado' }
  }

  const { error } = await supabase
    .from('event_attendances')
    .upsert({
      event_id: eventId,
      member_id: memberId,
      status,
      confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/eventos')
  revalidatePath(`/eventos/${eventId}`)
  return { success: true }
}

export async function getEventAttendances(eventId: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  // Verificar se o evento pertence à igreja
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('church_id', churchId)
    .single()

  if (!event) {
    return { error: 'Evento não encontrado', data: null }
  }

  const { data, error } = await supabase
    .from('event_attendances')
    .select(`
      *,
      members(id, full_name, avatar_url)
    `)
    .eq('event_id', eventId)
    .order('confirmed_at', { ascending: false, nullsFirst: true })

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function getMemberEventAttendance(memberId: string, eventId: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  const { data, error } = await supabase
    .from('event_attendances')
    .select('*')
    .eq('event_id', eventId)
    .eq('member_id', memberId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    return { error: error.message, data: null }
  }

  return { data: data || null, error: null }
}

// ============================================
// ESTATÍSTICAS DE EVENTOS
// ============================================

export async function getEventStats(eventId: string) {
  const supabase = await createClient()
  const { churchId, error: churchError } = await getChurchId()

  if (churchError || !churchId) {
    return { error: churchError || 'Erro ao obter igreja', data: null }
  }

  // Buscar confirmações
  const { data: attendances } = await supabase
    .from('event_attendances')
    .select('status')
    .eq('event_id', eventId)

  const confirmed = attendances?.filter(a => a.status === 'confirmed').length || 0
  const pending = attendances?.filter(a => a.status === 'pending').length || 0
  const absent = attendances?.filter(a => a.status === 'absent').length || 0
  const total = attendances?.length || 0

  return {
    error: null,
    data: {
      confirmed,
      pending,
      absent,
      total,
    },
  }
}

