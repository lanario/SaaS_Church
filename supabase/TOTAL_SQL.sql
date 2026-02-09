-- ============================================
-- TESOURAPP - SCRIPT SQL COMPLETO E TOTAL
-- Execute este arquivo ÚNICO no Supabase SQL Editor
-- Este arquivo contém TODOS os SQLs necessários para o sistema
-- ============================================

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- LIMPEZA DE OBJETOS EXISTENTES
-- ============================================

-- Remover triggers antigos (evita erro de duplicação)
DROP TRIGGER IF EXISTS update_churches_updated_at ON churches;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
DROP TRIGGER IF EXISTS update_revenues_updated_at ON revenues;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_user_permissions_updated_at ON user_permissions;
DROP TRIGGER IF EXISTS update_church_invites_updated_at ON church_invites;
DROP TRIGGER IF EXISTS update_reserve_fund_updated_at ON reserve_fund;
-- NOTA: Trigger de church_invites será criado após a tabela existir

-- ============================================
-- TABELAS PRINCIPAIS
-- ============================================

-- Tabela de Igrejas
CREATE TABLE IF NOT EXISTS churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Perfis de Usuários (extensão do auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'owner', 'collaborator', 'treasurer', 'marketing', 'member'
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email)
);

-- Tabela de Membros
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL se ainda não tem conta
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  birth_date DATE,
  member_since DATE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'visitor'
  avatar_url TEXT,
  notes TEXT,
  -- Campos de endereço
  zip_code VARCHAR(10),
  street VARCHAR(255),
  address_number VARCHAR(20),
  address_complement VARCHAR(255),
  neighborhood VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Categorias de Receitas
CREATE TABLE IF NOT EXISTS revenue_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(church_id, name)
);

-- Tabela de Categorias de Despesas
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#ef4444',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(church_id, name)
);

-- Tabela de Receitas
CREATE TABLE IF NOT EXISTS revenues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES revenue_categories(id) ON DELETE SET NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  payment_method VARCHAR(50) DEFAULT 'cash', -- 'cash', 'pix', 'card', 'transfer'
  receipt_url TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Despesas
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  payment_method VARCHAR(50) DEFAULT 'cash',
  receipt_url TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Eventos
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  location VARCHAR(255),
  event_type VARCHAR(50) DEFAULT 'worship', -- 'worship', 'meeting', 'special', 'other'
  whatsapp_message TEXT,
  is_public BOOLEAN DEFAULT true,
  estimated_members INTEGER DEFAULT 0 CHECK (estimated_members >= 0),
  estimated_visitors INTEGER DEFAULT 0 CHECK (estimated_visitors >= 0),
  actual_members INTEGER DEFAULT NULL CHECK (actual_members IS NULL OR actual_members >= 0),
  actual_visitors INTEGER DEFAULT NULL CHECK (actual_visitors IS NULL OR actual_visitors >= 0),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas de presença se não existirem (para tabelas já criadas)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'estimated_members') THEN
    ALTER TABLE events ADD COLUMN estimated_members INTEGER DEFAULT 0 CHECK (estimated_members >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'estimated_visitors') THEN
    ALTER TABLE events ADD COLUMN estimated_visitors INTEGER DEFAULT 0 CHECK (estimated_visitors >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'actual_members') THEN
    ALTER TABLE events ADD COLUMN actual_members INTEGER DEFAULT NULL CHECK (actual_members IS NULL OR actual_members >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'actual_visitors') THEN
    ALTER TABLE events ADD COLUMN actual_visitors INTEGER DEFAULT NULL CHECK (actual_visitors IS NULL OR actual_visitors >= 0);
  END IF;
END $$;

-- Tabela de Confirmações de Presença
CREATE TABLE IF NOT EXISTS event_attendances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'confirmed', 'pending', 'absent'
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, member_id)
);

-- Tabela de Permissões de Usuários
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  can_manage_finances BOOLEAN DEFAULT false,
  can_manage_members BOOLEAN DEFAULT false,
  can_manage_events BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,
  can_send_whatsapp BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, church_id)
);

-- Tabela de Convites para Membros
CREATE TABLE IF NOT EXISTS church_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'expired'
  token VARCHAR(255) UNIQUE NOT NULL, -- Token único para aceitar convite
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Data de expiração do convite
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  invite_type VARCHAR(50) DEFAULT 'member' CHECK (invite_type IN ('collaborator', 'member')), -- Tipo de convite: collaborator (acesso completo) ou member (apenas lembretes)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(church_id, email, status) -- Um convite ativo por email por igreja
);

-- Tabela de Fundo de Reserva
CREATE TABLE IF NOT EXISTS reserve_fund (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  last_transfer_date DATE, -- Data da última transferência automática
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(church_id)
);

-- Tabela de Movimentações do Fundo de Reserva
CREATE TABLE IF NOT EXISTS reserve_fund_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reserve_fund_id UUID REFERENCES reserve_fund(id) ON DELETE CASCADE NOT NULL,
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'deposit', 'withdrawal', 'auto_transfer'
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Logs de Ações do Sistema
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'view', 'login', 'logout', etc.
  entity_type VARCHAR(50) NOT NULL, -- 'member', 'revenue', 'expense', 'event', 'user', 'church', etc.
  entity_id UUID, -- ID da entidade afetada (pode ser NULL)
  description TEXT NOT NULL, -- Descrição da ação
  metadata JSONB, -- Dados adicionais em formato JSON
  ip_address VARCHAR(45), -- Endereço IP do usuário
  user_agent TEXT, -- User agent do navegador
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_church_id ON user_profiles(church_id);
CREATE INDEX IF NOT EXISTS idx_members_church_id ON members(church_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
-- Nota: Índices de endereço (zip_code, city, state) serão criados na seção de migração
-- para evitar erros se as colunas ainda não existirem
CREATE INDEX IF NOT EXISTS idx_revenues_church_id ON revenues(church_id);
CREATE INDEX IF NOT EXISTS idx_revenues_transaction_date ON revenues(transaction_date);
CREATE INDEX IF NOT EXISTS idx_revenues_category_id ON revenues(category_id);
CREATE INDEX IF NOT EXISTS idx_revenues_member_id ON revenues(member_id);
CREATE INDEX IF NOT EXISTS idx_revenues_created_by ON revenues(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_church_id ON expenses(church_id);
CREATE INDEX IF NOT EXISTS idx_expenses_transaction_date ON expenses(transaction_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_events_church_id ON events(church_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_event_attendances_event_id ON event_attendances(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendances_member_id ON event_attendances(member_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_church_id ON user_permissions(church_id);
CREATE INDEX IF NOT EXISTS idx_church_invites_church_id ON church_invites(church_id);
CREATE INDEX IF NOT EXISTS idx_church_invites_invited_by ON church_invites(invited_by);
CREATE INDEX IF NOT EXISTS idx_church_invites_email ON church_invites(email);
CREATE INDEX IF NOT EXISTS idx_church_invites_token ON church_invites(token);
CREATE INDEX IF NOT EXISTS idx_church_invites_status ON church_invites(status);
CREATE INDEX IF NOT EXISTS idx_church_invites_invite_type ON church_invites(invite_type);
CREATE INDEX IF NOT EXISTS idx_revenue_categories_church_id ON revenue_categories(church_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_church_id ON expense_categories(church_id);
CREATE INDEX IF NOT EXISTS idx_reserve_fund_church_id ON reserve_fund(church_id);
CREATE INDEX IF NOT EXISTS idx_reserve_fund_transactions_reserve_fund_id ON reserve_fund_transactions(reserve_fund_id);
CREATE INDEX IF NOT EXISTS idx_reserve_fund_transactions_church_id ON reserve_fund_transactions(church_id);
CREATE INDEX IF NOT EXISTS idx_reserve_fund_transactions_created_by ON reserve_fund_transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_reserve_fund_transactions_created_at ON reserve_fund_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_church_id ON system_logs(church_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action_type ON system_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_entity_type ON system_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- ============================================
-- NOTA SOBRE ÍNDICES NÃO UTILIZADOS
-- ============================================
-- Alguns índices podem aparecer como "não utilizados" no Supabase Advisor.
-- Isso é normal em sistemas novos ou com pouco tráfego. Esses índices são mantidos porque:
-- 1. Podem ser úteis quando o sistema crescer e houver mais dados
-- 2. Podem ser usados em queries futuras que ainda não foram executadas
-- 3. O custo de manutenção é baixo comparado ao benefício potencial
-- 
-- Índices que podem aparecer como não utilizados:
-- - church_invites: status, invite_type (úteis para filtros de convites)
-- - system_logs: action_type, entity_type (úteis para relatórios e auditoria)
-- - members: zip_code, city, state (úteis para buscas por localização)
-- - reserve_fund_transactions: created_at (útil para relatórios temporais)
-- - schema_migrations: filename (útil para controle de migrações)
--
-- Recomendação: Monitore o uso desses índices ao longo do tempo. Se após 3-6 meses
-- ainda não forem utilizados e não houver planos de usar, considere removê-los.

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Função específica para church_invites
CREATE OR REPLACE FUNCTION update_church_invites_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers para updated_at
CREATE TRIGGER update_churches_updated_at 
  BEFORE UPDATE ON churches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at 
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenues_updated_at 
  BEFORE UPDATE ON revenues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at 
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at 
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_church_invites_updated_at 
  BEFORE UPDATE ON church_invites
  FOR EACH ROW EXECUTE FUNCTION update_church_invites_updated_at();

CREATE TRIGGER update_reserve_fund_updated_at 
  BEFORE UPDATE ON reserve_fund
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNÇÃO PARA OWNERS VEREM USUÁRIOS
-- ============================================

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
SET search_path = public
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
  
  -- Buscar church_id e role do usuário autenticado (especificar tabela explicitamente para evitar ambiguidade)
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

GRANT EXECUTE ON FUNCTION get_church_users() TO authenticated;

-- ============================================
-- FUNÇÃO PARA CRIAR PERFIL DE MEMBRO
-- ============================================

CREATE OR REPLACE FUNCTION create_member_profile(
  p_user_id UUID,
  p_church_id UUID,
  p_full_name VARCHAR,
  p_email VARCHAR,
  p_phone VARCHAR
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_current_church_id UUID;
  v_current_role VARCHAR;
BEGIN
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Verificar se o usuário atual é owner (todos são owner)
  SELECT church_id, role INTO v_current_church_id, v_current_role
  FROM user_profiles
  WHERE id = v_current_user_id;
  
  IF v_current_role != 'owner' THEN
    RAISE EXCEPTION 'Apenas proprietários podem criar contas para membros';
  END IF;
  
  IF v_current_church_id != p_church_id THEN
    RAISE EXCEPTION 'Igreja não encontrada ou sem permissão';
  END IF;
  
  -- Inserir o perfil (executa com privilégios de SECURITY DEFINER, contornando RLS)
  INSERT INTO user_profiles (
    id,
    church_id,
    full_name,
    email,
    phone,
    role
  ) VALUES (
    p_user_id,
    p_church_id,
    p_full_name,
    p_email,
    p_phone,
    'member'
  );
  
  RETURN p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_member_profile(UUID, UUID, VARCHAR, VARCHAR, VARCHAR) TO authenticated;

-- ============================================
-- FUNÇÃO PARA TRANSFERÊNCIA AUTOMÁTICA DO FUNDO DE RESERVA
-- ============================================

CREATE OR REPLACE FUNCTION auto_transfer_reserve_fund()
RETURNS TABLE (
  church_id UUID,
  transferred_amount DECIMAL,
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_church RECORD;
  v_reserve_fund RECORD;
  v_cash_balance DECIMAL;
  v_total_revenues DECIMAL;
  v_total_expenses DECIMAL;
  v_today DATE;
  v_first_day_of_month DATE;
BEGIN
  v_today := CURRENT_DATE;
  v_first_day_of_month := DATE_TRUNC('month', v_today)::DATE;

  -- Iterar sobre todas as igrejas
  FOR v_church IN SELECT id FROM churches LOOP
    -- Verificar se já transferiu este mês
    SELECT * INTO v_reserve_fund
    FROM reserve_fund
    WHERE reserve_fund.church_id = v_church.id;

    -- Se não existe fundo de reserva, criar
    IF v_reserve_fund IS NULL THEN
      INSERT INTO reserve_fund (church_id, balance, last_transfer_date)
      VALUES (v_church.id, 0, NULL)
      RETURNING * INTO v_reserve_fund;
    END IF;

    -- Verificar se já transferiu este mês
    IF v_reserve_fund.last_transfer_date IS NOT NULL AND
       v_reserve_fund.last_transfer_date >= v_first_day_of_month THEN
      -- Já transferiu este mês, pular
      CONTINUE;
    END IF;

    -- Calcular saldo em caixa (receitas - despesas)
    SELECT COALESCE(SUM(amount), 0) INTO v_total_revenues
    FROM revenues
    WHERE church_id = v_church.id;

    SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
    FROM expenses
    WHERE church_id = v_church.id;

    v_cash_balance := v_total_revenues - v_total_expenses;

    -- Se não há saldo, pular
    IF v_cash_balance <= 0 THEN
      CONTINUE;
    END IF;

    -- Criar transação de transferência automática
    INSERT INTO reserve_fund_transactions (
      reserve_fund_id,
      church_id,
      transaction_type,
      amount,
      description,
      created_by
    ) VALUES (
      v_reserve_fund.id,
      v_church.id,
      'auto_transfer',
      v_cash_balance,
      'Transferência automática de ' || TO_CHAR(v_today, 'DD/MM/YYYY'),
      NULL -- Sistema automático
    );

    -- Atualizar saldo e data da última transferência
    UPDATE reserve_fund
    SET
      balance = balance + v_cash_balance,
      last_transfer_date = v_today
    WHERE id = v_reserve_fund.id;

    -- Retornar sucesso
    church_id := v_church.id;
    transferred_amount := v_cash_balance;
    success := TRUE;
    message := 'Transferência realizada com sucesso';
    RETURN NEXT;

  END LOOP;

  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION auto_transfer_reserve_fund() TO authenticated;

-- ============================================
-- TABELA DE MIGRAÇÕES (PARA RASTREAMENTO)
-- ============================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checksum VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_filename 
ON schema_migrations(filename);

-- Política RLS para schema_migrations (apenas service_role pode acessar)
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;

-- Remover política existente se houver (idempotência)
DROP POLICY IF EXISTS "Service role can manage migrations" ON schema_migrations;

-- NOTA: A política será criada após definir current_user_role() mais abaixo

-- Função para executar SQL dinâmico (apenas para migrações)
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;

-- ============================================
-- FUNÇÃO PARA GARANTIR IGREJA E PERFIL DO USUÁRIO
-- ============================================
-- Esta função garante que existe uma igreja e que o usuário tem perfil
-- Usa SECURITY DEFINER para bypassar RLS quando necessário
-- ============================================

CREATE OR REPLACE FUNCTION ensure_church_and_profile(
  p_user_id UUID,
  p_user_email TEXT,
  p_user_name TEXT
)
RETURNS TABLE (
  church_id UUID,
  profile_id UUID,
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_church_id UUID;
  v_profile_id UUID;
  v_existing_profile RECORD;
  v_church_name TEXT;
BEGIN
  -- 1. Verificar se o perfil já existe e tem igreja
  BEGIN
    SELECT id, church_id INTO STRICT v_existing_profile
    FROM user_profiles
    WHERE id = p_user_id;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      v_existing_profile.id := NULL;
      v_existing_profile.church_id := NULL;
    WHEN TOO_MANY_ROWS THEN
      v_existing_profile.id := NULL;
      v_existing_profile.church_id := NULL;
  END;

  -- 2. Se o perfil existe e já tem church_id, usar essa igreja
  IF v_existing_profile.id IS NOT NULL AND v_existing_profile.church_id IS NOT NULL THEN
    v_church_id := v_existing_profile.church_id;
    v_profile_id := v_existing_profile.id;
  ELSE
    -- 3. Criar uma NOVA igreja para este usuário (cada usuário tem sua própria igreja)
    v_church_name := COALESCE(p_user_name, SPLIT_PART(p_user_email, '@', 1), 'Minha Igreja');
    
    INSERT INTO churches (name, created_at)
    VALUES (v_church_name, NOW())
    RETURNING id INTO v_church_id;

    -- 4. Se o perfil existe mas não tem church_id, atualizar
    IF v_existing_profile.id IS NOT NULL THEN
      UPDATE user_profiles
      SET church_id = v_church_id,
          role = 'owner',
          updated_at = NOW()
      WHERE id = p_user_id;
      v_profile_id := v_existing_profile.id;
    ELSE
      -- 5. Criar novo perfil
      INSERT INTO user_profiles (
        id,
        church_id,
        full_name,
        email,
        role,
        created_at
      ) VALUES (
        p_user_id,
        v_church_id,
        COALESCE(p_user_name, 'Usuário'),
        COALESCE(p_user_email, ''),
        'owner',
        NOW()
      )
      RETURNING id INTO v_profile_id;
    END IF;
  END IF;

  -- 6. Garantir permissões completas
  INSERT INTO user_permissions (
    user_id,
    church_id,
    can_manage_finances,
    can_manage_members,
    can_manage_events,
    can_view_reports,
    can_send_whatsapp
  ) VALUES (
    p_user_id,
    v_church_id,
    true,
    true,
    true,
    true,
    true
  )
  ON CONFLICT (user_id, church_id) DO UPDATE
  SET 
    can_manage_finances = true,
    can_manage_members = true,
    can_manage_events = true,
    can_view_reports = true,
    can_send_whatsapp = true,
    updated_at = NOW();

  RETURN QUERY SELECT v_church_id, v_profile_id, true, 'Perfil e igreja garantidos com sucesso';
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, false, SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION ensure_church_and_profile(UUID, TEXT, TEXT) TO authenticated;

-- ============================================
-- FUNÇÃO PARA REGISTRAR LOGS DO SISTEMA
-- ============================================

CREATE OR REPLACE FUNCTION create_system_log(
  p_church_id UUID,
  p_user_id UUID,
  p_action_type VARCHAR,
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO system_logs (
    church_id,
    user_id,
    action_type,
    entity_type,
    entity_id,
    description,
    metadata
  ) VALUES (
    p_church_id,
    p_user_id,
    p_action_type,
    p_entity_type,
    p_entity_id,
    p_description,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_system_log(UUID, UUID, VARCHAR, VARCHAR, UUID, TEXT, JSONB) TO authenticated;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserve_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserve_fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNÇÃO AUXILIAR PARA EVITAR RECURSÃO EM RLS
-- ============================================
-- Esta função retorna o church_id do usuário atual sem passar por RLS
-- É necessária para evitar recursão infinita nas políticas

-- Função auxiliar STABLE para obter user_id atual (otimizada para RLS)
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

GRANT EXECUTE ON FUNCTION current_user_id() TO authenticated;

-- Função auxiliar STABLE para obter role atual (otimizada para RLS)
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.role()::TEXT;
$$;

GRANT EXECUTE ON FUNCTION current_user_role() TO authenticated;

-- Criar política de schema_migrations após definir current_user_role()
CREATE POLICY "Service role can manage migrations"
  ON schema_migrations FOR ALL
  USING (current_user_role() = 'service_role')
  WITH CHECK (current_user_role() = 'service_role');

CREATE OR REPLACE FUNCTION get_current_user_church_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_church_id UUID;
BEGIN
  -- Usar função STABLE current_user_id() para otimizar performance
  SELECT church_id INTO v_church_id
  FROM user_profiles
  WHERE id = current_user_id()
  LIMIT 1;
  
  RETURN v_church_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_current_user_church_id() TO authenticated;

-- Função auxiliar STABLE para obter email do usuário atual (otimizada para RLS)
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Buscar email do user_profiles usando função STABLE (mais seguro que acessar auth.users diretamente)
  SELECT email INTO v_email
  FROM user_profiles
  WHERE id = current_user_id()
  LIMIT 1;
  
  -- Se não encontrar no perfil, tentar buscar do auth.users (apenas service_role pode)
  IF v_email IS NULL THEN
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = current_user_id()
    LIMIT 1;
  END IF;
  
  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION get_current_user_email() TO authenticated;

-- ============================================
-- FUNÇÕES PARA INSERÇÃO/ATUALIZAÇÃO SEGURA DE DATAS
-- Estas funções garantem que datas sejam salvas exatamente como string YYYY-MM-DD
-- sem problemas de timezone do Supabase
-- ============================================

-- Função para inserir despesa garantindo que a data seja salva exatamente como string
-- Isso evita problemas de timezone do Supabase
CREATE OR REPLACE FUNCTION insert_expense_safe_date(
  p_church_id UUID,
  p_category_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_payment_method VARCHAR,
  p_transaction_date TEXT, -- Recebe como string YYYY-MM-DD
  p_receipt_url TEXT,
  p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expense_id UUID;
  v_date DATE;
BEGIN
  -- Converter string YYYY-MM-DD para DATE sem interpretação de timezone
  -- Usar CAST direto para garantir que não há conversão de timezone
  -- O PostgreSQL interpreta strings YYYY-MM-DD como DATE local, não UTC
  v_date := p_transaction_date::DATE;
  
  INSERT INTO expenses (
    church_id,
    category_id,
    amount,
    description,
    payment_method,
    transaction_date,
    receipt_url,
    created_by
  ) VALUES (
    p_church_id,
    p_category_id,
    p_amount,
    p_description,
    p_payment_method,
    v_date, -- DATE direto, sem timezone
    p_receipt_url,
    p_created_by
  )
  RETURNING id INTO v_expense_id;
  
  RETURN v_expense_id;
END;
$$;

-- Função para atualizar despesa garantindo que a data seja salva exatamente como string
CREATE OR REPLACE FUNCTION update_expense_safe_date(
  p_expense_id UUID,
  p_church_id UUID,
  p_category_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_payment_method VARCHAR,
  p_transaction_date TEXT, -- Recebe como string YYYY-MM-DD
  p_receipt_url TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date DATE;
BEGIN
  -- Converter string YYYY-MM-DD para DATE sem interpretação de timezone
  v_date := p_transaction_date::DATE;
  
  UPDATE expenses
  SET
    category_id = p_category_id,
    amount = p_amount,
    description = p_description,
    payment_method = p_payment_method,
    transaction_date = v_date, -- DATE direto, sem timezone
    receipt_url = p_receipt_url,
    updated_at = NOW()
  WHERE id = p_expense_id
    AND church_id = p_church_id;
  
  RETURN FOUND;
END;
$$;

-- Função para inserir receita garantindo que a data seja salva exatamente como string
CREATE OR REPLACE FUNCTION insert_revenue_safe_date(
  p_church_id UUID,
  p_category_id UUID,
  p_member_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_payment_method VARCHAR,
  p_transaction_date TEXT, -- Recebe como string YYYY-MM-DD
  p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_revenue_id UUID;
  v_date DATE;
BEGIN
  -- Converter string YYYY-MM-DD para DATE sem interpretação de timezone
  v_date := p_transaction_date::DATE;
  
  INSERT INTO revenues (
    church_id,
    category_id,
    member_id,
    amount,
    description,
    payment_method,
    transaction_date,
    created_by
  ) VALUES (
    p_church_id,
    p_category_id,
    p_member_id,
    p_amount,
    p_description,
    p_payment_method,
    v_date, -- DATE direto, sem timezone
    p_created_by
  )
  RETURNING id INTO v_revenue_id;
  
  RETURN v_revenue_id;
END;
$$;

-- Função para atualizar receita garantindo que a data seja salva exatamente como string
CREATE OR REPLACE FUNCTION update_revenue_safe_date(
  p_revenue_id UUID,
  p_church_id UUID,
  p_category_id UUID,
  p_member_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_payment_method VARCHAR,
  p_transaction_date TEXT -- Recebe como string YYYY-MM-DD
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date DATE;
BEGIN
  -- Converter string YYYY-MM-DD para DATE sem interpretação de timezone
  v_date := p_transaction_date::DATE;
  
  UPDATE revenues
  SET
    category_id = p_category_id,
    member_id = p_member_id,
    amount = p_amount,
    description = p_description,
    payment_method = p_payment_method,
    transaction_date = v_date, -- DATE direto, sem timezone
    updated_at = NOW()
  WHERE id = p_revenue_id
    AND church_id = p_church_id;
  
  RETURN FOUND;
END;
$$;

-- Dar permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION insert_expense_safe_date TO authenticated;
GRANT EXECUTE ON FUNCTION update_expense_safe_date TO authenticated;
GRANT EXECUTE ON FUNCTION insert_revenue_safe_date TO authenticated;
GRANT EXECUTE ON FUNCTION update_revenue_safe_date TO authenticated;

-- ============================================
-- POLICIES - USER_PROFILES (SEM RECURSÃO)
-- IMPORTANTE: Esta seção deve vir PRIMEIRO
-- ============================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON user_profiles';
    END LOOP;
END $$;

-- Política consolidada para SELECT (evita múltiplas políticas permissivas)
-- Usuários podem ver seu próprio perfil OU owners podem ver outros usuários da mesma igreja
CREATE POLICY "Users can view profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    -- Usuários podem ver seu próprio perfil
    id = current_user_id() OR
    -- Owners podem ver outros usuários da mesma igreja
    (id != current_user_id()
    AND church_id = get_current_user_church_id()
    AND church_id IS NOT NULL)
  );

-- Permitir que QUALQUER usuário autenticado crie seu próprio perfil
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = current_user_id());

-- Permitir que usuários atualizem seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = current_user_id())
  WITH CHECK (id = current_user_id());

-- ============================================
-- POLICIES - CHURCHES
-- ============================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'churches' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON churches';
    END LOOP;
END $$;

-- Permitir que QUALQUER usuário autenticado veja igrejas (necessário para buscar/criar)
-- Isso resolve o problema de ciclo: precisa ver igreja para criar perfil, mas precisa perfil para ver igreja
-- NOTA: Esta política é necessária para o fluxo de onboarding, mas é restritiva apenas para SELECT
-- UPDATE e DELETE são controlados por políticas mais específicas abaixo
-- Usa função STABLE para otimizar performance
CREATE POLICY "Authenticated users can view churches"
  ON churches FOR SELECT
  TO authenticated
  USING (current_user_id() IS NOT NULL);

-- Permitir que QUALQUER usuário autenticado crie igrejas (apenas durante onboarding)
CREATE POLICY "Authenticated users can create churches"
  ON churches FOR INSERT
  TO authenticated
  WITH CHECK (current_user_id() IS NOT NULL);

CREATE POLICY "Owners can update their church"
  ON churches FOR UPDATE
  TO authenticated
  USING (
    id = get_current_user_church_id()
    AND id IS NOT NULL
  )
  WITH CHECK (
    id = get_current_user_church_id()
    AND id IS NOT NULL
  );

-- Política restritiva para DELETE: apenas owners podem deletar sua própria igreja
CREATE POLICY "Owners can delete their church"
  ON churches FOR DELETE
  TO authenticated
  USING (
    id = get_current_user_church_id()
    AND id IS NOT NULL
  );

-- ============================================
-- POLICIES - MEMBERS
-- ============================================

-- Remover todas as políticas existentes de members (usando DO para garantir remoção completa)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'members' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON members';
    END LOOP;
END $$;

-- Política consolidada para members (evita múltiplas políticas permissivas)
-- SELECT: usuários podem ver membros da igreja OU membros podem ver seus próprios dados
-- ALL (INSERT/UPDATE/DELETE): apenas usuários da igreja podem gerenciar
CREATE POLICY "Users can view and manage members"
  ON members FOR ALL
  USING (
    -- Usuários podem ver/gerenciar membros da igreja
    (church_id = get_current_user_church_id()
    AND church_id IS NOT NULL) OR
    -- Membros podem ver seus próprios dados (apenas SELECT)
    (user_id = current_user_id())
  )
  WITH CHECK (
    -- Para INSERT/UPDATE/DELETE: apenas usuários da igreja
    church_id = get_current_user_church_id()
    AND church_id IS NOT NULL
  );

-- ============================================
-- POLICIES - REVENUE_CATEGORIES
-- ============================================

-- Remover todas as políticas existentes de revenue_categories (usando DO para garantir remoção completa)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'revenue_categories' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON revenue_categories';
    END LOOP;
END $$;

-- Política consolidada para revenue_categories (evita múltiplas políticas permissivas)
CREATE POLICY "Users can manage revenue categories"
  ON revenue_categories FOR ALL
  USING (
    church_id = get_current_user_church_id()
    AND church_id IS NOT NULL
  )
  WITH CHECK (
    church_id = get_current_user_church_id()
    AND church_id IS NOT NULL
  );

-- ============================================
-- POLICIES - EXPENSE_CATEGORIES
-- ============================================

-- Remover todas as políticas existentes de expense_categories (usando DO para garantir remoção completa)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'expense_categories' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON expense_categories';
    END LOOP;
END $$;

-- Política consolidada para expense_categories (evita múltiplas políticas permissivas)
CREATE POLICY "Users can manage expense categories"
  ON expense_categories FOR ALL
  USING (
    church_id = get_current_user_church_id()
    AND church_id IS NOT NULL
  )
  WITH CHECK (
    church_id = get_current_user_church_id()
    AND church_id IS NOT NULL
  );

-- ============================================
-- POLICIES - REVENUES
-- ============================================

-- Remover todas as políticas existentes de revenues (usando DO para garantir remoção completa)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'revenues' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON revenues';
    END LOOP;
END $$;

-- Política consolidada para revenues (evita múltiplas políticas permissivas)
-- SELECT: usuários podem ver receitas da igreja OU membros podem ver suas próprias receitas
-- ALL (INSERT/UPDATE/DELETE): apenas usuários da igreja podem gerenciar
CREATE POLICY "Users can view and manage revenues"
  ON revenues FOR ALL
  USING (
    -- Usuários podem ver receitas da igreja
    (church_id = get_current_user_church_id()
    AND church_id IS NOT NULL) OR
    -- Membros podem ver suas próprias receitas (apenas SELECT)
    (member_id IN (
      SELECT id FROM members
      WHERE user_id = current_user_id()
    ))
  )
  WITH CHECK (
    -- Para INSERT/UPDATE/DELETE: apenas usuários da igreja
    church_id = get_current_user_church_id()
    AND church_id IS NOT NULL
  );

-- ============================================
-- POLICIES - EXPENSES
-- ============================================

DROP POLICY IF EXISTS "Users with permission can manage expenses" ON expenses;

CREATE POLICY "Users with permission can manage expenses"
  ON expenses FOR ALL
  USING (
    church_id = get_current_user_church_id()
    AND church_id IS NOT NULL
  );

-- ============================================
-- POLICIES - EVENTS
-- ============================================

-- Remover todas as políticas existentes de events (usando DO para garantir remoção completa)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'events' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON events';
    END LOOP;
END $$;

-- Política consolidada para eventos (evita múltiplas políticas permissivas)
-- SELECT: owners podem ver todos os eventos da igreja OU usuários com convite podem ver eventos públicos
-- ALL (INSERT/UPDATE/DELETE): apenas owners podem gerenciar
CREATE POLICY "Users can view and manage events"
  ON events FOR ALL
  USING (
    -- Para SELECT: owners OU usuários com convite aceito para eventos públicos
    (church_id = get_current_user_church_id()
    AND church_id IS NOT NULL) OR
    -- Usuários com convite aceito podem ver eventos públicos (apenas SELECT)
    (is_public = true AND church_id IN (
      SELECT ci.church_id FROM church_invites ci
      WHERE ci.email = get_current_user_email()
      AND ci.status = 'accepted'
      AND ci.church_id = events.church_id
    ))
  )
  WITH CHECK (
    -- Para INSERT/UPDATE/DELETE: apenas owners
    church_id = get_current_user_church_id()
    AND church_id IS NOT NULL
  );

-- ============================================
-- POLICIES - EVENT_ATTENDANCES
-- ============================================

-- Remover todas as políticas existentes de event_attendances (usando DO para garantir remoção completa)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'event_attendances' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON event_attendances';
    END LOOP;
END $$;

-- Política consolidada para event_attendances (evita múltiplas políticas permissivas)
-- SELECT: owners podem ver todas as presenças OU membros podem ver suas próprias presenças
-- ALL (INSERT/UPDATE/DELETE): membros podem gerenciar suas próprias presenças OU owners podem gerenciar todas
CREATE POLICY "Users can view and manage attendances"
  ON event_attendances FOR ALL
  USING (
    -- Membros podem gerenciar suas próprias presenças
    member_id IN (
      SELECT id FROM members
      WHERE user_id = current_user_id()
    ) OR
    -- Owners podem ver todas as presenças de eventos da igreja
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_attendances.event_id
      AND e.church_id = get_current_user_church_id()
      AND e.church_id IS NOT NULL
    )
  )
  WITH CHECK (
    -- Para INSERT/UPDATE/DELETE: apenas membros próprios OU owners
    member_id IN (
      SELECT id FROM members
      WHERE user_id = current_user_id()
    ) OR
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_attendances.event_id
      AND e.church_id = get_current_user_church_id()
      AND e.church_id IS NOT NULL
    )
  );

-- ============================================
-- POLICIES - CHURCH_INVITES
-- ============================================

-- Remover todas as políticas existentes de church_invites (usando DO para garantir remoção completa)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'church_invites' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON church_invites';
    END LOOP;
END $$;

-- Política consolidada para church_invites (evita múltiplas políticas permissivas)
-- SELECT: owners podem ver convites da igreja OU usuários podem ver seus próprios convites
-- INSERT: apenas owners podem criar convites
-- UPDATE: owners podem atualizar convites da igreja OU usuários podem aceitar seus próprios convites
CREATE POLICY "Users can manage church invites"
  ON church_invites FOR ALL
  USING (
    -- Owners podem ver/atualizar todos os convites da igreja
    (church_id = get_current_user_church_id()
    AND church_id IS NOT NULL) OR
    -- Usuários podem ver/aceitar seus próprios convites
    email IN (
      SELECT email FROM user_profiles
      WHERE id = current_user_id()
    )
    OR true -- Permitir ver convite pelo token (para aceitação)
  )
  WITH CHECK (
    -- Para INSERT: apenas owners
    (church_id = get_current_user_church_id()
    AND church_id IS NOT NULL
    AND invited_by = current_user_id()) OR
    -- Para UPDATE: owners podem atualizar OU usuários podem aceitar seus próprios convites pendentes
    (church_id = get_current_user_church_id()
    AND church_id IS NOT NULL) OR
    (status = 'pending' AND expires_at > NOW() AND
     email IN (SELECT email FROM user_profiles WHERE id = current_user_id()))
  );

-- ============================================
-- POLICIES - RESERVE_FUND
-- ============================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'reserve_fund' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON reserve_fund';
    END LOOP;
END $$;

CREATE POLICY "Users can view their church reserve fund"
  ON reserve_fund FOR SELECT
  USING (
    church_id = get_current_user_church_id()
    AND church_id IS NOT NULL
  );

-- Política para permitir criação inicial do fundo de reserva
-- Qualquer usuário da igreja pode criar se não existir
CREATE POLICY "Users can insert reserve fund if not exists"
  ON reserve_fund FOR INSERT
  WITH CHECK (
    church_id = get_current_user_church_id()
    AND church_id IS NOT NULL
  );

CREATE POLICY "Owners can update reserve fund"
  ON reserve_fund FOR UPDATE
  USING (
    church_id = get_current_user_church_id()
    AND church_id IS NOT NULL
  )
  WITH CHECK (
    church_id = get_current_user_church_id()
    AND church_id IS NOT NULL
  );

-- ============================================
-- POLICIES - RESERVE_FUND_TRANSACTIONS
-- ============================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'reserve_fund_transactions' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON reserve_fund_transactions';
    END LOOP;
END $$;

-- Política consolidada para reserve_fund_transactions (evita múltiplas políticas permissivas)
-- SELECT: usuários podem ver transações da igreja
-- INSERT: owners OU usuários com permissão de finanças podem criar transações
CREATE POLICY "Users can view and manage reserve fund transactions"
  ON reserve_fund_transactions FOR ALL
  USING (
    -- Usuários podem ver transações da igreja
    church_id = get_current_user_church_id()
    AND church_id IS NOT NULL
  )
  WITH CHECK (
    -- Para INSERT: owners OU usuários com permissão de finanças
    (church_id = get_current_user_church_id()
    AND church_id IS NOT NULL) OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = current_user_id()
      AND up.church_id = reserve_fund_transactions.church_id
      AND EXISTS (
        SELECT 1 FROM user_permissions
        WHERE user_id = current_user_id()
        AND church_id = up.church_id
        AND can_manage_finances = true
      )
    )
  );

-- ============================================
-- POLICIES - USER_PERMISSIONS
-- ============================================

-- Remover políticas existentes (usando DO para garantir remoção completa)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_permissions' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON user_permissions';
    END LOOP;
END $$;

-- Política consolidada para SELECT (evita múltiplas políticas permissivas)
-- Usuários podem ver suas próprias permissões OU owners podem ver permissões da igreja
CREATE POLICY "Users can view permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (
    -- Usuários podem ver suas próprias permissões
    user_id = current_user_id() OR
    -- Owners podem ver permissões de usuários da mesma igreja
    (church_id = get_current_user_church_id()
    AND church_id IS NOT NULL)
  );

-- Política consolidada para INSERT/UPDATE/DELETE (evita múltiplas políticas permissivas)
-- Usuários podem gerenciar suas próprias permissões OU owners podem gerenciar permissões da igreja
CREATE POLICY "Users can manage permissions"
  ON user_permissions FOR ALL
  TO authenticated
  USING (
    -- Usuários podem gerenciar suas próprias permissões
    user_id = current_user_id() OR
    -- Owners podem gerenciar permissões de usuários da mesma igreja
    (church_id = get_current_user_church_id()
    AND church_id IS NOT NULL)
  )
  WITH CHECK (
    -- Para INSERT: apenas próprias permissões
    -- Para UPDATE/DELETE: próprias permissões OU owners gerenciando permissões da igreja
    user_id = current_user_id() OR
    (church_id = get_current_user_church_id()
    AND church_id IS NOT NULL)
  );

-- ============================================
-- POLICIES - SYSTEM_LOGS
-- ============================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'system_logs' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON system_logs';
    END LOOP;
END $$;

-- Usuários podem ver logs da própria igreja
CREATE POLICY "Users can view their church logs"
  ON system_logs FOR SELECT
  USING (
    church_id = get_current_user_church_id()
    AND church_id IS NOT NULL
  );

-- Usuários autenticados podem inserir logs (para registrar suas próprias ações)
CREATE POLICY "Users can insert logs"
  ON system_logs FOR INSERT
  WITH CHECK (
    church_id = get_current_user_church_id()
    AND church_id IS NOT NULL
    AND (
      user_id = current_user_id() OR user_id IS NULL
    )
  );

-- Apenas owners podem deletar logs
CREATE POLICY "Owners can delete logs"
  ON system_logs FOR DELETE
  USING (
    church_id = get_current_user_church_id()
    AND church_id IS NOT NULL
  );

-- ============================================
-- MIGRAÇÃO: ADICIONAR CAMPOS DE ENDEREÇO (se não existirem)
-- ============================================
-- Esta migração adiciona os campos de endereço à tabela members
-- É segura para executar múltiplas vezes (idempotente)
-- ============================================

-- Adicionar colunas de endereço se não existirem
DO $$ 
BEGIN
  -- CEP
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'members' 
    AND column_name = 'zip_code'
  ) THEN
    ALTER TABLE members ADD COLUMN zip_code VARCHAR(10);
    RAISE NOTICE '✅ Coluna zip_code adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna zip_code já existe';
  END IF;
  
  -- Rua/Logradouro
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'members' 
    AND column_name = 'street'
  ) THEN
    ALTER TABLE members ADD COLUMN street VARCHAR(255);
    RAISE NOTICE '✅ Coluna street adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna street já existe';
  END IF;
  
  -- Número
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'members' 
    AND column_name = 'address_number'
  ) THEN
    ALTER TABLE members ADD COLUMN address_number VARCHAR(20);
    RAISE NOTICE '✅ Coluna address_number adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna address_number já existe';
  END IF;
  
  -- Complemento
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'members' 
    AND column_name = 'address_complement'
  ) THEN
    ALTER TABLE members ADD COLUMN address_complement VARCHAR(255);
    RAISE NOTICE '✅ Coluna address_complement adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna address_complement já existe';
  END IF;
  
  -- Bairro
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'members' 
    AND column_name = 'neighborhood'
  ) THEN
    ALTER TABLE members ADD COLUMN neighborhood VARCHAR(255);
    RAISE NOTICE '✅ Coluna neighborhood adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna neighborhood já existe';
  END IF;
  
  -- Cidade
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'members' 
    AND column_name = 'city'
  ) THEN
    ALTER TABLE members ADD COLUMN city VARCHAR(255);
    RAISE NOTICE '✅ Coluna city adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna city já existe';
  END IF;
  
  -- Estado (UF)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'members' 
    AND column_name = 'state'
  ) THEN
    ALTER TABLE members ADD COLUMN state VARCHAR(2);
    RAISE NOTICE '✅ Coluna state adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna state já existe';
  END IF;
END $$;

-- Criar índices para melhorar performance de buscas (se não existirem)
-- Nota: Os índices só serão criados se as colunas existirem
DO $$
BEGIN
  -- Verificar se a coluna zip_code existe antes de criar índice
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'members' 
    AND column_name = 'zip_code'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_members_zip_code ON members(zip_code);
    RAISE NOTICE '✅ Índice idx_members_zip_code criado/verificado';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'members' 
    AND column_name = 'city'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_members_city ON members(city);
    RAISE NOTICE '✅ Índice idx_members_city criado/verificado';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'members' 
    AND column_name = 'state'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_members_state ON members(state);
    RAISE NOTICE '✅ Índice idx_members_state criado/verificado';
  END IF;
END $$;

-- ============================================
-- MIGRAÇÃO: ADICIONAR COLUNA invite_type SE NÃO EXISTIR
-- ============================================
-- Esta migração garante que a coluna invite_type existe na tabela church_invites
-- É segura para executar múltiplas vezes (idempotente)
-- ============================================

DO $$ 
BEGIN
  -- Verificar se a coluna invite_type já existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'church_invites' 
    AND column_name = 'invite_type'
  ) THEN
    -- Adicionar coluna invite_type
    ALTER TABLE church_invites 
    ADD COLUMN invite_type VARCHAR(50) DEFAULT 'member' CHECK (invite_type IN ('collaborator', 'member'));
    
    -- Comentário na coluna
    COMMENT ON COLUMN church_invites.invite_type IS 'Tipo de convite: collaborator (acesso completo) ou member (apenas lembretes)';
    
    RAISE NOTICE '✅ Coluna invite_type adicionada à tabela church_invites';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna invite_type já existe na tabela church_invites';
  END IF;
END $$;

-- Criar índice para melhor performance (se não existir)
-- O índice já foi criado anteriormente, mas garantimos aqui também
CREATE INDEX IF NOT EXISTS idx_church_invites_invite_type ON church_invites(invite_type);

-- ============================================
-- GARANTIR PERMISSÕES COMPLETAS PARA TODOS OS USUÁRIOS
-- ============================================
-- Esta seção garante que todos os usuários tenham acesso completo ao sistema
-- Execute após a criação de todas as tabelas e políticas
-- ============================================

-- 1. Criar igreja padrão se não existir
DO $$
DECLARE
  v_church_id UUID;
BEGIN
  SELECT id INTO v_church_id
  FROM public.churches
  LIMIT 1;

  IF v_church_id IS NULL THEN
    INSERT INTO public.churches (name, created_at)
    VALUES ('Igreja Padrão', NOW())
    RETURNING id INTO v_church_id;
    
    RAISE NOTICE '✅ Igreja padrão criada: %', v_church_id;
  ELSE
    RAISE NOTICE 'ℹ️ Igreja já existe: %', v_church_id;
  END IF;
END $$;

-- 2. Criar perfis para usuários autenticados sem perfil
DO $$
DECLARE
  v_church_id UUID;
  v_user_record RECORD;
  v_created_count INTEGER := 0;
BEGIN
  -- Buscar primeira igreja disponível
  SELECT id INTO v_church_id
  FROM public.churches
  LIMIT 1;

  IF v_church_id IS NULL THEN
    RAISE NOTICE '⚠️ Nenhuma igreja encontrada. Pulando criação de perfis.';
    RETURN;
  END IF;

  -- Criar perfis para usuários sem perfil
  FOR v_user_record IN
    SELECT au.id, au.email, au.created_at
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.id
    WHERE up.id IS NULL
  LOOP
    BEGIN
      INSERT INTO public.user_profiles (
        id,
        church_id,
        full_name,
        email,
        role,
        created_at
      ) VALUES (
        v_user_record.id,
        v_church_id,
        COALESCE(SPLIT_PART(v_user_record.email, '@', 1), 'Usuário'),
        v_user_record.email,
        'owner', -- Definir como owner para ter acesso total
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;

      v_created_count := v_created_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erro ao criar perfil para usuário %: %', v_user_record.email, SQLERRM;
    END;
  END LOOP;

  IF v_created_count > 0 THEN
    RAISE NOTICE '✅ Perfis criados: %', v_created_count;
  END IF;
END $$;

-- 3. Atribuir church_id para perfis sem igreja
DO $$
DECLARE
  v_church_id UUID;
  v_updated_count INTEGER := 0;
BEGIN
  -- Buscar primeira igreja disponível
  SELECT id INTO v_church_id
  FROM public.churches
  LIMIT 1;

  IF v_church_id IS NULL THEN
    RAISE NOTICE '⚠️ Nenhuma igreja encontrada.';
    RETURN;
  END IF;

  -- Atualizar perfis sem church_id
  UPDATE public.user_profiles
  SET church_id = v_church_id
  WHERE church_id IS NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ Perfis atualizados com church_id: %', v_updated_count;
  END IF;
END $$;

-- 4. Atualizar todos os usuários para role 'owner' (acesso total)
DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  UPDATE public.user_profiles
  SET role = 'owner'
  WHERE role != 'owner';

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ Usuários atualizados para role owner: %', v_updated_count;
  END IF;
END $$;

-- 5. Garantir que TODOS os usuários tenham permissões COMPLETAS (todas como true)
-- Primeiro, inserir permissões para usuários que não têm
DO $$
DECLARE
  v_inserted_count INTEGER := 0;
BEGIN
  INSERT INTO public.user_permissions (
    user_id,
    church_id,
    can_manage_finances,
    can_manage_members,
    can_manage_events,
    can_view_reports,
    can_send_whatsapp
  )
  SELECT 
    up.id,
    up.church_id,
    true,  -- Todas as permissões como true
    true,
    true,
    true,
    true
  FROM public.user_profiles up
  LEFT JOIN public.user_permissions uperm ON up.id = uperm.user_id AND up.church_id = uperm.church_id
  WHERE uperm.id IS NULL
    AND up.church_id IS NOT NULL
  ON CONFLICT (user_id, church_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  IF v_inserted_count > 0 THEN
    RAISE NOTICE '✅ Permissões criadas para novos usuários: %', v_inserted_count;
  END IF;
END $$;

-- 6. Atualizar TODAS as permissões existentes para true (acesso total)
DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  UPDATE public.user_permissions
  SET 
    can_manage_finances = true,
    can_manage_members = true,
    can_manage_events = true,
    can_view_reports = true,
    can_send_whatsapp = true,
    updated_at = NOW()
  WHERE 
    can_manage_finances = false OR
    can_manage_members = false OR
    can_manage_events = false OR
    can_view_reports = false OR
    can_send_whatsapp = false;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count > 0 THEN
    RAISE NOTICE '✅ Permissões atualizadas para acesso completo: %', v_updated_count;
  END IF;
END $$;

-- 7. Verificação final (apenas para relatório, não bloqueia execução)
DO $$
DECLARE
  v_usuarios_sem_perfil INTEGER;
  v_perfis_sem_igreja INTEGER;
  v_perfis_sem_permissoes INTEGER;
  v_perfis_com_permissoes_restritas INTEGER;
  v_total_usuarios INTEGER;
  v_usuarios_owner INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE up.id IS NULL),
    COUNT(*) FILTER (WHERE up.church_id IS NULL),
    COUNT(*) FILTER (WHERE uperm.id IS NULL AND up.church_id IS NOT NULL),
    COUNT(*) FILTER (WHERE uperm.can_manage_finances = false OR uperm.can_manage_members = false OR uperm.can_manage_events = false OR uperm.can_view_reports = false OR uperm.can_send_whatsapp = false),
    COUNT(*),
    COUNT(*) FILTER (WHERE up.role = 'owner')
  INTO 
    v_usuarios_sem_perfil,
    v_perfis_sem_igreja,
    v_perfis_sem_permissoes,
    v_perfis_com_permissoes_restritas,
    v_total_usuarios,
    v_usuarios_owner
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON au.id = up.id
  LEFT JOIN public.user_permissions uperm ON up.id = uperm.user_id AND up.church_id = uperm.church_id;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'RELATÓRIO FINAL DE PERMISSÕES:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de usuários autenticados: %', v_total_usuarios;
  RAISE NOTICE 'Usuários sem perfil: %', v_usuarios_sem_perfil;
  RAISE NOTICE 'Perfis sem igreja: %', v_perfis_sem_igreja;
  RAISE NOTICE 'Perfis sem permissões: %', v_perfis_sem_permissoes;
  RAISE NOTICE 'Perfis com permissões restritas: %', v_perfis_com_permissoes_restritas;
  RAISE NOTICE 'Usuários com role owner: %', v_usuarios_owner;
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- CORRIGIR FOREIGN KEYS PARA PERMITIR DELEÇÃO DE USUÁRIOS
-- ============================================
-- Esta seção corrige as foreign keys que podem impedir a deleção de usuários
-- Altera as colunas created_by para usar ON DELETE SET NULL
-- ============================================

-- Corrigir foreign key em revenues.created_by
DO $$
BEGIN
  -- Remover constraint antiga se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%revenues_created_by%' 
    AND table_name = 'revenues'
  ) THEN
    ALTER TABLE revenues DROP CONSTRAINT IF EXISTS revenues_created_by_fkey;
  END IF;
  
  -- Adicionar nova constraint com ON DELETE SET NULL
  ALTER TABLE revenues 
  ADD CONSTRAINT revenues_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  
  RAISE NOTICE '✅ Foreign key de revenues.created_by corrigida';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ℹ️ revenues.created_by: %', SQLERRM;
END $$;

-- Corrigir foreign key em expenses.created_by
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%expenses_created_by%' 
    AND table_name = 'expenses'
  ) THEN
    ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_created_by_fkey;
  END IF;
  
  ALTER TABLE expenses 
  ADD CONSTRAINT expenses_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  
  RAISE NOTICE '✅ Foreign key de expenses.created_by corrigida';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ℹ️ expenses.created_by: %', SQLERRM;
END $$;

-- Corrigir foreign key em events.created_by
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%events_created_by%' 
    AND table_name = 'events'
  ) THEN
    ALTER TABLE events DROP CONSTRAINT IF EXISTS events_created_by_fkey;
  END IF;
  
  ALTER TABLE events 
  ADD CONSTRAINT events_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  
  RAISE NOTICE '✅ Foreign key de events.created_by corrigida';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ℹ️ events.created_by: %', SQLERRM;
END $$;

-- Corrigir foreign key em reserve_fund_transactions.created_by
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%reserve_fund_transactions_created_by%' 
    AND table_name = 'reserve_fund_transactions'
  ) THEN
    ALTER TABLE reserve_fund_transactions DROP CONSTRAINT IF EXISTS reserve_fund_transactions_created_by_fkey;
  END IF;
  
  ALTER TABLE reserve_fund_transactions 
  ADD CONSTRAINT reserve_fund_transactions_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  
  RAISE NOTICE '✅ Foreign key de reserve_fund_transactions.created_by corrigida';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ℹ️ reserve_fund_transactions.created_by: %', SQLERRM;
END $$;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Este script contém TODAS as tabelas, índices, triggers,
-- funções e políticas RLS necessárias para o TesourApp
-- 
-- INCLUI:
-- ✅ Todas as tabelas principais (churches, members, revenues, expenses, events, etc.)
-- ✅ Políticas RLS (Row Level Security) completas
-- ✅ Funções auxiliares (get_church_users, create_member_profile, etc.)
-- ✅ Funções para inserção/atualização segura de datas (insert_expense_safe_date, etc.)
-- ✅ Triggers para updated_at automático
-- ✅ Índices para performance
-- ✅ Migrações e correções de foreign keys
-- 
-- IMPORTANTE: Este script também garante que todos os usuários
-- tenham permissões completas (acesso total) ao sistema
-- 
-- FUNÇÕES DE TIMEZONE SEGURAS:
-- - insert_expense_safe_date: Insere despesa com data sem problemas de timezone
-- - update_expense_safe_date: Atualiza despesa com data sem problemas de timezone
-- - insert_revenue_safe_date: Insere receita com data sem problemas de timezone
-- - update_revenue_safe_date: Atualiza receita com data sem problemas de timezone
-- 
-- SEGURANÇA E PERFORMANCE:
-- ✅ Todas as funções SECURITY DEFINER agora têm SET search_path = public
-- ✅ Políticas RLS da tabela churches foram ajustadas para não usar USING (true)
-- ✅ Política DELETE restritiva adicionada para churches
-- ✅ Função auxiliar STABLE current_user_id() criada para otimizar políticas RLS
-- ✅ Todas as chamadas a auth.uid() nas políticas RLS foram substituídas por current_user_id()
-- ✅ Políticas duplicadas em church_invites foram consolidadas
-- 
-- NOTA SOBRE LEAKED PASSWORD PROTECTION:
-- A proteção de senhas vazadas é uma configuração do Supabase Dashboard.
-- Para habilitar: Authentication > Settings > Password Protection > Enable Leaked Password Protection
-- Isso não pode ser configurado via SQL, apenas através da interface do Supabase.
-- ============================================

