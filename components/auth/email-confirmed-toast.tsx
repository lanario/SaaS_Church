'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FaCheck } from 'react-icons/fa'

/**
 * Mostra um aviso de "Email confirmado!" quando o usuário volta da confirmação.
 */
export function EmailConfirmedToast() {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (searchParams.get('email_confirmed') === 'true') {
      setShow(true)
      // Remover o parâmetro da URL sem recarregar
      const url = new URL(window.location.href)
      url.searchParams.delete('email_confirmed')
      window.history.replaceState({}, '', url.pathname + url.search)
      // Esconder após 5 segundos
      const t = setTimeout(() => setShow(false), 5000)
      return () => clearTimeout(t)
    }
    return undefined
  }, [searchParams])

  if (!show) return null

  return (
    <div
      className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-green-600 text-white shadow-lg border border-green-500/50 animate-in slide-in-from-top-2"
      role="alert"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/30">
        <FaCheck className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold">Email confirmado!</p>
        <p className="text-sm text-green-100">Sua conta foi ativada com sucesso.</p>
      </div>
      <button
        onClick={() => setShow(false)}
        className="ml-2 p-1 rounded hover:bg-green-500/30 transition-colors"
        aria-label="Fechar"
      >
        ✕
      </button>
    </div>
  )
}
