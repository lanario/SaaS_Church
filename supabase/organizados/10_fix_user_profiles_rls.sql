-- Fix: Remover recursão infinita nas políticas RLS de user_profiles
-- Este script remove a política recursiva que causa loop infinito

-- Remover política recursiva que causa loop infinito
DROP POLICY IF EXISTS "Users can view profiles in their church" ON user_profiles;

-- Garantir que a política de visualização do próprio perfil existe (SEM RECURSÃO)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

-- Garantir política de inserção
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Garantir política de atualização
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- IMPORTANTE: A política recursiva foi removida para evitar loop infinito
-- A visualização de outros perfis da mesma igreja será feita via server-side logic

