'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FaChurch, FaEnvelope, FaLock, FaShieldAlt } from 'react-icons/fa'
import { signIn } from '@/app/actions/auth'
import { loginSchema, type LoginInput } from '@/lib/validations/schemas'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn(data.email, data.password)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.')
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

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Bem-vindo de volta!</h2>
          <p className="text-slate-500 mb-6">Entre com suas credenciais para acessar o painel</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                icon={<FaEnvelope />}
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Senha</label>
              <Input
                type="password"
                placeholder="••••••••"
                icon={<FaLock />}
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  {...register('rememberMe')}
                />
                <span className="text-sm text-slate-600">Lembrar de mim</span>
              </label>
              <Link href="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold">
                Esqueceu a senha?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar no Painel'}
            </Button>
          </form>

          {/* Toggle to Register */}
          <p className="text-center text-sm text-slate-600 mt-6">
            Não tem uma conta?{' '}
            <Link href="/register" className="text-indigo-600 font-bold hover:text-indigo-700">
              Cadastre-se gratuitamente
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

