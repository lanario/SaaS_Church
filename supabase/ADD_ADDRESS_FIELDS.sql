-- ============================================
-- ADICIONAR CAMPOS DE ENDEREÇO NA TABELA MEMBERS
-- ============================================

-- Adicionar colunas de endereço se não existirem
DO $$ 
BEGIN
  -- CEP
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'zip_code') THEN
    ALTER TABLE members ADD COLUMN zip_code VARCHAR(10);
  END IF;
  
  -- Rua/Logradouro
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'street') THEN
    ALTER TABLE members ADD COLUMN street VARCHAR(255);
  END IF;
  
  -- Número
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'address_number') THEN
    ALTER TABLE members ADD COLUMN address_number VARCHAR(20);
  END IF;
  
  -- Complemento
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'address_complement') THEN
    ALTER TABLE members ADD COLUMN address_complement VARCHAR(255);
  END IF;
  
  -- Bairro
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'neighborhood') THEN
    ALTER TABLE members ADD COLUMN neighborhood VARCHAR(255);
  END IF;
  
  -- Cidade
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'city') THEN
    ALTER TABLE members ADD COLUMN city VARCHAR(255);
  END IF;
  
  -- Estado (UF)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'state') THEN
    ALTER TABLE members ADD COLUMN state VARCHAR(2);
  END IF;
END $$;

-- Criar índices para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_members_zip_code ON members(zip_code);
CREATE INDEX IF NOT EXISTS idx_members_city ON members(city);
CREATE INDEX IF NOT EXISTS idx_members_state ON members(state);
