import { createClient } from '@/lib/supabase/server'
import { getChurch } from '@/app/actions/settings'
import { SettingsTabsWrapper } from '@/components/settings/settings-tabs-wrapper'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { ensureUserProfile } from '@/lib/utils/ensure-user-profile'

export default async function AjustesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Garantir que o perfil existe usando função centralizada
  const { error, profile } = await ensureUserProfile()

  if (error || !profile) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <Card className="p-6 bg-slate-700 border border-red-600">
          <div className="text-center py-8">
            <h2 className="text-xl font-bold text-red-400 mb-4">Atenção</h2>
            <p className="text-red-300 mb-4">
              {error || 'Perfil não encontrado. Por favor, faça logout e login novamente.'}
            </p>
            <p className="text-sm text-slate-400 mb-4">
              Se você acabou de se cadastrar, pode ser que seu perfil ainda esteja sendo configurado.
              Tente fazer logout e login novamente.
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Se o problema persistir, execute o script SQL: supabase/VERIFICAR_E_CORRIGIR_PERFIL.sql
            </p>
            <a
              href="/login"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Ir para Login
            </a>
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
          <h1 className="text-3xl font-bold text-white mb-2">Ajustes</h1>
          <p className="text-slate-300">Gerencie suas configurações pessoais e da igreja</p>
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

