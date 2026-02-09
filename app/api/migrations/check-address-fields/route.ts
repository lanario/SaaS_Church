import { NextResponse } from 'next/server'
import { checkMembersAddressFields } from '@/app/actions/migrations'

/**
 * API Route para verificar se os campos de endereço existem
 * GET /api/migrations/check-address-fields
 */
export async function GET() {
  try {
    const result = await checkMembersAddressFields()
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { 
        exists: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    )
  }
}
