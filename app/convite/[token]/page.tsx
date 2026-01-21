import { acceptInvite } from '@/app/actions/invites'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FaCheck, FaTimes, FaEnvelope } from 'react-icons/fa'
import Link from 'next/link'

interface AcceptInvitePageProps {
  params: {
    token: string
  }
  searchParams: {
    accepted?: string
  }
}

export default async function AcceptInvitePage({ 
  params,
  searchParams 
}: AcceptInvitePageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Se já aceitou via query param, mostrar sucesso
  if (searchParams.accepted === 'true') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-4">
              <FaCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Convite Aceito!
          </h1>
          <p className="text-gray-600 mb-6">
            Você agora tem acesso aos eventos da igreja.
          </p>
          {user ? (
            <Link href="/eventos">
              <Button>Ir para Eventos</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button>Fazer Login</Button>
            </Link>
          )}
        </Card>
      </div>
    )
  }

  // Se não está logado, redirecionar para login com token
  if (!user) {
    redirect(`/login?invite=${params.token}`)
  }

  // Aceitar convite
  const result = await acceptInvite({ token: params.token })

  if (result.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 rounded-full p-4">
              <FaTimes className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Erro ao Aceitar Convite
          </h1>
          <p className="text-red-600 mb-6">
            {result.error}
          </p>
          <Link href="/dashboard">
            <Button variant="outline">Voltar ao Dashboard</Button>
          </Link>
        </Card>
      </div>
    )
  }

  // Redirecionar com sucesso
  redirect('/convite/' + params.token + '?accepted=true')
}

