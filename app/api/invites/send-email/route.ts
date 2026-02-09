import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getChurchId } from '@/lib/utils/get-church-id'

/**
 * API Route para enviar email de convite com magic link
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { email, token, inviteType } = await request.json()

    if (!email || !token) {
      return NextResponse.json({ error: 'Email e token são obrigatórios' }, { status: 400 })
    }

    const { churchId } = await getChurchId()
    if (!churchId) {
      return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 400 })
    }

    // Buscar dados da igreja
    const { data: church } = await supabase
      .from('churches')
      .select('name')
      .eq('id', churchId)
      .single()

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteTypeLabel = inviteType === 'collaborator' ? 'Colaborador' : 'Membro'

    // Se for colaborador, enviar magic link
    if (inviteType === 'collaborator') {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${baseUrl}/auth/callback?token=${token}`,
          data: {
            invite_token: token,
            invite_type: inviteType,
            church_id: churchId,
            church_name: church?.name || 'Igreja',
          },
        },
      })

      if (otpError) {
        console.error('Erro ao enviar magic link:', otpError)
        return NextResponse.json(
          { error: `Erro ao enviar magic link: ${otpError.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        message: `Magic link enviado com sucesso para ${email}! O colaborador receberá um email com link de login automático.`,
        magicLinkSent: true,
      })
    }

    // Para membros, enviar link normal de convite
    const inviteLink = `${baseUrl}/convite/${token}`
    
    // TODO: Implementar envio real de email para membros usando:
    // - Resend (https://resend.com)
    // - SendGrid
    // - Nodemailer com SMTP
    // - Supabase Edge Functions
    
    console.log('📧 Email de convite que seria enviado:', {
      to: email,
      subject: `Convite para ${inviteTypeLabel} - ${church?.name || 'Igreja'}`,
      body: `
        Olá!
        
        Você foi convidado para ser ${inviteTypeLabel.toLowerCase()} da igreja ${church?.name || ''}.
        
        Clique no link abaixo para aceitar o convite:
        ${inviteLink}
        
        Este link expira em 7 dias.
        
        Se você não solicitou este convite, pode ignorar este email.
      `,
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Link de convite gerado (envio de email para membros requer configuração SMTP)',
      inviteLink,
      magicLinkSent: false,
    })
  } catch (error: any) {
    console.error('Erro ao enviar email:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar email', details: error.message },
      { status: 500 }
    )
  }
}
