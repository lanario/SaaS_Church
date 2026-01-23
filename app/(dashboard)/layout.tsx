import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

// Cachear busca de perfil para evitar queries repetidas
const getProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('full_name, email, avatar_url, church_id')
    .eq('id', userId)
    .limit(1)
    .maybeSingle()

  return profiles
})

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

  // Buscar perfil do usuário (com cache)
  let profile = await getProfile(user.id)

  // Se não encontrar perfil, tentar criar automaticamente apenas se houver igreja existente
  if (!profile) {
    // Buscar igreja existente
    const { data: churches } = await supabase
      .from('churches')
      .select('id')
      .limit(1)

    const churchId = churches && churches.length > 0 ? churches[0].id : null

    // Apenas criar perfil se houver igreja existente
    if (churchId) {
      const { error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          church_id: churchId,
          full_name: user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          role: 'owner',
        })

      if (!createError) {
        // Buscar perfil recém criado
        profile = await getProfile(user.id)

        // Criar permissões se necessário (não bloquear renderização)
        if (profile) {
          supabase
            .from('user_permissions')
            .upsert({
              user_id: user.id,
              church_id: churchId,
              can_manage_finances: true,
              can_manage_members: true,
              can_manage_events: true,
              can_view_reports: true,
              can_send_whatsapp: true,
            })
            .then(() => {}) // Fire and forget
        }
      }
    }
  }

  return (
    <div className="bg-slate-900 flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-800 min-w-0">
        <Header />
        <div className="flex-1 overflow-y-auto bg-slate-800">
          {children}
        </div>
      </main>
    </div>
  )
}
