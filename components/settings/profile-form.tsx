'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateProfile, changePassword } from '@/app/actions/settings'
import { updateProfileSchema, changePasswordSchema } from '@/lib/validations/settings'
import type { UpdateProfileInput, ChangePasswordInput } from '@/lib/validations/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { FaCheck, FaTimes, FaUser, FaLock } from 'react-icons/fa'

interface ProfileFormProps {
  initialData: {
    full_name: string
    email: string
    phone?: string | null
    avatar_url?: string | null
  }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: errorsProfile },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      full_name: initialData.full_name,
      email: initialData.email,
      phone: initialData.phone || '',
      avatar_url: initialData.avatar_url || '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: errorsPassword },
    reset: resetPassword,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  })

  async function onSubmitProfile(data: UpdateProfileInput) {
    setIsSubmitting(true)
    setMessage(null)

    const result = await updateProfile(data)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
      // Recarregar a página após 1 segundo para atualizar dados
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
    
    setIsSubmitting(false)
  }

  async function onSubmitPassword(data: ChangePasswordInput) {
    setIsSubmitting(true)
    setMessage(null)

    const result = await changePassword(data)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' })
      resetPassword()
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
            activeTab === 'profile'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FaUser className="w-4 h-4" />
          Dados Pessoais
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
            activeTab === 'password'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FaLock className="w-4 h-4" />
          Alterar Senha
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <FaCheck className="w-5 h-5" />
          ) : (
            <FaTimes className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card className="p-6">
          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <Input
                id="full_name"
                {...registerProfile('full_name')}
                placeholder="Seu nome completo"
              />
              {errorsProfile.full_name && (
                <p className="mt-1 text-sm text-red-600">{errorsProfile.full_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                {...registerProfile('email')}
                placeholder="seu@email.com"
              />
              {errorsProfile.email && (
                <p className="mt-1 text-sm text-red-600">{errorsProfile.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <Input
                id="phone"
                type="tel"
                {...registerProfile('phone')}
                placeholder="(00) 00000-0000"
              />
              {errorsProfile.phone && (
                <p className="mt-1 text-sm text-red-600">{errorsProfile.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 mb-1">
                URL do Avatar
              </label>
              <Input
                id="avatar_url"
                type="url"
                {...registerProfile('avatar_url')}
                placeholder="https://exemplo.com/avatar.jpg"
              />
              {errorsProfile.avatar_url && (
                <p className="mt-1 text-sm text-red-600">{errorsProfile.avatar_url.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <Card className="p-6">
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Senha Atual
              </label>
              <Input
                id="currentPassword"
                type="password"
                {...registerPassword('currentPassword')}
                placeholder="Digite sua senha atual"
              />
              {errorsPassword.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{errorsPassword.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nova Senha
              </label>
              <Input
                id="newPassword"
                type="password"
                {...registerPassword('newPassword')}
                placeholder="Digite a nova senha"
              />
              {errorsPassword.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errorsPassword.newPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Nova Senha
              </label>
              <Input
                id="confirmPassword"
                type="password"
                {...registerPassword('confirmPassword')}
                placeholder="Confirme a nova senha"
              />
              {errorsPassword.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errorsPassword.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}

