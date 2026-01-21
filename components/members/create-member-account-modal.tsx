'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createMemberAccountSchema, type CreateMemberAccountInput } from '@/lib/validations/members'
import { createMemberAccount } from '@/app/actions/members'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { FaEnvelope, FaLock, FaTimes } from 'react-icons/fa'

interface CreateMemberAccountModalProps {
  memberId: string
  memberEmail: string
  onClose: () => void
}

export function CreateMemberAccountModal({
  memberId,
  memberEmail,
  onClose,
}: CreateMemberAccountModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateMemberAccountInput>({
    resolver: zodResolver(createMemberAccountSchema),
    defaultValues: {
      memberId,
      email: memberEmail,
    },
  })

  async function onSubmit(data: CreateMemberAccountInput) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createMemberAccount(data)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          onClose()
          window.location.reload()
        }, 2000)
      }
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Conta Criada!</h3>
            <p className="text-gray-600">
              A conta do membro foi criada com sucesso. As credenciais foram configuradas.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Criar Conta para Membro</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('memberId')} />

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                E-mail *
              </label>
              <Input
                type="email"
                placeholder="membro@email.com"
                icon={<FaEnvelope />}
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Senha Temporária *
              </label>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                icon={<FaLock />}
                error={errors.password?.message}
                {...register('password')}
              />
              <p className="mt-1 text-xs text-gray-500">
                O membro poderá alterar a senha após o primeiro login.
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Criando...' : 'Criar Conta'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

