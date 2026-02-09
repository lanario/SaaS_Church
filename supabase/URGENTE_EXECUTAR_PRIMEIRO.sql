-- ============================================
-- ⚠️ URGENTE: EXECUTE ESTE ARQUIVO PRIMEIRO!
-- ============================================
-- Se você está recebendo erro "column invite_type does not exist"
-- Execute este arquivo ANTES de usar o sistema
-- ============================================

-- Adicionar coluna invite_type se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'church_invites' 
    AND column_name = 'invite_type'
  ) THEN
    ALTER TABLE church_invites 
    ADD COLUMN invite_type VARCHAR(50) DEFAULT 'member' CHECK (invite_type IN ('collaborator', 'member'));
    
    COMMENT ON COLUMN church_invites.invite_type IS 'Tipo de convite: collaborator (acesso completo) ou member (apenas lembretes)';
    
    RAISE NOTICE '✅ Coluna invite_type adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna invite_type já existe.';
  END IF;
END $$;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_church_invites_invite_type ON church_invites(invite_type);

-- ============================================
-- ✅ PRONTO! Agora você pode usar o sistema normalmente
-- ============================================
-- Depois, execute também o arquivo completo:
-- 00_MIGRACOES_INCREMENTAIS.sql
-- para ter todas as outras atualizações
-- ============================================
