'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Função utilitária para obter o church_id do usuário autenticado
 * Retorna um objeto com error e churchId
 */
export async function getChurchId() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Usuário não autenticado', churchId: null }
  }

  // Tentar buscar perfil sem .single() primeiro para evitar erro com políticas RLS
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('church_id')
    .eq('id', user.id)
    .limit(1)

  let profile = profiles && profiles.length > 0 ? profiles[0] : null

  // Se não encontrar perfil, tentar criar automaticamente se houver igreja existente
  if (!profile && (!profileError || profileError.code === 'PGRST116')) {
    // Buscar igreja existente
    const { data: churches } = await supabase
      .from('churches')
      .select('id')
      .limit(1)

    const churchId = churches && churches.length > 0 ? churches[0].id : null

    // Criar perfil automaticamente se houver igreja
    if (churchId) {
      const { error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          church_id: churchId,
          full_name: user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          role: 'owner',
        })

      if (!createError) {
        // Buscar perfil recém criado
        const { data: newProfiles } = await supabase
          .from('user_profiles')
          .select('church_id')
          .eq('id', user.id)
          .limit(1)
        
        profile = newProfiles && newProfiles.length > 0 ? newProfiles[0] : null
      }
    }
  }

  // Se ainda não encontrar perfil, tentar uma segunda vez após delay
  if (!profile && profileError) {
    // Se for erro de RLS ou perfil não encontrado, tentar novamente
    if (profileError?.code === 'PGRST116' || profileError?.code === '42P17' || !profile) {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const { data: retryProfiles, error: retryError } = await supabase
        .from('user_profiles')
        .select('church_id')
        .eq('id', user.id)
        .limit(1)
      
      if (retryProfiles && retryProfiles.length > 0) {
        profile = retryProfiles[0]
      } else if (retryError || !retryProfiles || retryProfiles.length === 0) {
        return { 
          error: 'Perfil de usuário não encontrado. Por favor, faça logout e login novamente.\n\nSe você acabou de se cadastrar, pode ser que seu perfil ainda esteja sendo configurado. Tente fazer logout e login novamente.\n\nSe o problema persistir, execute o script SQL: supabase/VERIFICAR_E_CORRIGIR_PERFIL.sql', 
          churchId: null 
        }
      }
    }
    
    // Outros erros podem ser de RLS ou permissões
    if (profileError && profileError.code !== 'PGRST116' && profileError.code !== '42P17') {
      console.error('Erro ao buscar perfil:', profileError)
      return { 
        error: `Erro ao acessar seu perfil: ${profileError.message}. Por favor, faça logout e login novamente.\n\nSe o problema persistir, execute o script SQL: supabase/VERIFICAR_E_CORRIGIR_PERFIL.sql`, 
        churchId: null 
      }
    }
  }

  if (!profile) {
    return { 
      error: 'Perfil de usuário não encontrado. Por favor, faça logout e login novamente.\n\nSe você acabou de se cadastrar, pode ser que seu perfil ainda esteja sendo configurado. Tente fazer logout e login novamente.', 
      churchId: null 
    }
  }

  if (!profile.church_id) {
    return { 
      error: 'Igreja não encontrada no seu perfil. Por favor, entre em contato com o suporte.', 
      churchId: null 
    }
  }

  return { error: null, churchId: profile.church_id }
}

