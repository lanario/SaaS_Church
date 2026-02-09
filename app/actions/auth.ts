'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { RegisterInput } from '@/lib/validations/schemas'

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (!authData.user) {
    return { error: 'Erro ao fazer login' }
  }

  // Garantir que o perfil existe usando função centralizada
  const { ensureUserProfile } = await import('@/lib/utils/ensure-user-profile')
  const profileResult = await ensureUserProfile()

  // Se houver erro, logar mas não bloquear login (perfil pode ser criado depois)
  if (profileResult.error) {
    console.error('Erro ao garantir perfil durante login:', profileResult.error)
  }

  // Se o perfil foi criado/atualizado com sucesso, garantir categorias padrão
  if (profileResult.churchId && !profileResult.error) {
    // Garantir categorias padrão de receitas (fire and forget)
    Promise.resolve(
      import('@/app/actions/financial').then(({ ensureDefaultCategories }) => {
        ensureDefaultCategories(profileResult.churchId!).catch(console.error)
      }).catch(console.error)
    )
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signUp(data: RegisterInput) {
  const supabase = await createClient()

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

  // Criar igreja
  const { data: church, error: churchError } = await supabase
    .from('churches')
    .insert({
      name: data.churchName,
    })
    .select()
    .single()

  if (churchError) {
    return { error: churchError.message }
  }

  // Criar perfil do usuário
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      church_id: church.id,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      role: 'owner',
    })

  if (profileError) {
    console.error('Erro ao criar perfil:', profileError)
    // Tentar limpar a igreja criada se o perfil falhar
    await supabase
      .from('churches')
      .delete()
      .eq('id', church.id)
    return { error: `Erro ao criar perfil: ${profileError.message}` }
  }

  // Aguardar um pouco para garantir que o perfil está disponível (debounce RLS)
  await new Promise(resolve => setTimeout(resolve, 500))

  // Criar permissões iniciais
  const { error: permissionError } = await supabase
    .from('user_permissions')
    .insert({
      user_id: authData.user.id,
      church_id: church.id,
      can_manage_finances: true,
      can_manage_members: true,
      can_manage_events: true,
      can_view_reports: true,
      can_send_whatsapp: true,
    })

  if (permissionError) {
    console.error('Erro ao criar permissões:', permissionError)
    // Não falha o cadastro se apenas as permissões falharem
  }

  // Garantir categorias padrão de receitas
  const { ensureDefaultCategories } = await import('@/app/actions/financial')
  await ensureDefaultCategories(church.id)

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

