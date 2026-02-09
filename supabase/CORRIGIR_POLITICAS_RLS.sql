-- ============================================
-- SCRIPT PARA CORRIGIR POLÍTICAS RLS
-- ============================================
-- Este script corrige as políticas RLS para permitir criação de igrejas e perfis
-- Resolve o problema de "não foi possível criar ou encontrar uma igreja"
-- ============================================

-- ============================================
-- POLICIES - CHURCHES (CORRIGIDAS)
-- ============================================

-- Remover políticas antigas
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'churches' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON churches';
    END LOOP;
END $$;

-- Permitir que QUALQUER usuário autenticado veja igrejas (necessário para buscar/criar)
CREATE POLICY "Authenticated users can view churches"
  ON churches FOR SELECT
  TO authenticated
  USING (true);

-- Permitir que QUALQUER usuário autenticado crie igrejas
CREATE POLICY "Authenticated users can create churches"
  ON churches FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permitir que owners atualizem suas igrejas
CREATE POLICY "Owners can update their church"
  ON churches FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- POLICIES - USER_PROFILES (CORRIGIDAS)
-- ============================================

-- Remover políticas antigas
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON user_profiles';
    END LOOP;
END $$;

-- IMPORTANTE: A política de visualizar próprio perfil deve vir primeiro
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Permitir que owners vejam outros usuários da mesma igreja
CREATE POLICY "Owners can view church users"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    id != auth.uid()
    AND church_id IN (
      SELECT church_id 
      FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'owner'
      LIMIT 1
    )
  );

-- Permitir que QUALQUER usuário autenticado crie seu próprio perfil
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Permitir que usuários atualizem seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- POLICIES - USER_PERMISSIONS (CORRIGIDAS)
-- ============================================

-- Remover políticas antigas
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_permissions' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON user_permissions';
    END LOOP;
END $$;

-- Permitir que usuários vejam suas próprias permissões
CREATE POLICY "Users can view own permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Permitir que owners vejam permissões de usuários da mesma igreja
CREATE POLICY "Owners can view church permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- Permitir que QUALQUER usuário autenticado crie suas próprias permissões
CREATE POLICY "Users can insert own permissions"
  ON user_permissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Permitir que usuários atualizem suas próprias permissões
CREATE POLICY "Users can update own permissions"
  ON user_permissions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Permitir que owners gerenciem permissões de usuários da mesma igreja
CREATE POLICY "Owners can manage church permissions"
  ON user_permissions FOR ALL
  TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  )
  WITH CHECK (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Após executar este script, as políticas RLS permitirão:
-- 1. Qualquer usuário autenticado pode criar igrejas
-- 2. Qualquer usuário autenticado pode ver igrejas (para buscar)
-- 3. Qualquer usuário autenticado pode criar seu próprio perfil
-- 4. Qualquer usuário autenticado pode criar suas próprias permissões
-- ============================================
