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

  // Verificar se o perfil existe, se não, criar um básico
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', authData.user.id)
    .limit(1)
    .maybeSingle()

  const profile = profiles

  // Se o perfil não existe, tentar criar automaticamente apenas se houver igreja existente
  if (!profile) {
    // Buscar igreja existente (sem .single() para evitar erro)
    const { data: existingChurches } = await supabase
      .from('churches')
      .select('id')
      .limit(1)

    const churchId = existingChurches && existingChurches.length > 0 ? existingChurches[0].id : null

    // Apenas criar perfil se houver igreja existente (não criar igreja devido a RLS)
    if (churchId) {
      // Criar perfil automaticamente
      const { error: createProfileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          church_id: churchId,
          full_name: authData.user.email?.split('@')[0] || 'Usuário',
          email: authData.user.email || '',
          role: 'owner',
        })

      if (createProfileError) {
        console.error('Erro ao criar perfil durante login:', createProfileError)
      } else {
        // Criar permissões iniciais (não bloquear resposta)
        Promise.resolve(supabase
          .from('user_permissions')
          .insert({
            user_id: authData.user.id,
            church_id: churchId,
            can_manage_finances: true,
            can_manage_members: true,
            can_manage_events: true,
            can_view_reports: true,
            can_send_whatsapp: true,
          }))
          .then(() => {
            // Garantir categorias padrão de receitas (fire and forget)
            import('@/app/actions/financial').then(({ ensureDefaultCategories }) => {
              ensureDefaultCategories(churchId).catch(console.error)
            }).catch(console.error)
          })
          .catch(console.error)
      }
    } else {
      // Se não houver igreja, o perfil será criado apenas durante o cadastro
      console.warn('Usuário logado sem perfil e sem igreja existente. Perfil será criado apenas durante cadastro completo.')
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
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

