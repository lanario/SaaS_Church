-- ============================================
-- MIGRAÇÃO: CAMPOS DE ENDEREÇO NA TABELA MEMBERS
-- ============================================
-- Execute este script no Supabase SQL Editor se os campos de endereço
-- não foram criados automaticamente pela tabela
-- ============================================

-- Adicionar colunas de endereço se não existirem
DO $$ 
BEGIN
  -- CEP
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'zip_code') THEN
    ALTER TABLE members ADD COLUMN zip_code VARCHAR(10);
    RAISE NOTICE '✅ Coluna zip_code adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna zip_code já existe';
  END IF;
  
  -- Rua/Logradouro
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'street') THEN
    ALTER TABLE members ADD COLUMN street VARCHAR(255);
    RAISE NOTICE '✅ Coluna street adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna street já existe';
  END IF;
  
  -- Número
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'address_number') THEN
    ALTER TABLE members ADD COLUMN address_number VARCHAR(20);
    RAISE NOTICE '✅ Coluna address_number adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna address_number já existe';
  END IF;
  
  -- Complemento
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'address_complement') THEN
    ALTER TABLE members ADD COLUMN address_complement VARCHAR(255);
    RAISE NOTICE '✅ Coluna address_complement adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna address_complement já existe';
  END IF;
  
  -- Bairro
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'neighborhood') THEN
    ALTER TABLE members ADD COLUMN neighborhood VARCHAR(255);
    RAISE NOTICE '✅ Coluna neighborhood adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna neighborhood já existe';
  END IF;
  
  -- Cidade
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'city') THEN
    ALTER TABLE members ADD COLUMN city VARCHAR(255);
    RAISE NOTICE '✅ Coluna city adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna city já existe';
  END IF;
  
  -- Estado (UF)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'state') THEN
    ALTER TABLE members ADD COLUMN state VARCHAR(2);
    RAISE NOTICE '✅ Coluna state adicionada';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna state já existe';
  END IF;
END $$;

-- Criar índices para melhorar performance de buscas (se não existirem)
CREATE INDEX IF NOT EXISTS idx_members_zip_code ON members(zip_code);
CREATE INDEX IF NOT EXISTS idx_members_city ON members(city);
CREATE INDEX IF NOT EXISTS idx_members_state ON members(state);

-- ============================================
-- ✅ MIGRAÇÃO CONCLUÍDA
-- ============================================
-- Os campos de endereço foram adicionados à tabela members
-- Agora você pode usar a funcionalidade de endereço nos membros
-- ============================================
