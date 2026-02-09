'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createAccountFromInvite } from '@/app/actions/invites'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FaSpinner, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'

const acceptInviteSchema = z.object({
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .default('12345678'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>

interface AcceptInviteFormProps {
  token: string
  email: string
  inviteType: 'collaborator' | 'member'
}

export function AcceptInviteForm({ token, email, inviteType: _inviteType }: AcceptInviteFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      password: '12345678',
      confirmPassword: '12345678',
    },
  })

  async function onSubmit(data: AcceptInviteFormData) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createAccountFromInvite(token, data.password)
      
      if (result.error) {
        // Se o erro for sobre email já existir, sugerir login
        if (result.error.includes('already registered') || result.error.includes('já existe') || result.existingUser) {
          setError(`${result.error} Faça login com este email e acesse o link do convite novamente.`)
        } else if (result.needsEmailConfirmation) {
          // Se precisa confirmar email
          setError(`${result.error}`)
        } else if (result.needsLogin) {
          // Se precisa fazer login manualmente
          setError(`${result.error}`)
          // Redirecionar para login após 2 segundos
          setTimeout(() => {
            window.location.href = `/login?email=${encodeURIComponent(email)}&invite=${token}`
          }, 2000)
        } else {
          setError(result.error)
        }
      } else {
        // Sucesso! Aguardar um pouco para garantir que a sessão foi criada
        await new Promise(resolve => setTimeout(resolve, 1000))
        // Redirecionar para página de sucesso
        window.location.href = `/convite/${token}?accepted=true`
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          <p className="font-semibold mb-1">Erro:</p>
          <p>{error}</p>
          {error.includes('já existe') || error.includes('already registered') ? (
            <Link 
              href={`/login?email=${encodeURIComponent(email)}&invite=${token}`}
              className="mt-2 inline-block text-sm text-indigo-600 hover:underline font-semibold"
            >
              → Fazer login com {email}
            </Link>
          ) : null}
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
          Senha
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Senha padrão: 12345678"
            icon={<FaLock />}
            error={errors.password?.message}
            {...register('password')}
            onChange={(e) => {
              setValue('password', e.target.value)
              register('password').onChange(e)
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Senha padrão: <strong>12345678</strong> (você pode alterar depois)
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
          Confirmar Senha
        </label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Digite a senha novamente"
            icon={<FaLock />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
            onChange={(e) => {
              setValue('confirmPassword', e.target.value)
              register('confirmPassword').onChange(e)
            }}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        <p className="font-semibold mb-1">⚠️ Importante:</p>
        <p>
          Sua conta será criada com a senha padrão <strong>12345678</strong>. 
          Recomendamos alterar a senha após o primeiro login nas configurações.
        </p>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            Criando conta...
          </>
        ) : (
          'Criar Conta e Aceitar Convite'
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        Ao criar a conta, você concorda com os termos de uso e política de privacidade.
      </p>
    </form>
  )
}
