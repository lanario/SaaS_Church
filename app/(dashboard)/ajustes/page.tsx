import { createClient } from '@/lib/supabase/server'
import { getChurch } from '@/app/actions/settings'
import { SettingsTabsWrapper } from '@/components/settings/settings-tabs-wrapper'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'

export default async function AjustesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Buscar perfil do usuário
  const { data: profileData } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .limit(1)
    .single()

  const profile = profileData || null

  if (!profile) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <Card className="p-6">
          <div className="text-center py-8">
            <p className="text-red-600">Perfil não encontrado. Por favor, faça logout e login novamente.</p>
          </div>
        </Card>
      </div>
    )
  }

  // Buscar igreja
  const churchResult = await getChurch()
  const church = churchResult.church || { name: '', logo_url: null }

  // Verificar se é owner para mostrar gestão de permissões
  const isOwner = profile.role === 'owner'

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ajustes</h1>
          <p className="text-gray-600">Gerencie suas configurações pessoais e da igreja</p>
        </div>

        <SettingsTabsWrapper
          isOwner={isOwner}
          profileData={{
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            avatar_url: profile.avatar_url,
          }}
          churchData={{
            name: church.name,
            logo_url: church.logo_url,
          }}
        />
      </div>
    </div>
  )
}

