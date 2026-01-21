-- ============================================
-- SCHEMA INICIAL - TESOURAPP
-- Banco de Dados: Supabase (PostgreSQL)
-- ============================================

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
CREATE TRIGGER update_churches_updated_at BEFORE UPDATE ON churches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenues_updated_at BEFORE UPDATE ON revenues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON user_permissions
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

-- ============================================
-- POLICIES - CHURCHES
-- ============================================

-- Usuários podem ver apenas sua própria igreja
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
-- POLICIES - USER_PROFILES
-- ============================================

-- CRÍTICO: Usuários podem ver seu próprio perfil (SEM RECURSÃO)
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

-- IMPORTANTE: Política recursiva removida para evitar loop infinito
-- A visualização de outros perfis será feita via server-side logic na aplicação
-- Isso evita recursão infinita no RLS

-- Usuários podem inserir seu próprio perfil (para criação durante cadastro)
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

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

-- Todos os usuários da igreja podem ver eventos públicos
CREATE POLICY "Users can view public events"
  ON events FOR SELECT
  USING (
    (is_public = true AND church_id IN (
      SELECT church_id FROM user_profiles
      WHERE id = auth.uid()
    )) OR
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
-- DADOS INICIAIS (SEED)
-- ============================================

-- Categorias padrão de receitas (serão criadas por igreja)
-- Dízimo, Oferta, Oferta Missionária, Doação, Outros

-- Categorias padrão de despesas (serão criadas por igreja)
-- Manutenção, Salários, Missões, Eventos, Equipamentos, Outros

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

