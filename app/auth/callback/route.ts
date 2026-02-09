import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    const redirectUrl = new URL('/login', baseUrl)
    redirectUrl.searchParams.set('error', error)
    redirectUrl.searchParams.set('message', errorDescription || 'Erro ao confirmar email')
    return NextResponse.redirect(redirectUrl.toString())
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Pode falhar em Server Component
            }
          },
        },
      }
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Erro ao trocar code por sessão:', exchangeError)
      const redirectUrl = new URL('/login', baseUrl)
      redirectUrl.searchParams.set('error', 'confirm_error')
      redirectUrl.searchParams.set('message', 'Não foi possível confirmar seu email. Tente fazer login.')
      return NextResponse.redirect(redirectUrl.toString())
    }

    // Verificar se há token de convite nos dados do usuário ou na URL
    const token = requestUrl.searchParams.get('token')
    
    if (token) {
      // Buscar dados do usuário após login
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Aguardar um pouco para garantir que a sessão foi estabelecida
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Importar e chamar acceptInvite
        const { acceptInvite } = await import('@/app/actions/invites')
        const acceptResult = await acceptInvite({ token })
        
        if (!acceptResult.error) {
          // Convite aceito com sucesso, redirecionar para dashboard
          return NextResponse.redirect(new URL('/dashboard', baseUrl).toString())
        } else {
          // Erro ao aceitar convite, redirecionar para página de convite
          const inviteUrl = new URL(`/convite/${token}`, baseUrl)
          inviteUrl.searchParams.set('error', acceptResult.error)
          return NextResponse.redirect(inviteUrl.toString())
        }
      }
    }

    // Redirecionar para a página correta com parâmetro de sucesso
    const redirectTo = next.startsWith('/') ? next : `/${next}`
    const successUrl = new URL(redirectTo, baseUrl)
    successUrl.searchParams.set('email_confirmed', 'true')
    return NextResponse.redirect(successUrl.toString())
  }

  // Sem code (ex.: link com hash) - redirecionar para página que processa no client
  const clientConfirmUrl = new URL('/auth/confirmar', baseUrl)
  clientConfirmUrl.searchParams.set('next', next)
  clientConfirmUrl.search = requestUrl.search
  return NextResponse.redirect(clientConfirmUrl.toString())
}
