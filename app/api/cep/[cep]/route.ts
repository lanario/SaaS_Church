import { NextRequest, NextResponse } from 'next/server'
import { fetchCEP, isValidCEP, formatCEP } from '@/lib/utils/cep'

/**
 * API Route para buscar dados do CEP
 * GET /api/cep/[cep]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { cep: string } }
) {
  try {
    const cep = params.cep

    if (!cep) {
      return NextResponse.json(
        { error: 'CEP não fornecido' },
        { status: 400 }
      )
    }

    const cleaned = formatCEP(cep)

    if (!isValidCEP(cleaned)) {
      return NextResponse.json(
        { error: 'CEP inválido' },
        { status: 400 }
      )
    }

    const cepData = await fetchCEP(cleaned)

    if (!cepData) {
      return NextResponse.json(
        { error: 'CEP não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(cepData)
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar CEP' },
      { status: 500 }
    )
  }
}
