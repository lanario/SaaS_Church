-- ============================================
-- SCRIPT PARA LIBERAR TODAS AS PERMISSÕES PARA TODOS OS USUÁRIOS
-- ============================================
-- Este script garante que todos os usuários tenham acesso completo ao sistema
-- Execute este script no SQL Editor do Supabase para resolver problemas de acesso
-- ============================================

-- 1. Verificar e criar perfis para todos os usuários autenticados sem perfil
DO $$
DECLARE
  v_church_id UUID;
  v_user_record RECORD;
  v_created_count INTEGER := 0;
BEGIN
  -- Buscar primeira igreja disponível
  SELECT id INTO v_church_id
  FROM public.churches
  LIMIT 1;

  -- Se não houver igreja, criar uma padrão
  IF v_church_id IS NULL THEN
    INSERT INTO public.churches (name, created_at)
    VALUES ('Igreja Padrão', NOW())
    RETURNING id INTO v_church_id;
    
    RAISE NOTICE 'Igreja padrão criada: %', v_church_id;
  END IF;

  -- Criar perfis para usuários sem perfil
  FOR v_user_record IN
    SELECT au.id, au.email, au.created_at
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.id
    WHERE up.id IS NULL
  LOOP
    BEGIN
      INSERT INTO public.user_profiles (
        id,
        church_id,
        full_name,
        email,
        role,
        created_at
      ) VALUES (
        v_user_record.id,
        v_church_id,
        COALESCE(SPLIT_PART(v_user_record.email, '@', 1), 'Usuário'),
        v_user_record.email,
        'owner', -- Definir como owner para ter acesso total
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;

      v_created_count := v_created_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao criar perfil para usuário %: %', v_user_record.email, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Perfis criados: %', v_created_count;
END $$;

-- 2. Atribuir church_id para perfis sem igreja
DO $$
DECLARE
  v_church_id UUID;
  v_updated_count INTEGER := 0;
BEGIN
  -- Buscar primeira igreja disponível
  SELECT id INTO v_church_id
  FROM public.churches
  LIMIT 1;

  IF v_church_id IS NULL THEN
    RAISE NOTICE 'Nenhuma igreja encontrada.';
    RETURN;
  END IF;

  -- Atualizar perfis sem church_id
  UPDATE public.user_profiles
  SET church_id = v_church_id
  WHERE church_id IS NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Perfis atualizados com church_id: %', v_updated_count;
END $$;

-- 3. Atualizar todos os usuários para role 'owner' (acesso total)
UPDATE public.user_profiles
SET role = 'owner'
WHERE role != 'owner';

-- 4. Garantir que TODOS os usuários tenham permissões COMPLETAS (todas como true)
-- Primeiro, inserir permissões para usuários que não têm
INSERT INTO public.user_permissions (
  user_id,
  church_id,
  can_manage_finances,
  can_manage_members,
  can_manage_events,
  can_view_reports,
  can_send_whatsapp
)
SELECT 
  up.id,
  up.church_id,
  true,  -- Todas as permissões como true
  true,
  true,
  true,
  true
FROM public.user_profiles up
LEFT JOIN public.user_permissions uperm ON up.id = uperm.user_id AND up.church_id = uperm.church_id
WHERE uperm.id IS NULL
  AND up.church_id IS NOT NULL
ON CONFLICT (user_id, church_id) DO NOTHING;

-- 5. Atualizar TODAS as permissões existentes para true (acesso total)
UPDATE public.user_permissions
SET 
  can_manage_finances = true,
  can_manage_members = true,
  can_manage_events = true,
  can_view_reports = true,
  can_send_whatsapp = true,
  updated_at = NOW()
WHERE 
  can_manage_finances = false OR
  can_manage_members = false OR
  can_manage_events = false OR
  can_view_reports = false OR
  can_send_whatsapp = false;

-- 6. Verificar resultado final
SELECT 
  COUNT(*) FILTER (WHERE up.id IS NULL) as usuarios_sem_perfil,
  COUNT(*) FILTER (WHERE up.church_id IS NULL) as perfis_sem_igreja,
  COUNT(*) FILTER (WHERE uperm.id IS NULL AND up.church_id IS NOT NULL) as perfis_sem_permissoes,
  COUNT(*) FILTER (WHERE uperm.can_manage_finances = false OR uperm.can_manage_members = false OR uperm.can_manage_events = false OR uperm.can_view_reports = false OR uperm.can_send_whatsapp = false) as perfis_com_permissoes_restritas,
  COUNT(*) as total_usuarios_autenticados,
  COUNT(*) FILTER (WHERE up.role = 'owner') as usuarios_com_role_owner
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
LEFT JOIN public.user_permissions uperm ON up.id = uperm.user_id AND up.church_id = uperm.church_id;

-- 7. Relatório detalhado de usuários e suas permissões
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.role,
  up.church_id,
  CASE WHEN uperm.id IS NULL THEN 'SEM PERMISSÕES' ELSE 'COM PERMISSÕES' END as status_permissoes,
  COALESCE(uperm.can_manage_finances, false) as can_manage_finances,
  COALESCE(uperm.can_manage_members, false) as can_manage_members,
  COALESCE(uperm.can_manage_events, false) as can_manage_events,
  COALESCE(uperm.can_view_reports, false) as can_view_reports,
  COALESCE(uperm.can_send_whatsapp, false) as can_send_whatsapp
FROM public.user_profiles up
LEFT JOIN public.user_permissions uperm ON up.id = uperm.user_id AND up.church_id = uperm.church_id
ORDER BY up.created_at DESC;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Após executar este script, todos os usuários devem ter:
-- 1. Perfil criado (se não tinha)
-- 2. church_id atribuído (se não tinha)
-- 3. Role definida como 'owner' (acesso total)
-- 4. Todas as permissões como true (acesso completo)
-- ============================================
