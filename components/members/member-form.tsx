'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { memberSchema, type MemberInput } from '@/lib/validations/members'
import { createMember, updateMember } from '@/app/actions/members'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DateInput } from '@/components/ui/date-input'
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaMapMarkerAlt, FaSearch, FaSpinner } from 'react-icons/fa'
import { formatCEPDisplay, formatCEP, isValidCEP } from '@/lib/utils/cep'
import { AddressFieldsCheck } from './address-fields-check'
import { Controller } from 'react-hook-form'

interface MemberFormProps {
  member?: MemberInput & { id?: string }
  mode?: 'create' | 'edit'
}

export function MemberForm({ member, mode = 'create' }: MemberFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingCEP, setLoadingCEP] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<MemberInput>({
    resolver: zodResolver(memberSchema),
    defaultValues: member || {
      status: 'active',
    },
  })

  const zipCode = watch('zipCode')

  /**
   * Busca dados do CEP e preenche automaticamente os campos de endereço
   */
  async function handleCEPBlur() {
    const currentCEP = zipCode
    if (!currentCEP || currentCEP.trim() === '') {
      return
    }

    const cleaned = formatCEP(currentCEP)
    if (!isValidCEP(cleaned)) {
      setCepError('CEP inválido')
      return
    }

    setLoadingCEP(true)
    setCepError(null)

    try {
      const response = await fetch(`/api/cep/${cleaned}`)
      const data = await response.json()

      if (!response.ok || data.error) {
        setCepError(data.error || 'CEP não encontrado')
        return
      }

      // Preencher campos automaticamente
      setValue('street', data.logradouro || '')
      setValue('neighborhood', data.bairro || '')
      setValue('city', data.localidade || '')
      setValue('state', data.uf || '')
      setValue('addressComplement', data.complemento || '')
      
      // Formatar CEP para exibição
      setValue('zipCode', formatCEPDisplay(cleaned))
    } catch (err) {
      setCepError('Erro ao buscar CEP. Tente novamente.')
    } finally {
      setLoadingCEP(false)
    }
  }

  /**
   * Formata CEP enquanto o usuário digita
   */
  function handleCEPChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    const cleaned = formatCEP(value)
    
    if (cleaned.length <= 8) {
      const formatted = cleaned.length > 5 
        ? `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
        : cleaned
      setValue('zipCode', formatted)
    }
  }

  async function onSubmit(data: MemberInput) {
    setIsLoading(true)
    setError(null)

    try {
      let result
      if (mode === 'edit' && member?.id) {
        result = await updateMember(member.id, data)
      } else {
        result = await createMember(data)
      }

      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/membros')
        router.refresh()
      }
    } catch (err) {
      setError('Erro ao salvar membro. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-8">
        <AddressFieldsCheck />
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Nome Completo *
            </label>
            <Input
              type="text"
              placeholder="João da Silva"
              icon={<FaUser />}
              error={errors.fullName?.message}
              {...register('fullName')}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              E-mail
            </label>
            <Input
              type="email"
              placeholder="joao@email.com"
              icon={<FaEnvelope />}
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Telefone
            </label>
            <Input
              type="tel"
              placeholder="(11) 98765-4321"
              icon={<FaPhone />}
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Data de Nascimento
              </label>
              <Controller
                name="birthDate"
                control={control}
                render={({ field }) => (
                  <DateInput
                    value={field.value || ''}
                    onChange={field.onChange}
                    icon={<FaCalendar />}
                    error={errors.birthDate?.message}
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Membro desde
              </label>
              <Controller
                name="memberSince"
                control={control}
                render={({ field }) => (
                  <DateInput
                    value={field.value || ''}
                    onChange={field.onChange}
                    icon={<FaCalendar />}
                    error={errors.memberSince?.message}
                  />
                )}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Status
            </label>
            <select
              {...register('status')}
              className="w-full px-4 py-3 border border-slate-500 bg-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="active" className="bg-slate-700 text-white">Ativo</option>
              <option value="inactive" className="bg-slate-700 text-white">Inativo</option>
              <option value="visitor" className="bg-slate-700 text-white">Visitante</option>
            </select>
          </div>

          {/* Seção de Endereço */}
          <div className="border-t border-slate-600 pt-6 mt-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaMapMarkerAlt className="text-indigo-400" />
              Endereço
            </h3>

            <div className="space-y-4">
              {/* CEP */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  CEP
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="00000-000"
                    icon={loadingCEP ? <FaSpinner className="animate-spin" /> : <FaMapMarkerAlt />}
                    error={cepError || errors.zipCode?.message}
                    {...register('zipCode')}
                    onChange={handleCEPChange}
                    onBlur={handleCEPBlur}
                    maxLength={9}
                  />
                  {zipCode && isValidCEP(formatCEP(zipCode)) && !loadingCEP && (
                    <button
                      type="button"
                      onClick={handleCEPBlur}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-300 transition-colors"
                      title="Buscar CEP"
                    >
                      <FaSearch />
                    </button>
                  )}
                </div>
                {cepError && (
                  <p className="mt-1 text-sm text-red-400">{cepError}</p>
                )}
              </div>

              {/* Rua e Número */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-white mb-2">
                    Rua/Logradouro
                  </label>
                  <Input
                    type="text"
                    placeholder="Rua, Avenida, etc."
                    error={errors.street?.message}
                    {...register('street')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Número
                  </label>
                  <Input
                    type="text"
                    placeholder="123"
                    error={errors.addressNumber?.message}
                    {...register('addressNumber')}
                  />
                </div>
              </div>

              {/* Complemento e Bairro */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Complemento
                  </label>
                  <Input
                    type="text"
                    placeholder="Apto, Bloco, etc."
                    error={errors.addressComplement?.message}
                    {...register('addressComplement')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Bairro
                  </label>
                  <Input
                    type="text"
                    placeholder="Bairro"
                    error={errors.neighborhood?.message}
                    {...register('neighborhood')}
                  />
                </div>
              </div>

              {/* Cidade e Estado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-white mb-2">
                    Cidade
                  </label>
                  <Input
                    type="text"
                    placeholder="Cidade"
                    error={errors.city?.message}
                    {...register('city')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Estado (UF)
                  </label>
                  <Input
                    type="text"
                    placeholder="SP"
                    maxLength={2}
                    error={errors.state?.message}
                    {...register('state')}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Observações
            </label>
            <textarea
              {...register('notes')}
              className="w-full px-4 py-3 border border-slate-500 bg-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400"
              rows={3}
              placeholder="Observações sobre o membro..."
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Salvando...' : mode === 'edit' ? 'Atualizar Membro' : 'Salvar Membro'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

