-- Corrigir função get_church_users para resolver ambiguidade na coluna 'role'
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
  
  -- Buscar church_id e role do usuário autenticado (especificar tabela explicitamente)
  SELECT up.church_id, up.role INTO v_church_id, v_user_role
  FROM user_profiles up
  WHERE up.id = v_user_id;
  
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
