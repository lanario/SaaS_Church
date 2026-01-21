-- ============================================
-- SCRIPT COMPLETO - TESOURAPP
-- Execute este arquivo completo no Supabase SQL Editor
-- Este script faz tudo: corrige RLS e cria perfis faltantes
-- ============================================

-- ============================================
-- PARTE 1: CORRIGIR POLÍTICAS RLS
-- ============================================

-- Remover TODAS as políticas problemáticas de user_profiles
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON user_profiles';
    END LOOP;
END $$;

-- Criar APENAS as políticas necessárias (SEM RECURSÃO)
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- Remover políticas problemáticas de churches
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'churches' 
        AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON churches';
    END LOOP;
END $$;

-- Recriar políticas de churches (agora que user_profiles está seguro)
CREATE POLICY "Users can view their own church"
  ON churches FOR SELECT
  USING (
    id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create churches"
  ON churches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners can update their church"
  ON churches FOR UPDATE
  USING (
    id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- PARTE 2: CRIAR PERFIS PARA USUÁRIOS SEM PERFIL
-- ============================================

DO $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_church_id UUID;
    v_user_count INTEGER := 0;
BEGIN
    -- Buscar ou criar igreja
    SELECT id INTO v_church_id FROM churches LIMIT 1;
    
    IF v_church_id IS NULL THEN
        -- Criar igreja padrão se não existir (usando service role bypass)
        -- Nota: Isso pode falhar por RLS, mas tentamos mesmo assim
        BEGIN
            INSERT INTO churches (name) VALUES ('Igreja Padrão') RETURNING id INTO v_church_id;
            RAISE NOTICE 'Igreja criada com ID: %', v_church_id;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Não foi possível criar igreja automaticamente. Crie uma igreja manualmente primeiro.';
        END;
    END IF;
    
    -- Se não conseguiu criar/buscar igreja, não pode continuar
    IF v_church_id IS NULL THEN
        RAISE NOTICE 'ATENÇÃO: Nenhuma igreja encontrada. Por favor, crie uma igreja manualmente primeiro.';
        RAISE NOTICE 'Execute: INSERT INTO churches (name) VALUES (''Nome da Igreja'') RETURNING id;';
        RETURN;
    END IF;
    
    -- Criar perfil para cada usuário sem perfil
    FOR v_user_id, v_user_email IN 
        SELECT u.id, u.email
        FROM auth.users u
        LEFT JOIN user_profiles up ON u.id = up.id
        WHERE up.id IS NULL
    LOOP
        BEGIN
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
            
            v_user_count := v_user_count + 1;
            RAISE NOTICE '✓ Perfil criado para: % (%)', v_user_email, v_user_id;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '✗ Erro ao criar perfil para %: %', v_user_email, SQLERRM;
        END;
    END LOOP;
    
    IF v_user_count > 0 THEN
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Total de perfis criados: %', v_user_count;
        RAISE NOTICE '========================================';
    ELSE
        RAISE NOTICE '✓ Todos os usuários já possuem perfil.';
    END IF;
END $$;

-- ============================================
-- PARTE 3: VERIFICAÇÃO FINAL
-- ============================================

-- Verificar políticas criadas
SELECT 
    'Políticas de user_profiles:' as verificacao,
    COUNT(*) as total_politicas
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public'
UNION ALL
SELECT 
    'Políticas de churches:' as verificacao,
    COUNT(*) as total_politicas
FROM pg_policies 
WHERE tablename = 'churches' AND schemaname = 'public'
UNION ALL
SELECT 
    'Usuários sem perfil:' as verificacao,
    COUNT(*) as total_politicas
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE up.id IS NULL;

-- Listar todos os perfis criados
SELECT 
    up.email,
    up.full_name,
    up.role,
    c.name as igreja,
    up.created_at as criado_em
FROM user_profiles up
LEFT JOIN churches c ON up.church_id = c.id
ORDER BY up.created_at DESC;

-- ============================================
-- PARTE 4: FUNÇÃO PARA OWNERS VEREM USUÁRIOS
-- ============================================

-- Criar função que permite owners ver outros usuários da mesma igreja
-- sem causar recursão no RLS
CREATE OR REPLACE FUNCTION get_church_users()
RETURNS TABLE (
  id UUID,
  full_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  role VARCHAR,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  can_manage_finances BOOLEAN,
  can_manage_members BOOLEAN,
  can_manage_events BOOLEAN,
  can_view_reports BOOLEAN,
  can_send_whatsapp BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER -- Permite que a função execute com privilégios do criador
AS $$
DECLARE
  v_user_id UUID;
  v_church_id UUID;
  v_user_role VARCHAR;
BEGIN
  -- Obter ID do usuário autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Buscar church_id e role do usuário autenticado
  SELECT church_id, role INTO v_church_id, v_user_role
  FROM user_profiles
  WHERE id = v_user_id;
  
  -- Verificar se o usuário é owner
  IF v_user_role != 'owner' THEN
    RAISE EXCEPTION 'Apenas proprietários podem ver outros usuários';
  END IF;
  
  IF v_church_id IS NULL THEN
    RAISE EXCEPTION 'Igreja não encontrada';
  END IF;
  
  -- Retornar usuários da mesma igreja
  RETURN QUERY
  SELECT 
    up.id,
    up.full_name,
    up.email,
    up.phone,
    up.role,
    up.avatar_url,
    up.created_at,
    COALESCE(uperm.can_manage_finances, false) as can_manage_finances,
    COALESCE(uperm.can_manage_members, false) as can_manage_members,
    COALESCE(uperm.can_manage_events, false) as can_manage_events,
    COALESCE(uperm.can_view_reports, false) as can_view_reports,
    COALESCE(uperm.can_send_whatsapp, false) as can_send_whatsapp
  FROM user_profiles up
  LEFT JOIN user_permissions uperm ON up.id = uperm.user_id AND up.church_id = uperm.church_id
  WHERE up.church_id = v_church_id
  ORDER BY up.created_at DESC;
END;
$$;

-- Permitir que usuários autenticados executem a função
GRANT EXECUTE ON FUNCTION get_church_users() TO authenticated;

-- ============================================
-- PARTE 5: CRIAR TABELA DE CONVITES
-- ============================================

-- Tabela de Convites para Membros
CREATE TABLE IF NOT EXISTS church_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(church_id, email, status)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_church_invites_church_id ON church_invites(church_id);
CREATE INDEX IF NOT EXISTS idx_church_invites_email ON church_invites(email);
CREATE INDEX IF NOT EXISTS idx_church_invites_token ON church_invites(token);
CREATE INDEX IF NOT EXISTS idx_church_invites_status ON church_invites(status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_church_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_church_invites_updated_at ON church_invites;
CREATE TRIGGER update_church_invites_updated_at
  BEFORE UPDATE ON church_invites
  FOR EACH ROW
  EXECUTE FUNCTION update_church_invites_updated_at();

-- Habilitar RLS
ALTER TABLE church_invites ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para convites
DROP POLICY IF EXISTS "Owners can view invites in their church" ON church_invites;
DROP POLICY IF EXISTS "Owners can create invites in their church" ON church_invites;
DROP POLICY IF EXISTS "Owners can update invites in their church" ON church_invites;
DROP POLICY IF EXISTS "Users can view their own invite" ON church_invites;
DROP POLICY IF EXISTS "Users can accept their invite" ON church_invites;

CREATE POLICY "Owners can view invites in their church"
  ON church_invites FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can create invites in their church"
  ON church_invites FOR INSERT
  WITH CHECK (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
    AND invited_by = auth.uid()
  );

CREATE POLICY "Owners can update invites in their church"
  ON church_invites FOR UPDATE
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Users can view their own invite"
  ON church_invites FOR SELECT
  USING (
    email IN (
      SELECT email FROM user_profiles
      WHERE id = auth.uid()
    )
    OR true -- Permitir ver convite pelo token
  );

CREATE POLICY "Users can accept their invite"
  ON church_invites FOR UPDATE
  USING (
    email IN (
      SELECT email FROM user_profiles
      WHERE id = auth.uid()
    )
    AND status = 'pending'
    AND expires_at > NOW()
  )
  WITH CHECK (
    status = 'accepted'
    AND accepted_at IS NOT NULL
  );

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Após executar:
-- 1. Faça logout e login novamente
-- 2. Verifique se o sistema funciona corretamente
-- ============================================

