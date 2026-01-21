-- ============================================
-- CORREÇÃO URGENTE: Remover TODAS as políticas recursivas
-- Execute este script PRIMEIRO no Supabase SQL Editor
-- ============================================

-- Remover TODAS as políticas de user_profiles (forçar remoção)
DROP POLICY IF EXISTS "Users can view profiles in their church" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Remover políticas que podem estar causando recursão em outras tabelas
-- que consultam user_profiles
DROP POLICY IF EXISTS "Users can view their own church" ON churches;
DROP POLICY IF EXISTS "Owners can update their church" ON churches;

-- Recriar APENAS as políticas necessárias SEM RECURSÃO
-- Política 1: Ver próprio perfil (SEM recursão)
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

-- Política 2: Inserir próprio perfil
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Política 3: Atualizar próprio perfil
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- Recriar políticas de churches (agora que user_profiles está seguro)
CREATE POLICY "Users can view their own church"
  ON churches FOR SELECT
  USING (
    id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their church"
  ON churches FOR UPDATE
  USING (
    id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- IMPORTANTE: 
-- - A política recursiva "Users can view profiles in their church" foi REMOVIDA
-- - Usuários podem ver APENAS seu próprio perfil via RLS
-- - Para ver outros perfis, use server-side logic na aplicação
-- ============================================

