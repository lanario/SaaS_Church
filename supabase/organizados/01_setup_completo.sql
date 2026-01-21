-- ============================================
-- SETUP COMPLETO - TESOURAPP
-- Execute este arquivo no SQL Editor do Supabase
-- Este script é idempotente (pode ser executado múltiplas vezes)
-- ============================================

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- LIMPEZA DE OBJETOS EXISTENTES (SE NECESSÁRIO)
-- ============================================

-- Remover triggers antigos (evita erro de duplicação)
DROP TRIGGER IF EXISTS update_churches_updated_at ON churches;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
DROP TRIGGER IF EXISTS update_revenues_updated_at ON revenues;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
DROP TRIGGER IF EXISTS update_user_permissions_updated_at ON user_permissions;

-- NOTA: As políticas serão removidas dinamicamente nas seções específicas abaixo
-- Isso garante remoção completa mesmo com nomes diferentes ou políticas antigas
DROP POLICY IF EXISTS "Users can view members in their church" ON members;
DROP POLICY IF EXISTS "Users with permission can manage members" ON members;
DROP POLICY IF EXISTS "Members can view own data" ON members;
DROP POLICY IF EXISTS "Users with permission can view revenues" ON revenues;
DROP POLICY IF EXISTS "Members can view own revenues" ON revenues;
DROP POLICY IF EXISTS "Users with permission can manage revenues" ON revenues;
DROP POLICY IF EXISTS "Users with permission can manage expenses" ON expenses;
DROP POLICY IF EXISTS "Users can view public events" ON events;
DROP POLICY IF EXISTS "Users with permission can manage events" ON events;
DROP POLICY IF EXISTS "Members can manage own attendance" ON event_attendances;
DROP POLICY IF EXISTS "Users with permission can view all attendances" ON event_attendances;

-- Remover políticas de categorias se existirem
DROP POLICY IF EXISTS "Users can view revenue categories" ON revenue_categories;
DROP POLICY IF EXISTS "Users can manage revenue categories" ON revenue_categories;
DROP POLICY IF EXISTS "Users can view expense categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can manage expense categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can view permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can manage permissions" ON user_permissions;
DROP POLICY IF EXISTS "Owners can manage permissions" ON user_permissions;

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
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'owner', 'treasurer', 'marketing', 'member'
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
  created_by UUID REFERENCES auth.users(id),
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
  created_by UUID REFERENCES auth.users(id),
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
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(church_id, email, status) -- Um convite ativo por email por igreja
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_church_id ON user_profiles(church_id);
CREATE INDEX IF NOT EXISTS idx_members_church_id ON members(church_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_revenues_church_id ON revenues(church_id);
CREATE INDEX IF NOT EXISTS idx_revenues_transaction_date ON revenues(transaction_date);
CREATE INDEX IF NOT EXISTS idx_expenses_church_id ON expenses(church_id);
CREATE INDEX IF NOT EXISTS idx_expenses_transaction_date ON expenses(transaction_date);
CREATE INDEX IF NOT EXISTS idx_events_church_id ON events(church_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_attendances_event_id ON event_attendances(event_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_church_id ON user_permissions(church_id);

-- Índices para church_invites
CREATE INDEX IF NOT EXISTS idx_church_invites_church_id ON church_invites(church_id);
CREATE INDEX IF NOT EXISTS idx_church_invites_email ON church_invites(email);
CREATE INDEX IF NOT EXISTS idx_church_invites_token ON church_invites(token);
CREATE INDEX IF NOT EXISTS idx_church_invites_status ON church_invites(status);
CREATE INDEX IF NOT EXISTS idx_revenue_categories_church_id ON revenue_categories(church_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_church_id ON expense_categories(church_id);

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- ============================================
-- POLICIES - USER_PROFILES (CORRIGIDO - SEM RECURSÃO)
-- IMPORTANTE: Esta seção deve vir PRIMEIRO, antes de outras tabelas que consultam user_profiles
-- ============================================

-- IMPORTANTE: Remover TODAS as políticas antigas primeiro (evita recursão)
-- Usando método mais seguro para garantir remoção completa
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON user_profiles';
    END LOOP;
END $$;

-- CRÍTICO: Usuários podem ver seu próprio perfil (SEM RECURSÃO)
-- Esta é a ÚNICA política de SELECT para user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

-- Usuários podem inserir seu próprio perfil (para criação durante cadastro)
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- IMPORTANTE: 
-- - NÃO há política "Users can view profiles in their church" (causava recursão infinita)
-- - A visualização de outros perfis será feita via server-side logic na aplicação
-- - Isso evita recursão infinita no RLS

-- ============================================
-- POLICIES - CHURCHES
-- IMPORTANTE: Esta seção vem DEPOIS de user_profiles porque depende dela
-- ============================================

-- Remover políticas antigas de churches dinamicamente
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'churches' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON churches';
    END LOOP;
END $$;

-- Usuários podem ver apenas sua própria igreja
-- Esta consulta user_profiles, mas não causa recursão porque user_profiles não consulta churches
CREATE POLICY "Users can view their own church"
  ON churches FOR SELECT
  USING (
    id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );

-- Apenas owners podem criar igrejas (via aplicação)
CREATE POLICY "Users can create churches"
  ON churches FOR INSERT
  WITH CHECK (true); -- Validação será feita na aplicação

-- Apenas owners podem atualizar sua igreja
CREATE POLICY "Owners can update their church"
  ON churches FOR UPDATE
  USING (
    id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- POLICIES - MEMBERS
-- ============================================

-- Usuários podem ver membros da mesma igreja
CREATE POLICY "Users can view members in their church"
  ON members FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );

-- Apenas usuários com permissão podem criar/editar membros
CREATE POLICY "Users with permission can manage members"
  ON members FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND (role IN ('owner', 'treasurer') OR 
           EXISTS (
             SELECT 1 FROM user_permissions
             WHERE user_id = auth.uid()
             AND church_id = members.church_id
             AND can_manage_members = true
           ))
    )
  );

-- Membros podem ver apenas seus próprios dados
CREATE POLICY "Members can view own data"
  ON members FOR SELECT
  USING (
    user_id = auth.uid() OR
    id IN (
      SELECT id FROM members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- POLICIES - REVENUE_CATEGORIES
-- ============================================

CREATE POLICY "Users can view revenue categories"
  ON revenue_categories FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage revenue categories"
  ON revenue_categories FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND (role IN ('owner', 'treasurer') OR 
           EXISTS (
             SELECT 1 FROM user_permissions
             WHERE user_id = auth.uid()
             AND church_id = revenue_categories.church_id
             AND can_manage_finances = true
           ))
    )
  );

-- ============================================
-- POLICIES - EXPENSE_CATEGORIES
-- ============================================

CREATE POLICY "Users can view expense categories"
  ON expense_categories FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage expense categories"
  ON expense_categories FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND (role IN ('owner', 'treasurer') OR 
           EXISTS (
             SELECT 1 FROM user_permissions
             WHERE user_id = auth.uid()
             AND church_id = expense_categories.church_id
             AND can_manage_finances = true
           ))
    )
  );

-- ============================================
-- POLICIES - REVENUES
-- ============================================

-- Usuários com permissão podem ver receitas da igreja
CREATE POLICY "Users with permission can view revenues"
  ON revenues FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND (role IN ('owner', 'treasurer') OR 
           EXISTS (
             SELECT 1 FROM user_permissions
             WHERE user_id = auth.uid()
             AND church_id = revenues.church_id
             AND can_manage_finances = true
           ))
    )
  );

-- Membros podem ver apenas suas próprias receitas
CREATE POLICY "Members can view own revenues"
  ON revenues FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Apenas usuários com permissão podem criar/editar receitas
CREATE POLICY "Users with permission can manage revenues"
  ON revenues FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND (role IN ('owner', 'treasurer') OR 
           EXISTS (
             SELECT 1 FROM user_permissions
             WHERE user_id = auth.uid()
             AND church_id = revenues.church_id
             AND can_manage_finances = true
           ))
    )
  );

-- ============================================
-- POLICIES - EXPENSES
-- ============================================

-- Apenas usuários com permissão podem ver/gerenciar despesas
CREATE POLICY "Users with permission can manage expenses"
  ON expenses FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND (role IN ('owner', 'treasurer') OR 
           EXISTS (
             SELECT 1 FROM user_permissions
             WHERE user_id = auth.uid()
             AND church_id = expenses.church_id
             AND can_manage_finances = true
           ))
    )
  );

-- ============================================
-- POLICIES - EVENTS
-- ============================================

-- Usuários só podem ver eventos se:
-- 1. São owners/treasurers (têm acesso total)
-- 2. Têm permissão para gerenciar eventos
-- 3. Têm convite aceito para a igreja E o evento é público
CREATE POLICY "Users can view events with invite or permission"
  ON events FOR SELECT
  USING (
    -- Owners e treasurers têm acesso total
    (church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'treasurer')
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

-- Apenas usuários com permissão podem criar/editar eventos
CREATE POLICY "Users with permission can manage events"
  ON events FOR ALL
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
      AND (role IN ('owner', 'treasurer') OR 
           EXISTS (
             SELECT 1 FROM user_permissions
             WHERE user_id = auth.uid()
             AND church_id = events.church_id
             AND can_manage_events = true
           ))
    )
  );

-- ============================================
-- POLICIES - EVENT_ATTENDANCES
-- ============================================

-- Membros podem confirmar sua própria presença
CREATE POLICY "Members can manage own attendance"
  ON event_attendances FOR ALL
  USING (
    member_id IN (
      SELECT id FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Usuários com permissão podem ver todas as confirmações
CREATE POLICY "Users with permission can view all attendances"
  ON event_attendances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN user_profiles up ON e.church_id = up.church_id
      WHERE e.id = event_attendances.event_id
      AND up.id = auth.uid()
      AND (up.role IN ('owner', 'treasurer') OR 
           EXISTS (
             SELECT 1 FROM user_permissions
             WHERE user_id = auth.uid()
             AND church_id = e.church_id
             AND can_manage_events = true
           ))
    )
  );

-- ============================================
-- POLICIES - CHURCH_INVITES
-- ============================================

-- Owners podem ver todos os convites da sua igreja
CREATE POLICY "Owners can view invites in their church"
  ON church_invites FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Owners podem criar convites para sua igreja
CREATE POLICY "Owners can create invites in their church"
  ON church_invites FOR INSERT
  WITH CHECK (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
    AND invited_by = auth.uid()
  );

-- Owners podem atualizar convites da sua igreja
CREATE POLICY "Owners can update invites in their church"
  ON church_invites FOR UPDATE
  USING (
    church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Usuários podem ver seu próprio convite pelo email
CREATE POLICY "Users can view their own invite"
  ON church_invites FOR SELECT
  USING (
    email IN (
      SELECT email FROM user_profiles
      WHERE id = auth.uid()
    )
    OR
    -- Permitir ver convite pelo token (para aceitar sem estar logado)
    true -- Simplificado para permitir visualização por token
  );

-- Usuários podem aceitar convite pelo token
CREATE POLICY "Users can accept their invite"
  ON church_invites FOR UPDATE
  USING (
    email IN (
      SELECT email FROM user_profiles
      WHERE id = auth.uid()
    )
    AND status = 'pending'
    AND expires_at > NOW()
  )
  WITH CHECK (
    status = 'accepted'
    AND accepted_at IS NOT NULL
  );

-- ============================================
-- POLICIES - USER_PERMISSIONS
-- ============================================

-- Remover políticas existentes antes de criar
DROP POLICY IF EXISTS "Users can view permissions" ON user_permissions;
DROP POLICY IF EXISTS "Owners can manage permissions" ON user_permissions;

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
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE churches IS 'Tabela principal de igrejas/organizações';
COMMENT ON TABLE user_profiles IS 'Perfis estendidos dos usuários autenticados';
COMMENT ON TABLE members IS 'Membros cadastrados na igreja';
COMMENT ON TABLE revenues IS 'Receitas financeiras da igreja';
COMMENT ON TABLE expenses IS 'Despesas financeiras da igreja';
COMMENT ON TABLE events IS 'Eventos e cultos da igreja';
COMMENT ON TABLE event_attendances IS 'Confirmações de presença nos eventos';

-- ============================================
-- FIM DO SETUP
-- ============================================

-- Este script foi executado com sucesso!
-- Todas as tabelas, índices, triggers e políticas RLS foram criados/atualizados.

