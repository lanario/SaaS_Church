'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateChurch } from '@/app/actions/settings'
import { updateChurchSchema } from '@/lib/validations/settings'
import type { UpdateChurchInput } from '@/lib/validations/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { FaCheck, FaTimes, FaChurch } from 'react-icons/fa'

interface ChurchFormProps {
  initialData: {
    name: string
    logo_url?: string | null
  }
}

export function ChurchForm({ initialData }: ChurchFormProps) {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateChurchInput>({
    resolver: zodResolver(updateChurchSchema),
    defaultValues: {
      name: initialData.name,
      logo_url: initialData.logo_url || '',
    },
  })

  async function onSubmit(data: UpdateChurchInput) {
    setIsSubmitting(true)
    setMessage(null)

    const result = await updateChurch(data)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Informações da igreja atualizadas com sucesso!' })
      // Recarregar a página após 1 segundo
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
    
    setIsSubmitting(false)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FaChurch className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">Informações da Igreja</h2>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome da Igreja
          </label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Nome da sua igreja"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-1">
            URL do Logo
          </label>
          <Input
            id="logo_url"
            type="url"
            {...register('logo_url')}
            placeholder="https://exemplo.com/logo.png"
          />
          {errors.logo_url && (
            <p className="mt-1 text-sm text-red-600">{errors.logo_url.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

