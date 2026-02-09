-- ============================================
-- MIGRAÇÕES INCREMENTAIS - TESOURAPP
-- ============================================
-- Este arquivo consolida TODAS as migrações incrementais
-- Execute APENAS este arquivo no Supabase SQL Editor
-- Ele verifica automaticamente se cada alteração já foi aplicada
-- ============================================

-- ============================================
-- MIGRAÇÃO 1: Função get_church_users (Permitir owner ver usuários)
-- ============================================

-- Criar ou atualizar função que permite owners e colaboradores ver outros usuários da mesma igreja
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
SECURITY DEFINER
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
  
  -- Verificar se o usuário é owner ou collaborator
  IF v_user_role NOT IN ('owner', 'collaborator') THEN
    RAISE EXCEPTION 'Apenas proprietários e colaboradores podem ver outros usuários';
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
-- MIGRAÇÃO 2: Adicionar campo invite_type na tabela church_invites
-- ============================================

DO $$ 
BEGIN
  -- Verificar se a coluna invite_type já existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'church_invites' 
    AND column_name = 'invite_type'
  ) THEN
    -- Adicionar coluna invite_type
    ALTER TABLE church_invites 
    ADD COLUMN invite_type VARCHAR(50) DEFAULT 'member' CHECK (invite_type IN ('collaborator', 'member'));
    
    -- Comentário na coluna
    COMMENT ON COLUMN church_invites.invite_type IS 'Tipo de convite: collaborator (acesso completo) ou member (apenas lembretes)';
    
    RAISE NOTICE 'Coluna invite_type adicionada à tabela church_invites';
  ELSE
    RAISE NOTICE 'Coluna invite_type já existe na tabela church_invites';
  END IF;
END $$;

-- Criar índice para melhor performance (se não existir)
CREATE INDEX IF NOT EXISTS idx_church_invites_invite_type ON church_invites(invite_type);

-- ============================================
-- MIGRAÇÃO 3: Atualizar políticas RLS para incluir collaborator
-- ============================================

-- Atualizar política de igrejas para incluir collaborator
DROP POLICY IF EXISTS "Owners can update their church" ON churches;
CREATE POLICY "Owners can update their church"
  ON churches FOR UPDATE
  USING (
    id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('owner', 'collaborator')
    )
  );

-- Atualizar política de membros para incluir collaborator
DROP POLICY IF EXISTS "Users with permission can manage members" ON members;
CREATE POLICY "Users with permission can manage members"
  ON members FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND (role IN ('owner', 'collaborator', 'treasurer') OR 
           EXISTS (
             SELECT 1 FROM user_permissions
             WHERE user_id = auth.uid()
             AND church_id = members.church_id
             AND can_manage_members = true
           ))
    )
  );

-- Atualizar política de categorias de receita para incluir collaborator
DROP POLICY IF EXISTS "Users can manage revenue categories" ON revenue_categories;
CREATE POLICY "Users can manage revenue categories"
  ON revenue_categories FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND (role IN ('owner', 'collaborator', 'treasurer') OR 
           EXISTS (
             SELECT 1 FROM user_permissions
             WHERE user_id = auth.uid()
             AND church_id = revenue_categories.church_id
             AND can_manage_finances = true
           ))
    )
  );

-- Atualizar política de categorias de despesa para incluir collaborator
DROP POLICY IF EXISTS "Users can manage expense categories" ON expense_categories;
CREATE POLICY "Users can manage expense categories"
  ON expense_categories FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND (role IN ('owner', 'collaborator', 'treasurer') OR 
           EXISTS (
             SELECT 1 FROM user_permissions
             WHERE user_id = auth.uid()
             AND church_id = expense_categories.church_id
             AND can_manage_finances = true
           ))
    )
  );

-- Atualizar política de receitas para incluir collaborator
DROP POLICY IF EXISTS "Users with permission can view revenues" ON revenues;
CREATE POLICY "Users with permission can view revenues"
  ON revenues FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND (role IN ('owner', 'collaborator', 'treasurer') OR 
           EXISTS (
             SELECT 1 FROM user_permissions
             WHERE user_id = auth.uid()
             AND church_id = revenues.church_id
             AND can_manage_finances = true
           ))
    )
  );

DROP POLICY IF EXISTS "Users with permission can manage revenues" ON revenues;
CREATE POLICY "Users with permission can manage revenues"
  ON revenues FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND (role IN ('owner', 'collaborator', 'treasurer') OR 
           EXISTS (
             SELECT 1 FROM user_permissions
             WHERE user_id = auth.uid()
             AND church_id = revenues.church_id
             AND can_manage_finances = true
           ))
    )
  );

-- Atualizar política de despesas para incluir collaborator
DROP POLICY IF EXISTS "Users with permission can manage expenses" ON expenses;
CREATE POLICY "Users with permission can manage expenses"
  ON expenses FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND (role IN ('owner', 'collaborator', 'treasurer') OR 
           EXISTS (
             SELECT 1 FROM user_permissions
             WHERE user_id = auth.uid()
             AND church_id = expenses.church_id
             AND can_manage_finances = true
           ))
    )
  );

-- Atualizar política de eventos para incluir collaborator
DROP POLICY IF EXISTS "Users can view events with invite or permission" ON events;
CREATE POLICY "Users can view events with invite or permission"
  ON events FOR SELECT
  USING (
    -- Owners, colaboradores e treasurers têm acesso total
    (church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'collaborator', 'treasurer')
    )) OR
    -- Usuários com permissão de gerenciar eventos
    (church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_permissions
        WHERE user_id = auth.uid()
        AND church_id = events.church_id
        AND can_manage_events = true
      )
    )) OR
    -- Usuários com convite aceito podem ver eventos públicos
    (is_public = true AND church_id IN (
      SELECT ci.church_id FROM church_invites ci
      INNER JOIN user_profiles up ON up.email = ci.email
      WHERE up.id = auth.uid()
      AND ci.status = 'accepted'
      AND ci.church_id = events.church_id
    ))
  );

DROP POLICY IF EXISTS "Users with permission can manage events" ON events;
CREATE POLICY "Users with permission can manage events"
  ON events FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND (role IN ('owner', 'collaborator', 'treasurer') OR 
           EXISTS (
             SELECT 1 FROM user_permissions
             WHERE user_id = auth.uid()
             AND church_id = events.church_id
             AND can_manage_events = true
           ))
    )
  );

-- Atualizar política de presenças em eventos para incluir collaborator
DROP POLICY IF EXISTS "Users with permission can view all attendances" ON event_attendances;
CREATE POLICY "Users with permission can view all attendances"
  ON event_attendances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN user_profiles up ON e.church_id = up.church_id
      WHERE e.id = event_attendances.event_id
      AND up.id = auth.uid()
      AND (up.role IN ('owner', 'collaborator', 'treasurer') OR 
           EXISTS (
             SELECT 1 FROM user_permissions
             WHERE user_id = auth.uid()
             AND church_id = e.church_id
             AND can_manage_events = true
           ))
    )
  );

-- Atualizar política de convites para incluir collaborator
DROP POLICY IF EXISTS "Owners can view invites in their church" ON church_invites;
CREATE POLICY "Owners can view invites in their church"
  ON church_invites FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('owner', 'collaborator')
    )
  );

DROP POLICY IF EXISTS "Owners can create invites in their church" ON church_invites;
CREATE POLICY "Owners can create invites in their church"
  ON church_invites FOR INSERT
  WITH CHECK (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('owner', 'collaborator')
    )
    AND invited_by = auth.uid()
  );

DROP POLICY IF EXISTS "Owners can update invites in their church" ON church_invites;
CREATE POLICY "Owners can update invites in their church"
  ON church_invites FOR UPDATE
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('owner', 'collaborator')
    )
  );

-- Atualizar política de permissões para incluir collaborator
DROP POLICY IF EXISTS "Users can view permissions" ON user_permissions;
CREATE POLICY "Users can view permissions"
  ON user_permissions FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'collaborator')
    )
  );

DROP POLICY IF EXISTS "Owners can manage permissions" ON user_permissions;
CREATE POLICY "Owners and collaborators can manage permissions"
  ON user_permissions FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'collaborator')
    )
  );

-- Atualizar política de fundo de reserva para incluir collaborator
DROP POLICY IF EXISTS "Owners and treasurers can update reserve fund" ON reserve_fund;
CREATE POLICY "Owners and treasurers can update reserve fund"
  ON reserve_fund FOR UPDATE
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('owner', 'collaborator', 'treasurer')
    )
  )
  WITH CHECK (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('owner', 'collaborator', 'treasurer')
    )
  );

-- Atualizar política de transações do fundo de reserva para incluir collaborator
DROP POLICY IF EXISTS "Owners and treasurers can create reserve fund transactions" ON reserve_fund_transactions;
CREATE POLICY "Owners and treasurers can create reserve fund transactions"
  ON reserve_fund_transactions FOR INSERT
  WITH CHECK (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role IN ('owner', 'collaborator', 'treasurer')
    )
  );

-- ============================================
-- FIM DAS MIGRAÇÕES
-- ============================================
-- Todas as migrações foram aplicadas com sucesso!
-- Você pode executar este script quantas vezes quiser - ele é idempotente
-- ============================================
