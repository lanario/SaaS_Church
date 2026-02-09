import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Suspense } from 'react'
import { EmailConfirmedToast } from '@/components/auth/email-confirmed-toast'
import { ensureUserProfile } from '@/lib/utils/ensure-user-profile'
import { runMigrations } from '@/app/actions/migrations'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Garantir que o perfil existe (função centralizada)
  const { error, profile } = await ensureUserProfile()

  // Se houver erro ao garantir perfil, mostrar mensagem mas não bloquear completamente
  // O perfil pode ser criado em uma próxima requisição
  if (error && !profile) {
    console.error('Erro ao garantir perfil:', error)
  }

  // Executar migrações automaticamente em background (não bloqueia a renderização)
  // Apenas na primeira vez ou quando houver novos arquivos SQL
  if (process.env.NODE_ENV === 'production' || process.env.AUTO_RUN_MIGRATIONS === 'true') {
    runMigrations().catch(err => {
      // Silenciosamente falhar - não queremos bloquear o app se as migrações falharem
      console.warn('Migrações automáticas falharam (não crítico):', err)
    })
  }

  return (
    <div className="bg-slate-900 flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-800 min-w-0">
        <Header />
        <Suspense fallback={null}>
          <EmailConfirmedToast />
        </Suspense>
        <div className="flex-1 overflow-y-auto bg-slate-800 scrollbar-hide">
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  )
}
