-- ============================================
-- REMOÇÃO COMPLETA DE POLÍTICAS RECURSIVAS
-- Execute este script PRIMEIRO no Supabase SQL Editor
-- ============================================

-- DESABILITAR RLS TEMPORARIAMENTE para remover políticas
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE churches DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas de user_profiles (forçar)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON user_profiles';
    END LOOP;
END $$;

-- Remover TODAS as políticas de churches (forçar)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'churches') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON churches';
    END LOOP;
END $$;

-- REABILITAR RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CRIAR APENAS POLÍTICAS NECESSÁRIAS (SEM RECURSÃO)
-- ============================================

-- POLÍTICAS DE USER_PROFILES (SEM RECURSÃO)
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- POLÍTICAS DE CHURCHES (agora que user_profiles está seguro)
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
-- VERIFICAÇÃO
-- ============================================

-- Listar políticas criadas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'churches')
ORDER BY tablename, policyname;

-- ============================================
-- FIM
-- ============================================
-- Agora faça logout e login novamente no sistema

