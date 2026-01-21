-- ============================================
-- CRIAR TABELA DE CONVITES
-- Execute este script no Supabase SQL Editor
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

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_church_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_church_invites_updated_at ON church_invites;
CREATE TRIGGER update_church_invites_updated_at
  BEFORE UPDATE ON church_invites
  FOR EACH ROW
  EXECUTE FUNCTION update_church_invites_updated_at();

-- Habilitar RLS
ALTER TABLE church_invites ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para convites
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

-- Qualquer pessoa pode aceitar/recusar convite pelo token (sem autenticação necessária para aceitar)
-- Mas vamos criar uma política que permite ver convite pelo token
CREATE POLICY "Anyone can view invite by token"
  ON church_invites FOR SELECT
  USING (true); -- Para aceitar convite, precisamos permitir visualização

-- Qualquer pessoa pode aceitar convite com token válido
CREATE POLICY "Anyone can accept invite by token"
  ON church_invites FOR UPDATE
  USING (
    status = 'pending'
    AND expires_at > NOW()
    AND token = current_setting('app.invite_token', true)::VARCHAR
  );

-- Comentários
COMMENT ON TABLE church_invites IS 'Convites para membros se juntarem à igreja e terem acesso aos eventos';
COMMENT ON COLUMN church_invites.token IS 'Token único para aceitar o convite via link';
COMMENT ON COLUMN church_invites.status IS 'Status do convite: pending, accepted, rejected, expired';
COMMENT ON COLUMN church_invites.expires_at IS 'Data de expiração do convite (padrão: 7 dias)';

-- ============================================
-- FIM DO SCRIPT
-- ============================================

