'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { expenseSchema, type ExpenseInput } from '@/lib/validations/financial'
import { createExpense, updateExpense } from '@/app/actions/financial'
import { Input } from '@/components/ui/input'
import { DateInput } from '@/components/ui/date-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FaDollarSign, FaCalendar } from 'react-icons/fa'

interface ExpenseFormProps {
  categories: Array<{ id: string; name: string; color: string }>
  expense?: {
    id: string
    categoryId?: string | null
    amount: number
    description?: string | null
    paymentMethod: string
    transactionDate: string
    receiptUrl?: string | null
  }
  mode?: 'create' | 'edit'
}

/**
 * Formulário para criar ou editar despesas
 */
export function ExpenseForm({ categories, expense, mode = 'create' }: ExpenseFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Normalizar a data para YYYY-MM-DD
  function normalizeDate(dateString: string): string {
    if (!dateString) return ''
    
    // Se já está no formato YYYY-MM-DD, retornar
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString
    }
    
    // Se tem T (ISO format), extrair apenas a parte da data
    if (dateString.includes('T')) {
      return dateString.split('T')[0]
    }
    
    // Se está no formato DD/MM/YYYY, converter para YYYY-MM-DD
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = dateString.split('/')
      return `${year}-${month}-${day}`
    }
    
    return dateString
  }

  // Preparar valores iniciais
  const initialValues: ExpenseInput = expense ? {
    categoryId: expense.categoryId || null,
    amount: expense.amount,
    description: expense.description || undefined,
    paymentMethod: expense.paymentMethod as 'cash' | 'pix' | 'card' | 'transfer',
    transactionDate: normalizeDate(expense.transactionDate),
    receiptUrl: expense.receiptUrl || undefined,
  } : {
    categoryId: null,
    amount: 0,
    description: undefined,
    paymentMethod: 'cash',
    transactionDate: new Date().toISOString().split('T')[0],
    receiptUrl: undefined,
  }

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: initialValues,
  })

  // Resetar formulário quando expense mudar
  useEffect(() => {
    if (expense) {
      reset({
        categoryId: expense.categoryId || null,
        amount: expense.amount,
        description: expense.description || undefined,
        paymentMethod: expense.paymentMethod as 'cash' | 'pix' | 'card' | 'transfer',
        transactionDate: normalizeDate(expense.transactionDate),
        receiptUrl: expense.receiptUrl || undefined,
      })
    }
  }, [expense, reset])

  async function onSubmit(data: ExpenseInput) {
    setIsLoading(true)
    setError(null)

    try {
      // Normalizar a data antes de enviar
      const normalizedData: ExpenseInput = {
        ...data,
        transactionDate: normalizeDate(
          typeof data.transactionDate === 'string' 
            ? data.transactionDate 
            : data.transactionDate.toISOString().split('T')[0]
        ),
      }

      const result = mode === 'edit' && expense
        ? await updateExpense(expense.id, normalizedData)
        : await createExpense(normalizedData)

      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        router.push('/despesas')
        router.refresh()
      } else {
        setError('Erro desconhecido ao salvar despesa')
      }
    } catch (err) {
      console.error('Erro ao salvar despesa:', err)
      setError(mode === 'edit' ? 'Erro ao atualizar despesa. Tente novamente.' : 'Erro ao criar despesa. Tente novamente.')
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          </div>

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
              Descrição
            </label>
            <textarea
              {...register('description')}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Descrição da despesa..."
            />
          </div>

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
              {isLoading ? (mode === 'edit' ? 'Atualizando...' : 'Salvando...') : (mode === 'edit' ? 'Atualizar Despesa' : 'Salvar Despesa')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
