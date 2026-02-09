'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FaCheck, FaSpinner } from 'react-icons/fa'
import Link from 'next/link'

/**
 * Página que processa a confirmação de email quando o link usa hash (#access_token=...).
 * O Supabase pode enviar o token no hash, que só está disponível no client.
 */
export default function AuthConfirmarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Confirmando seu email...')

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function handleHash() {
      // Se veio ?code= (PKCE), redirecionar para o callback que troca no servidor
      const code = searchParams.get('code')
      if (code) {
        const callbackUrl = `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
        window.location.href = callbackUrl
        return
      }

      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          setStatus('error')
          setMessage(error.message)
          return
        }

        // Verificar se há token de convite na URL
        const token = searchParams.get('token')
        
        if (token) {
          // Aguardar um pouco para garantir que a sessão foi estabelecida
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Aceitar convite automaticamente
          try {
            const acceptResponse = await fetch('/api/invites/accept', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token }),
            })
            
            const acceptResult = await acceptResponse.json()
            
            if (acceptResult.error) {
              setStatus('error')
              setMessage(`Erro ao aceitar convite: ${acceptResult.error}`)
              return
            }
            
            setStatus('success')
            setMessage('Email confirmado e convite aceito com sucesso!')
            // Limpar o hash da URL
            window.history.replaceState(null, '', window.location.pathname + window.location.search)
            // Redirecionar para dashboard
            setTimeout(() => {
              router.push('/dashboard')
            }, 2000)
            return
          } catch (err: any) {
            setStatus('error')
            setMessage(`Erro ao aceitar convite: ${err.message}`)
            return
          }
        }

        setStatus('success')
        setMessage('Email confirmado com sucesso!')
        // Limpar o hash da URL
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        // Redirecionar após mostrar mensagem
        const redirectUrl = next.startsWith('/') ? next : `/${next}`
        setTimeout(() => {
          router.push(`${redirectUrl}?email_confirmed=true`)
        }, 2000)
      } else if (searchParams.get('email_confirmed') === 'true') {
        setStatus('success')
        setMessage('Email confirmado com sucesso!')
        setTimeout(() => router.push(next), 1500)
      } else {
        setStatus('error')
        setMessage('Link inválido ou já utilizado. Tente fazer login.')
      }
    }

    handleHash()
  }, [router, next, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-4">
              <FaSpinner className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Confirmando email</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-4">
                <FaCheck className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email confirmado!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500 mb-4">Redirecionando...</p>
            <Link href={next.startsWith('/') ? next : `/${next}`}>
              <Button>Continuar agora</Button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 rounded-full p-4">
                <span className="text-2xl text-red-600">✕</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro na confirmação</h1>
            <p className="text-red-600 mb-6">{message}</p>
            <Link href="/login">
              <Button>Ir para Login</Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  )
}
