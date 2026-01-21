'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FaChurch, FaUser, FaEnvelope, FaPhone, FaLock, FaShieldAlt } from 'react-icons/fa'
import { signUp } from '@/app/actions/auth'
import { registerSchema, type RegisterInput } from '@/lib/validations/schemas'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signUp(data)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="bg-indigo-600 p-3 rounded-xl shadow-lg">
              <FaChurch className="text-white text-2xl" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight font-display">
              Tesour<span className="text-indigo-600">App</span>
            </span>
          </div>
          <p className="text-slate-600">Gestão Financeira para Igrejas</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Crie sua conta</h2>
          <p className="text-slate-500 mb-6">Preencha os dados para começar a usar o sistema</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome da Igreja */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nome da Igreja
              </label>
              <Input
                type="text"
                placeholder="Igreja Batista Central"
                icon={<FaChurch />}
                error={errors.churchName?.message}
                {...register('churchName')}
              />
            </div>

            {/* Nome Completo */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nome Completo
              </label>
              <Input
                type="text"
                placeholder="João da Silva"
                icon={<FaUser />}
                error={errors.fullName?.message}
                {...register('fullName')}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail</label>
              <Input
                type="email"
                placeholder="tesoureiro@igreja.com"
                icon={<FaEnvelope />}
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Telefone</label>
              <Input
                type="tel"
                placeholder="(11) 98765-4321"
                icon={<FaPhone />}
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Senha</label>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                icon={<FaLock />}
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Confirmar Senha
              </label>
              <Input
                type="password"
                placeholder="Digite a senha novamente"
                icon={<FaLock />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 mt-1 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                {...register('termsAccepted')}
              />
              <span className="text-sm text-slate-600">
                Eu concordo com os{' '}
                <Link href="#" className="text-indigo-600 font-semibold hover:underline">
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link href="#" className="text-indigo-600 font-semibold hover:underline">
                  Política de Privacidade
                </Link>
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="text-sm text-red-600">{errors.termsAccepted.message}</p>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Criando conta...' : 'Criar Conta Gratuitamente'}
            </Button>
          </form>

          {/* Toggle to Login */}
          <p className="text-center text-sm text-slate-600 mt-6">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-indigo-600 font-bold hover:text-indigo-700">
              Faça login
            </Link>
          </p>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
            <FaShieldAlt className="text-indigo-600" />
            Seus dados estão protegidos com criptografia de ponta a ponta
          </p>
        </div>
      </div>
    </div>
  )
}

