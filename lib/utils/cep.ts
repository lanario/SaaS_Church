/**
 * Utilitários para busca e validação de CEP
 */

export interface CEPData {
  cep: string
  logradouro: string
  complemento?: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

/**
 * Formata CEP removendo caracteres não numéricos
 */
export function formatCEP(cep: string): string {
  return cep.replace(/\D/g, '')
}

/**
 * Formata CEP para exibição (00000-000)
 */
export function formatCEPDisplay(cep: string): string {
  const cleaned = formatCEP(cep)
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
  }
  return cleaned
}

/**
 * Valida se o CEP está no formato correto
 */
export function isValidCEP(cep: string): boolean {
  const cleaned = formatCEP(cep)
  return cleaned.length === 8 && /^\d{8}$/.test(cleaned)
}

/**
 * Busca dados do CEP na API ViaCEP
 * @param cep - CEP no formato 00000-000 ou 00000000
 * @returns Dados do endereço ou null se não encontrado
 */
export async function fetchCEP(cep: string): Promise<CEPData | null> {
  const cleaned = formatCEP(cep)
  
  if (!isValidCEP(cleaned)) {
    return null
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`)
    
    if (!response.ok) {
      return null
    }

    const data: CEPData = await response.json()

    // ViaCEP retorna { erro: true } quando não encontra o CEP
    if (data.erro) {
      return null
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return null
  }
}
