'use client'

import { InputHTMLAttributes, forwardRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  icon?: React.ReactNode
  error?: string
  value?: string // YYYY-MM-DD format
  onChange?: (value: string) => void // Recebe YYYY-MM-DD
}

/**
 * Componente de input de data que exibe DD/MM/YYYY mas trabalha internamente com YYYY-MM-DD
 */
const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, icon, error, value, onChange, ...props }, ref) => {
    // Converter YYYY-MM-DD para DD/MM/YYYY para exibição (sem timezone)
    function formatForDisplay(dateString: string | undefined | null): string {
      if (!dateString || dateString === '') return ''
      
      // Se já está no formato DD/MM/YYYY, retornar diretamente
      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return dateString
      }
      
      // Trabalhar diretamente com strings para evitar problemas de timezone
      // Remover parte de tempo se existir (T00:00:00...)
      const dateOnly = dateString.split('T')[0]
      const parts = dateOnly.split('-')
      if (parts.length === 3) {
        const [year, month, day] = parts
        // Validar se são números válidos
        if (year && month && day && 
            year.length === 4 && 
            month.length === 2 && 
            day.length === 2) {
          return `${day}/${month}/${year}`
        }
      }
      
      return ''
    }

    // Converter DD/MM/YYYY para YYYY-MM-DD (sem timezone, SEM usar Date)
    function parseFromDisplay(displayValue: string): string | null {
      if (!displayValue) return null
      
      // Remover caracteres não numéricos exceto barras
      const cleaned = displayValue.replace(/[^\d/]/g, '')
      
      // Extrair dia, mês e ano diretamente da string
      const parts = cleaned.split('/')
      if (parts.length === 3) {
        const [day, month, year] = parts
        
        // Validar formato
        if (day && month && year && 
            day.length === 2 && 
            month.length === 2 && 
            year.length === 4) {
          
          const dayNum = parseInt(day, 10)
          const monthNum = parseInt(month, 10)
          const yearNum = parseInt(year, 10)
          
          // Validar ranges básicos (sem usar Date)
          if (dayNum >= 1 && dayNum <= 31 && 
              monthNum >= 1 && monthNum <= 12 && 
              yearNum >= 1900 && yearNum <= 2100) {
            
            // Validar dias por mês (sem usar Date)
            const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
            const isLeapYear = (yearNum % 4 === 0 && yearNum % 100 !== 0) || (yearNum % 400 === 0)
            const maxDay = monthNum === 2 && isLeapYear ? 29 : daysInMonth[monthNum - 1]
            
            if (dayNum <= maxDay) {
              // Retornar no formato YYYY-MM-DD diretamente (SEM CONVERSÃO)
              return `${year}-${month}-${day}`
            }
          }
        }
      }
      
      return null
    }

    const [displayValue, setDisplayValue] = useState(formatForDisplay(value))

    // Atualizar display quando value mudar externamente
    useEffect(() => {
      setDisplayValue(formatForDisplay(value))
    }, [value])

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      let inputValue = e.target.value
      
      // Aplicar máscara DD/MM/YYYY
      // Remover tudo que não é número
      let numbers = inputValue.replace(/\D/g, '')
      
      // Limitar a 8 dígitos
      if (numbers.length > 8) {
        numbers = numbers.slice(0, 8)
      }
      
      // Formatar com barras
      let formatted = numbers
      if (numbers.length > 2) {
        formatted = numbers.slice(0, 2) + '/' + numbers.slice(2)
      }
      if (numbers.length > 4) {
        formatted = numbers.slice(0, 2) + '/' + numbers.slice(2, 4) + '/' + numbers.slice(4)
      }
      
      setDisplayValue(formatted)
      
      // Se tiver 10 caracteres (DD/MM/YYYY completo), converter e chamar onChange
      if (formatted.length === 10) {
        const isoDate = parseFromDisplay(formatted)
        if (isoDate && onChange) {
          onChange(isoDate)
        } else if (onChange) {
          // Se não conseguir parsear, ainda chamar onChange com string vazia para limpar
          onChange('')
        }
      } else if (formatted.length === 0 && onChange) {
        // Se estiver vazio, chamar onChange com string vazia
        onChange('')
      }
    }

    function handleBlur(_e: React.FocusEvent<HTMLInputElement>) {
      // Validar e corrigir data ao sair do campo
      if (displayValue && displayValue.length === 10) {
        const isoDate = parseFromDisplay(displayValue)
        if (isoDate && onChange) {
          onChange(isoDate)
          setDisplayValue(formatForDisplay(isoDate))
        } else {
          // Se inválida, limpar
          setDisplayValue('')
          if (onChange) {
            onChange('')
          }
        }
      }
    }

    return (
      <div className="w-full">
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}
          <input
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/AAAA"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              'w-full border rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-700 text-white placeholder:text-slate-400',
              icon ? 'pl-12 pr-4' : 'px-4',
              'py-3',
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-slate-500',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>
    )
  }
)
DateInput.displayName = 'DateInput'

export { DateInput }
