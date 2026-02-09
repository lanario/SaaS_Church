-- ============================================
-- SCRIPT PARA VERIFICAR E CORRIGIR PERFIS DE USUÁRIOS
-- ============================================
-- Este script verifica usuários autenticados sem perfil e cria perfis básicos
-- Execute este script no SQL Editor do Supabase se houver problemas com perfis

-- 1. Verificar usuários sem perfil
SELECT 
  au.id as user_id,
  au.email,
  au.created_at as user_created_at,
  CASE WHEN up.id IS NULL THEN 'SEM PERFIL' ELSE 'COM PERFIL' END as status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC;

-- 2. Verificar usuários com perfil mas sem church_id
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.role,
  up.church_id,
  CASE WHEN up.church_id IS NULL THEN 'SEM IGREJA' ELSE 'OK' END as status
FROM public.user_profiles up
WHERE up.church_id IS NULL;

-- 3. Criar perfis para usuários autenticados sem perfil
-- (Apenas se houver pelo menos uma igreja no sistema)
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
        'owner', -- Primeiro usuário será owner
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

-- 4. Atribuir church_id para perfis sem igreja
-- (Apenas se houver pelo menos uma igreja no sistema)
DO $$
DECLARE
  v_church_id UUID;
  v_updated_count INTEGER := 0;
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

  -- Atualizar perfis sem church_id
  UPDATE public.user_profiles
  SET church_id = v_church_id
  WHERE church_id IS NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Perfis atualizados: %', v_updated_count;
END $$;

-- 5. Criar permissões COMPLETAS (todas como true) para usuários sem permissões
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
  true,  -- Todas as permissões como true para acesso completo
  true,
  true,
  true,
  true
FROM public.user_profiles up
LEFT JOIN public.user_permissions uperm ON up.id = uperm.user_id AND up.church_id = uperm.church_id
WHERE uperm.id IS NULL
  AND up.church_id IS NOT NULL
ON CONFLICT (user_id, church_id) DO NOTHING;

-- 5.1. Atualizar TODAS as permissões existentes para true (acesso completo)
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

-- 5.2. Atualizar todos os usuários para role 'owner' (acesso total)
UPDATE public.user_profiles
SET role = 'owner'
WHERE role != 'owner';

-- 6. Verificar resultado final
SELECT 
  COUNT(*) FILTER (WHERE up.id IS NULL) as usuarios_sem_perfil,
  COUNT(*) FILTER (WHERE up.church_id IS NULL) as perfis_sem_igreja,
  COUNT(*) FILTER (WHERE uperm.id IS NULL AND up.church_id IS NOT NULL) as perfis_sem_permissoes,
  COUNT(*) as total_usuarios_autenticados
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
LEFT JOIN public.user_permissions uperm ON up.id = uperm.user_id AND up.church_id = uperm.church_id;
