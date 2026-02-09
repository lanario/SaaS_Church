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
