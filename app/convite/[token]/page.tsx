import { acceptInvite, signOutAndRedirectToInvite } from '@/app/actions/invites'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FaCheck, FaTimes, FaLock } from 'react-icons/fa'
import Link from 'next/link'
import { AcceptInviteForm } from '@/components/invites/accept-invite-form'

function SignOutForm({ token, email }: { token: string; email: string }) {
  return (
    <form action={signOutAndRedirectToInvite.bind(null, token)} className="w-full">
      <Button type="submit" className="w-full">
        Fazer Logout e Criar Conta com {email}
      </Button>
    </form>
  )
}

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

  // Buscar informações do convite
  const { data: inviteInfo } = await supabase
    .from('church_invites')
    .select('email, invite_type, status, expires_at')
    .eq('token', params.token)
    .single()

  // Se já aceitou via query param, mostrar sucesso
  if (searchParams.accepted === 'true') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
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
            {inviteInfo?.invite_type === 'collaborator' 
              ? 'Você agora tem acesso completo ao sistema como colaborador.'
              : 'Você agora tem acesso aos eventos da igreja.'}
          </p>
          {user ? (
            <Link href="/dashboard">
              <Button>Ir para Dashboard</Button>
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

  // Se não há convite válido
  if (!inviteInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 rounded-full p-4">
              <FaTimes className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Convite Inválido
          </h1>
          <p className="text-red-600 mb-6">
            Este convite não foi encontrado ou já foi usado.
          </p>
          <Link href="/login">
            <Button variant="outline">Ir para Login</Button>
          </Link>
        </Card>
      </div>
    )
  }

  // Se o convite expirou
  if (new Date(inviteInfo.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 rounded-full p-4">
              <FaTimes className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Convite Expirado
          </h1>
          <p className="text-red-600 mb-6">
            Este convite expirou. Entre em contato com o administrador para receber um novo convite.
          </p>
          <Link href="/login">
            <Button variant="outline">Ir para Login</Button>
          </Link>
        </Card>
      </div>
    )
  }

  // Se não está logado, mostrar formulário de criação de conta
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-indigo-100 rounded-full p-4">
                <FaLock className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Criar Conta
            </h1>
            <p className="text-gray-600">
              Você foi convidado para ser <strong>{inviteInfo.invite_type === 'collaborator' ? 'Colaborador' : 'Membro'}</strong>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Email: <strong>{inviteInfo.email}</strong>
            </p>
          </div>
          <AcceptInviteForm token={params.token} email={inviteInfo.email} inviteType={inviteInfo.invite_type || 'member'} />
        </Card>
      </div>
    )
  }

  // Se está logado, verificar se o email corresponde
  if (user?.email && inviteInfo.email.toLowerCase() !== user.email.toLowerCase()) {
    // Email diferente - mostrar opção de logout e criar conta
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-amber-100 rounded-full p-4">
                <FaLock className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email Diferente
            </h1>
            <p className="text-gray-600 mb-4">
              Este convite foi enviado para um email diferente do que você está usando.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-left mb-4">
              <p className="font-semibold mb-2 text-amber-800">Informações:</p>
              <p className="text-amber-700">Convite enviado para: <strong>{inviteInfo.email}</strong></p>
              <p className="text-amber-700">Você está logado como: <strong>{user.email}</strong></p>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Para aceitar este convite, você precisa fazer logout e criar uma conta com o email <strong>{inviteInfo.email}</strong>.
            </p>
          </div>
          <div className="space-y-3">
            <SignOutForm token={params.token} email={inviteInfo.email} />
            <Link href="/dashboard" className="block">
              <Button variant="outline" className="w-full">
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // Se está logado com email correto, tentar aceitar o convite
  const result = await acceptInvite({ token: params.token })

  if (result.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
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
