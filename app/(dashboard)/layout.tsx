import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

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

  // Buscar perfil do usuário
  // Tentar buscar sem .single() primeiro para evitar erro fatal
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('full_name, email, avatar_url, church_id')
    .eq('id', user.id)
    .limit(1)

  let profile = profiles && profiles.length > 0 ? profiles[0] : null

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
        const { data: newProfiles } = await supabase
          .from('user_profiles')
          .select('full_name, email, avatar_url, church_id')
          .eq('id', user.id)
          .limit(1)
        
        profile = newProfiles && newProfiles.length > 0 ? newProfiles[0] : null

        // Criar permissões se necessário
        if (profile) {
          await supabase
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
        }
      }
    }
  }

  return (
    <div className="bg-slate-900 flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-800">
        <Header
          userName={profile?.full_name || user.email?.split('@')[0] || 'Usuário'}
          userEmail={profile?.email || user.email || undefined}
          userAvatar={profile?.avatar_url || undefined}
        />
        <div className="flex-1 overflow-y-auto bg-slate-800">
          {children}
        </div>
      </main>
    </div>
  )
}
