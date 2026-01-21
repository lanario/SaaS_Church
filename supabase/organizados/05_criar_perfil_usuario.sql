-- ============================================
-- CRIAR PERFIL PARA USUÁRIO EXISTENTE
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Ver usuários sem perfil
SELECT 
    u.id as user_id,
    u.email,
    u.created_at as user_created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE up.id IS NULL
ORDER BY u.created_at DESC;

-- PASSO 2: Criar perfil manualmente
-- Substitua os valores abaixo pelos dados reais:

/*
-- Exemplo: Criar perfil para um usuário específico
-- 1. Pegue o user_id da consulta acima
-- 2. Crie ou encontre uma igreja
-- 3. Execute o INSERT abaixo

-- Ver igrejas existentes:
SELECT id, name FROM churches;

-- Se não houver igreja, crie uma primeiro (como admin):
INSERT INTO churches (name) VALUES ('Minha Igreja') RETURNING id;

-- Agora crie o perfil (substitua USER_ID e CHURCH_ID):
INSERT INTO user_profiles (
  id,
  church_id,
  full_name,
  email,
  role
) VALUES (
  'USER_ID_AQUI',           -- ID do usuário do auth.users
  'CHURCH_ID_AQUI',         -- ID da igreja
  'Nome do Usuário',        -- Nome completo
  'email@exemplo.com',      -- Email do usuário
  'owner'                   -- Role: 'owner', 'treasurer', 'member'
);

-- Criar permissões iniciais:
INSERT INTO user_permissions (
  user_id,
  church_id,
  can_manage_finances,
  can_manage_members,
  can_manage_events,
  can_view_reports,
  can_send_whatsapp
) VALUES (
  'USER_ID_AQUI',           -- Mesmo ID do usuário
  'CHURCH_ID_AQUI',         -- Mesmo ID da igreja
  true,                     -- Gerenciar finanças
  true,                     -- Gerenciar membros
  true,                     -- Gerenciar eventos
  true,                     -- Ver relatórios
  true                      -- Enviar WhatsApp
);
*/

-- ============================================
-- SCRIPT AUTOMÁTICO PARA CRIAR PERFIL
-- ============================================
-- Este script cria perfil para TODOS os usuários sem perfil
-- usando a primeira igreja existente ou criando uma nova

DO $$
DECLARE
    v_user_id UUID;
    v_church_id UUID;
    v_user_email TEXT;
    v_user_count INTEGER;
BEGIN
    -- Buscar ou criar igreja
    SELECT id INTO v_church_id FROM churches LIMIT 1;
    
    IF v_church_id IS NULL THEN
        -- Criar igreja padrão se não existir
        INSERT INTO churches (name) VALUES ('Igreja Padrão') RETURNING id INTO v_church_id;
        RAISE NOTICE 'Igreja criada com ID: %', v_church_id;
    END IF;
    
    -- Criar perfil para cada usuário sem perfil
    FOR v_user_id, v_user_email IN 
        SELECT u.id, u.email
        FROM auth.users u
        LEFT JOIN user_profiles up ON u.id = up.id
        WHERE up.id IS NULL
    LOOP
        -- Criar perfil
        INSERT INTO user_profiles (
            id,
            church_id,
            full_name,
            email,
            role
        ) VALUES (
            v_user_id,
            v_church_id,
            COALESCE(SPLIT_PART(v_user_email, '@', 1), 'Usuário'),
            v_user_email,
            'owner'
        )
        ON CONFLICT (id) DO NOTHING;
        
        -- Criar permissões
        INSERT INTO user_permissions (
            user_id,
            church_id,
            can_manage_finances,
            can_manage_members,
            can_manage_events,
            can_view_reports,
            can_send_whatsapp
        ) VALUES (
            v_user_id,
            v_church_id,
            true,
            true,
            true,
            true,
            true
        )
        ON CONFLICT (user_id, church_id) DO NOTHING;
        
        v_user_count := COALESCE(v_user_count, 0) + 1;
        RAISE NOTICE 'Perfil criado para usuário: % (%)', v_user_email, v_user_id;
    END LOOP;
    
    IF v_user_count > 0 THEN
        RAISE NOTICE 'Total de perfis criados: %', v_user_count;
    ELSE
        RAISE NOTICE 'Nenhum usuário sem perfil encontrado.';
    END IF;
END $$;

-- ============================================
-- VERIFICAR RESULTADO
-- ============================================
SELECT 
    u.email,
    up.full_name,
    up.role,
    c.name as church_name
FROM auth.users u
JOIN user_profiles up ON u.id = up.id
LEFT JOIN churches c ON up.church_id = c.id
ORDER BY up.created_at DESC;

