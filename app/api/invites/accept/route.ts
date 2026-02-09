import { NextResponse } from 'next/server'
import { acceptInvite } from '@/app/actions/invites'

/**
 * API Route para aceitar convite (usado após magic link)
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token é obrigatório' }, { status: 400 })
    }

    const result = await acceptInvite({ token })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Convite aceito com sucesso!' })
  } catch (error: any) {
    console.error('Erro ao aceitar convite:', error)
    return NextResponse.json(
      { error: 'Erro ao aceitar convite', details: error.message },
      { status: 500 }
    )
  }
}
