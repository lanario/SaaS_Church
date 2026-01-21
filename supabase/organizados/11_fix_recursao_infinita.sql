-- ============================================
-- CORREÇÃO URGENTE: Recursão Infinita em RLS
-- ============================================
-- Este script remove a política recursiva que causa erro:
-- "infinite recursion detected in policy for relation user_profiles"

-- Remover política recursiva problemática
DROP POLICY IF EXISTS "Users can view profiles in their church" ON user_profiles;

-- Garantir que todas as políticas necessárias existem (SEM RECURSÃO)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- ============================================
-- EXPLICAÇÃO
-- ============================================
-- A política "Users can view profiles in their church" foi removida porque
-- ela tentava consultar a própria tabela user_profiles dentro da política RLS,
-- causando recursão infinita.

-- SOLUÇÃO:
-- - Usuários podem ver APENAS seu próprio perfil via RLS
-- - Para ver outros perfis da mesma igreja, a aplicação fará isso via
--   server-side logic após verificar permissões adequadas
-- - Isso é mais seguro e evita problemas de recursão

-- ============================================
-- FIM DA CORREÇÃO
-- ============================================

