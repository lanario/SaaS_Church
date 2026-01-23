'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { revenueSchema, type RevenueInput } from '@/lib/validations/financial'
import { createRevenue } from '@/app/actions/financial'
import { getMembers } from '@/app/actions/members'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FaDollarSign, FaCalendar } from 'react-icons/fa'
import { format } from 'date-fns'

interface RevenueFormProps {
  categories: Array<{ id: string; name: string; color: string }>
}

interface Member {
  id: string
  full_name: string
}

export function RevenueForm({ categories }: RevenueFormProps) {
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
    defaultValues: {
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
      if (selectedCategoryId) {
        const category = categories.find(c => c.id === selectedCategoryId)
        const categoryName = category?.name?.toLowerCase() || ''
        
        if (categoryName === 'dízimos' || categoryName === 'dizimos') {
          setIsLoadingMembers(true)
          const { data } = await getMembers()
          if (data) {
            setMembers(data)
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
  }, [selectedCategoryId, categories])

  // Atualizar descrição automaticamente
  useEffect(() => {
    if (categoryId && transactionDate) {
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
  }, [categoryId, transactionDate, memberId, members, categories, setValue])

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
      const result = await createRevenue(submitData)
      console.log('Create revenue result:', result)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        router.push('/receitas')
        router.refresh()
      } else {
        setError('Erro desconhecido ao salvar receita')
      }
    } catch (err) {
      console.error('Error creating revenue:', err)
      setError(`Erro ao criar receita: ${err instanceof Error ? err.message : 'Tente novamente.'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
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
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Categoria
            </label>
            <select
              {...register('categoryId')}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
            )}
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
            {errors.transactionDate && (
              <p className="mt-1 text-sm text-red-600">{errors.transactionDate.message}</p>
            )}
          </div>

          {/* Campo de Membro - apenas para Dízimos */}
          {isDizimos && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Membro <span className="text-red-500">*</span>
              </label>
              {isLoadingMembers ? (
                <div className="w-full px-4 py-3 border border-slate-200 rounded-xl text-gray-500">
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
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Selecione um membro</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.full_name}
                        </option>
                      ))}
                    </select>
                  )}
                />
              )}
              {errors.memberId && (
                <p className="mt-1 text-sm text-red-600">{errors.memberId.message}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
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
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Descrição {isOfertas || isDizimos ? '(automática)' : ''}
            </label>
            <textarea
              {...register('description')}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Descrição da receita..."
              readOnly={isOfertas || isDizimos}
              style={isOfertas || isDizimos ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
            />
            {(isOfertas || isDizimos) && (
              <p className="mt-1 text-xs text-gray-500">
                A descrição é preenchida automaticamente para esta categoria
              </p>
            )}
          </div>

          {/* Método de Pagamento - oculto para Ofertas e Dízimos */}
          {!isDefaultCategory && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Método de Pagamento
              </label>
              <select
                {...register('paymentMethod')}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="cash">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="card">Cartão</option>
                <option value="transfer">Transferência</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Data da Transação
            </label>
            <Input
              type="date"
              icon={<FaCalendar />}
              error={errors.transactionDate?.message}
              {...register('transactionDate')}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Receita'}
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
