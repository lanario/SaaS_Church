'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { revenueSchema, type RevenueInput } from '@/lib/validations/financial'
import { createRevenue, updateRevenue } from '@/app/actions/financial'
import { getMembers } from '@/app/actions/members'
import { Input } from '@/components/ui/input'
import { DateInput } from '@/components/ui/date-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FaDollarSign, FaCalendar } from 'react-icons/fa'
import { format } from 'date-fns'

interface RevenueFormProps {
  categories: Array<{ id: string; name: string; color: string }>
  revenue?: {
    id: string
    categoryId?: string | null
    amount: number
    description?: string | null
    paymentMethod: string
    transactionDate: string
    memberId?: string | null
  }
  mode?: 'create' | 'edit'
}

interface Member {
  id: string
  full_name: string
}

export function RevenueForm({ categories, revenue, mode = 'create' }: RevenueFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<RevenueInput>({
    resolver: zodResolver(revenueSchema),
    defaultValues: revenue ? {
      categoryId: revenue.categoryId || '',
      amount: revenue.amount,
      description: revenue.description || undefined,
      paymentMethod: revenue.paymentMethod as 'cash' | 'pix' | 'card' | 'transfer',
      transactionDate: revenue.transactionDate.split('T')[0],
      memberId: revenue.memberId || undefined,
    } : {
      paymentMethod: 'cash',
      transactionDate: new Date().toISOString().split('T')[0],
      categoryId: '',
      memberId: '',
      description: '',
    },
  })

  const categoryId = watch('categoryId')
  const transactionDate = watch('transactionDate')
  const memberId = watch('memberId')

  // Carregar membros quando necessário
  useEffect(() => {
    async function loadMembers() {
      const currentCategoryId = selectedCategoryId || categoryId
      if (currentCategoryId) {
        const category = categories.find(c => c.id === currentCategoryId)
        const categoryName = category?.name?.toLowerCase() || ''
        
        if (categoryName === 'dízimos' || categoryName === 'dizimos') {
          setIsLoadingMembers(true)
          const result = await getMembers()
          if (result.data) {
            setMembers(result.data as unknown as any[])
          }
          setIsLoadingMembers(false)
        } else {
          setMembers([])
        }
      } else {
        setMembers([])
      }
    }
    loadMembers()
  }, [selectedCategoryId, categoryId, categories])

  // Atualizar descrição automaticamente (apenas no modo de criação)
  useEffect(() => {
    if (mode === 'create' && categoryId && transactionDate) {
      const category = categories.find(c => c.id === categoryId)
      const categoryName = category?.name?.toLowerCase() || ''

      if (categoryName === 'ofertas') {
        const date = new Date(transactionDate)
        const dateStr = format(date, "dd/MM/yyyy")
        setValue('description', `Oferta do dia ${dateStr}`)
        setValue('memberId', '') // Limpar membro para ofertas
      } else if ((categoryName === 'dízimos' || categoryName === 'dizimos') && memberId) {
        const member = members.find(m => m.id === memberId)
        if (member) {
          setValue('description', `Dízimo de ${member.full_name}`)
        }
      }
    }
  }, [categoryId, transactionDate, memberId, members, categories, setValue, mode])

  // Detectar mudança na categoria
  useEffect(() => {
    setSelectedCategoryId(categoryId || '')
  }, [categoryId])

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)
  const isDizimos = selectedCategory?.name?.toLowerCase() === 'dízimos' || selectedCategory?.name?.toLowerCase() === 'dizimos'
  const isOfertas = selectedCategory?.name?.toLowerCase() === 'ofertas'
  const isDefaultCategory = isDizimos || isOfertas

  async function onSubmit(data: RevenueInput) {
    setIsLoading(true)
    setError(null)

    console.log('Form data:', data)
    console.log('Selected category:', selectedCategory)

    // Validação básica
    if (!data.amount || data.amount <= 0) {
      setError('Por favor, informe um valor válido')
      setIsLoading(false)
      return
    }

    if (!data.categoryId) {
      setError('Por favor, selecione uma categoria')
      setIsLoading(false)
      return
    }

    // Validação: Dízimos requerem membro
    if (isDizimos && (!data.memberId || data.memberId === '')) {
      setError('Dízimos requerem seleção de um membro')
      setIsLoading(false)
      return
    }

    // Normalizar dados antes de enviar
    const submitData: RevenueInput = {
      amount: data.amount,
      categoryId: data.categoryId && data.categoryId !== '' ? data.categoryId : null,
      memberId: data.memberId && data.memberId !== '' ? data.memberId : null,
      description: data.description && data.description !== '' ? data.description : null,
      paymentMethod: isDefaultCategory ? 'cash' : (data.paymentMethod || 'cash'),
      transactionDate: data.transactionDate,
    }

    console.log('Submitting data:', submitData)

    try {
      let result
      if (mode === 'edit' && revenue) {
        result = await updateRevenue(revenue.id, submitData)
      } else {
        result = await createRevenue(submitData)
      }
      
      console.log(`${mode === 'edit' ? 'Update' : 'Create'} revenue result:`, result)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        router.push('/receitas')
        router.refresh()
      } else {
        setError(`Erro desconhecido ao ${mode === 'edit' ? 'atualizar' : 'salvar'} receita`)
      }
    } catch (err) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} revenue:`, err)
      setError(`Erro ao ${mode === 'edit' ? 'atualizar' : 'criar'} receita: ${err instanceof Error ? err.message : 'Tente novamente.'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-slate-700 border border-slate-600">
      <CardContent className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit, (errors) => {
          console.log('Form validation errors:', errors)
          if (errors.amount) {
            setError(errors.amount.message || 'Valor inválido')
          } else if (errors.categoryId) {
            setError(errors.categoryId.message || 'Categoria inválida')
          } else if (errors.transactionDate) {
            setError(errors.transactionDate.message || 'Data inválida')
          }
        })} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Categoria
            </label>
            <select
              {...register('categoryId')}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" className="bg-slate-800">Selecione uma categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id} className="bg-slate-800">
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-400">{errors.categoryId.message}</p>
            )}
            {errors.amount && (
              <p className="mt-1 text-sm text-red-400">{errors.amount.message}</p>
            )}
            {errors.transactionDate && (
              <p className="mt-1 text-sm text-red-400">{errors.transactionDate.message}</p>
            )}
          </div>

          {/* Campo de Membro - apenas para Dízimos */}
          {isDizimos && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Membro <span className="text-red-400">*</span>
              </label>
              {isLoadingMembers ? (
                <div className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-slate-400">
                  Carregando membros...
                </div>
              ) : (
                <Controller
                  name="memberId"
                  control={control}
                  rules={{ required: isDizimos ? 'Selecione um membro' : false }}
                  render={({ field }) => (
                    <select
                      {...field}
                      value={field.value || ''}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="" className="bg-slate-800">Selecione um membro</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id} className="bg-slate-800">
                          {member.full_name}
                        </option>
                      ))}
                    </select>
                  )}
                />
              )}
              {errors.memberId && (
                <p className="mt-1 text-sm text-red-400">{errors.memberId.message}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Valor
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              icon={<FaDollarSign />}
              error={errors.amount?.message}
              {...register('amount', { valueAsNumber: true })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Descrição {isOfertas || isDizimos ? '(automática)' : ''}
            </label>
            <textarea
              {...register('description')}
              className={`w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isOfertas || isDizimos ? 'opacity-70 cursor-not-allowed' : ''}`}
              rows={3}
              placeholder="Descrição da receita..."
              readOnly={isOfertas || isDizimos}
            />
            {(isOfertas || isDizimos) && (
              <p className="mt-1 text-xs text-slate-400">
                A descrição é preenchida automaticamente para esta categoria
              </p>
            )}
          </div>

          {/* Método de Pagamento - oculto para Ofertas e Dízimos */}
          {!isDefaultCategory && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Método de Pagamento
              </label>
              <select
                {...register('paymentMethod')}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="cash" className="bg-slate-800">Dinheiro</option>
                <option value="pix" className="bg-slate-800">PIX</option>
                <option value="card" className="bg-slate-800">Cartão</option>
                <option value="transfer" className="bg-slate-800">Transferência</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Data da Transação
            </label>
            <Controller
              name="transactionDate"
              control={control}
              rules={{ required: 'Data da transação é obrigatória' }}
              render={({ field }) => (
                <DateInput
                  icon={<FaCalendar />}
                  error={errors.transactionDate?.message}
                  value={typeof field.value === 'string' ? field.value : (field.value ? field.value.toISOString().split('T')[0] : '')}
                  onChange={(value) => {
                    field.onChange(value)
                  }}
                />
              )}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (mode === 'edit' ? 'Atualizando...' : 'Salvando...') : (mode === 'edit' ? 'Atualizar Receita' : 'Salvar Receita')}
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
