'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Função centralizada para garantir que o usuário tenha perfil
 * Esta função SEMPRE garante que o perfil existe, criando se necessário
 */
export async function ensureUserProfile() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { 
      error: 'Usuário não autenticado', 
      profile: null,
      churchId: null 
    }
  }

  // 1. Verificar se o perfil já existe
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id, church_id, role, full_name, email, phone, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  // Se o perfil existe e tem church_id, retornar sucesso
  if (existingProfile && existingProfile.church_id) {
    // Garantir que tem permissões (não bloquear se falhar)
      // Garantir permissões (não bloquear se falhar)
      try {
        await supabase
          .from('user_permissions')
          .upsert({
            user_id: user.id,
            church_id: existingProfile.church_id,
            can_manage_finances: true,
            can_manage_members: true,
            can_manage_events: true,
            can_view_reports: true,
            can_send_whatsapp: true,
          }, {
            onConflict: 'user_id,church_id'
          })
      } catch {
        // Ignorar erros de permissões
      }

    return { 
      error: null, 
      profile: existingProfile,
      churchId: existingProfile.church_id 
    }
  }

  // 2. Se o perfil existe mas não tem church_id, buscar ou criar igreja
  let churchId = existingProfile?.church_id || null

  if (!churchId) {
    // Tentar usar função RPC que bypassa RLS (mais robusto)
    try {
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('ensure_church_and_profile', {
          p_user_id: user.id,
          p_user_email: user.email || '',
          p_user_name: user.email?.split('@')[0] || 'Usuário'
        })

      if (!rpcError && rpcResult && rpcResult.church_id) {
        churchId = rpcResult.church_id
      }
    } catch (rpcErr) {
      console.error('Erro ao chamar RPC ensure_church_and_profile:', rpcErr)
    }

    // Se RPC não funcionou, criar uma NOVA igreja para este usuário
    if (!churchId) {
      // Criar uma nova igreja exclusiva para este usuário
      const churchName = user.email?.split('@')[0] || 'Minha Igreja'
      const { data: newChurch, error: churchError } = await supabase
        .from('churches')
        .insert({
          name: churchName,
        })
        .select('id')
        .single()

      if (churchError) {
        console.error('Erro ao criar igreja:', churchError)
      } else if (newChurch) {
        churchId = newChurch.id
      }
    }
  }

  if (!churchId) {
    return { 
      error: 'Não foi possível criar ou encontrar uma igreja. Por favor, entre em contato com o suporte.\n\nSe você acabou de se cadastrar, pode ser que seu perfil ainda esteja sendo configurado. Tente fazer logout e login novamente.\n\nSe o problema persistir, execute o script SQL: supabase/VERIFICAR_E_CORRIGIR_PERFIL.sql', 
      profile: null,
      churchId: null 
    }
  }

  // 3. Criar ou atualizar perfil com church_id e role 'owner'
  const { data: profile, error: createError } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      church_id: churchId,
      full_name: user.email?.split('@')[0] || 'Usuário',
      email: user.email || '',
      role: 'owner', // Todos são 'owner' com acesso completo
    }, {
      onConflict: 'id'
    })
    .select('id, church_id, role, full_name, email, phone, avatar_url')
    .single()

  if (createError || !profile) {
    // Tentar buscar novamente após um pequeno delay (pode ter sido criado por outro processo)
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const { data: retryProfile } = await supabase
      .from('user_profiles')
      .select('id, church_id, role, full_name, email, phone, avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    if (retryProfile && retryProfile.church_id) {
      return { 
        error: null, 
        profile: retryProfile,
        churchId: retryProfile.church_id 
      }
    }

    return { 
      error: `Erro ao criar/atualizar perfil: ${createError?.message || 'Erro desconhecido'}`, 
      profile: null,
      churchId: null 
    }
  }

  // 4. Garantir que tem permissões completas
  const { error: permissionError } = await supabase
    .from('user_permissions')
    .upsert({
      user_id: user.id,
      church_id: churchId,
      can_manage_finances: true,
      can_manage_members: true,
      can_manage_events: true,
      can_view_reports: true,
      can_send_whatsapp: true,
    }, {
      onConflict: 'user_id,church_id'
    })

  // Não falhar se apenas as permissões falharem (pode ser criado depois)
  if (permissionError) {
    console.error('Erro ao criar permissões (não crítico):', permissionError)
  }

  return { 
    error: null, 
    profile,
    churchId: profile.church_id 
  }
}
