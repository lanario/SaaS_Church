-- ============================================
-- VERIFICAR E CORRIGIR PERFIL DE USUÁRIO
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Verificar políticas atuais de user_profiles
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public'
ORDER BY policyname;

-- PASSO 2: Remover TODAS as políticas problemáticas de user_profiles
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
        RAISE NOTICE 'Removida política: %', r.policyname;
    END LOOP;
END $$;

-- PASSO 3: Criar APENAS as políticas necessárias (SEM RECURSÃO)
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- PASSO 4: Verificar políticas criadas
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' AND qual LIKE '%auth.uid()%' THEN 'OK - Sem recursão'
        WHEN cmd = 'INSERT' AND qual LIKE '%auth.uid()%' THEN 'OK'
        WHEN cmd = 'UPDATE' AND qual LIKE '%auth.uid()%' THEN 'OK'
        ELSE 'VERIFICAR'
    END as status
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public'
ORDER BY policyname;

-- ============================================
-- IMPORTANTE:
-- 1. Execute este script completo
-- 2. Faça logout e login novamente
-- 3. Verifique se o erro desapareceu
-- ============================================

