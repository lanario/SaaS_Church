-- ============================================
-- SCRIPT PARA SIMPLIFICAR POLÍTICAS RLS
-- ============================================
-- Este script atualiza todas as políticas RLS para aceitar apenas 'owner'
-- Já que todos os usuários agora são 'owner' com permissões completas
-- ============================================

-- 1. Atualizar função get_church_users para aceitar apenas 'owner'
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
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  SELECT church_id, role INTO v_church_id, v_user_role
  FROM user_profiles
  WHERE id = v_user_id;
  
  -- Todos os usuários são 'owner', então apenas verificar se é 'owner'
  IF v_user_role != 'owner' THEN
    RAISE EXCEPTION 'Apenas proprietários podem ver outros usuários';
  END IF;
  
  IF v_church_id IS NULL THEN
    RAISE EXCEPTION 'Igreja não encontrada';
  END IF;
  
  RETURN QUERY
  SELECT 
    up.id,
    up.full_name,
    up.email,
    up.phone,
    up.role,
    up.avatar_url,
    up.created_at,
    COALESCE(uperm.can_manage_finances, true) as can_manage_finances,
    COALESCE(uperm.can_manage_members, true) as can_manage_members,
    COALESCE(uperm.can_manage_events, true) as can_manage_events,
    COALESCE(uperm.can_view_reports, true) as can_view_reports,
    COALESCE(uperm.can_send_whatsapp, true) as can_send_whatsapp
  FROM user_profiles up
  LEFT JOIN user_permissions uperm ON up.id = uperm.user_id AND up.church_id = uperm.church_id
  WHERE up.church_id = v_church_id
  ORDER BY up.created_at DESC;
END;
$$;

-- 2. Atualizar políticas de CHURCHES
DROP POLICY IF EXISTS "Owners can update their church" ON churches;
CREATE POLICY "Owners can update their church"
  ON churches FOR UPDATE
  USING (
    id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- 3. Atualizar políticas de MEMBERS
DROP POLICY IF EXISTS "Users with permission can manage members" ON members;
CREATE POLICY "Users with permission can manage members"
  ON members FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- 4. Atualizar políticas de REVENUE_CATEGORIES
DROP POLICY IF EXISTS "Users can manage revenue categories" ON revenue_categories;
CREATE POLICY "Users can manage revenue categories"
  ON revenue_categories FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- 5. Atualizar políticas de EXPENSE_CATEGORIES
DROP POLICY IF EXISTS "Users can manage expense categories" ON expense_categories;
CREATE POLICY "Users can manage expense categories"
  ON expense_categories FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- 6. Atualizar políticas de REVENUES
DROP POLICY IF EXISTS "Users with permission can view revenues" ON revenues;
DROP POLICY IF EXISTS "Users with permission can manage revenues" ON revenues;

CREATE POLICY "Users can view revenues"
  ON revenues FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

CREATE POLICY "Users can manage revenues"
  ON revenues FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- 7. Atualizar políticas de EXPENSES
DROP POLICY IF EXISTS "Users with permission can manage expenses" ON expenses;
CREATE POLICY "Users can manage expenses"
  ON expenses FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- 8. Atualizar políticas de EVENTS
DROP POLICY IF EXISTS "Users can view events with invite or permission" ON events;
DROP POLICY IF EXISTS "Users with permission can manage events" ON events;

CREATE POLICY "Users can view events"
  ON events FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

CREATE POLICY "Users can manage events"
  ON events FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- 9. Atualizar políticas de EVENT_ATTENDANCES
DROP POLICY IF EXISTS "Users with permission can view all attendances" ON event_attendances;
CREATE POLICY "Users can view all attendances"
  ON event_attendances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN user_profiles up ON e.church_id = up.church_id
      WHERE e.id = event_attendances.event_id
      AND up.id = auth.uid()
      AND up.role = 'owner'
    )
  );

-- 10. Atualizar políticas de CHURCH_INVITES
DROP POLICY IF EXISTS "Owners can view invites in their church" ON church_invites;
DROP POLICY IF EXISTS "Owners can create invites in their church" ON church_invites;
DROP POLICY IF EXISTS "Owners can update invites in their church" ON church_invites;

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

-- 11. Atualizar políticas de RESERVE_FUND
DROP POLICY IF EXISTS "Owners and treasurers can update reserve fund" ON reserve_fund;
CREATE POLICY "Owners can update reserve fund"
  ON reserve_fund FOR UPDATE
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- 12. Atualizar políticas de RESERVE_FUND_TRANSACTIONS
DROP POLICY IF EXISTS "Owners and treasurers can create reserve fund transactions" ON reserve_fund_transactions;
DROP POLICY IF EXISTS "Users with finance permission can create reserve fund transactions" ON reserve_fund_transactions;

CREATE POLICY "Owners can create reserve fund transactions"
  ON reserve_fund_transactions FOR INSERT
  WITH CHECK (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- 13. Atualizar políticas de USER_PERMISSIONS
DROP POLICY IF EXISTS "Users can view permissions" ON user_permissions;
DROP POLICY IF EXISTS "Owners and collaborators can manage permissions" ON user_permissions;

CREATE POLICY "Users can view permissions"
  ON user_permissions FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

CREATE POLICY "Owners can manage permissions"
  ON user_permissions FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Este script simplifica todas as políticas RLS
-- para aceitar apenas usuários com role 'owner'
-- ============================================
