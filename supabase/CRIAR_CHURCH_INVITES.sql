-- ============================================
-- CRIAR TABELA CHURCH_INVITES URGENTE
-- Execute este script se receber erro "relation church_invites does not exist"
-- ============================================

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

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_church_invites_church_id ON church_invites(church_id);
CREATE INDEX IF NOT EXISTS idx_church_invites_email ON church_invites(email);
CREATE INDEX IF NOT EXISTS idx_church_invites_token ON church_invites(token);
CREATE INDEX IF NOT EXISTS idx_church_invites_status ON church_invites(status);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_church_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_church_invites_updated_at ON church_invites;
CREATE TRIGGER update_church_invites_updated_at
  BEFORE UPDATE ON church_invites
  FOR EACH ROW
  EXECUTE FUNCTION update_church_invites_updated_at();

-- Habilitar RLS
ALTER TABLE church_invites ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para convites
DROP POLICY IF EXISTS "Owners can view invites in their church" ON church_invites;
DROP POLICY IF EXISTS "Owners can create invites in their church" ON church_invites;
DROP POLICY IF EXISTS "Owners can update invites in their church" ON church_invites;
DROP POLICY IF EXISTS "Users can view their own invite" ON church_invites;
DROP POLICY IF EXISTS "Users can accept their invite" ON church_invites;

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

CREATE POLICY "Users can view their own invite"
  ON church_invites FOR SELECT
  USING (
    email IN (
      SELECT email FROM user_profiles
      WHERE id = auth.uid()
    )
    OR true -- Permitir ver convite pelo token
  );

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
-- FIM DO SCRIPT
-- ============================================
-- Após executar, a tabela church_invites estará criada e configurada
-- ============================================

