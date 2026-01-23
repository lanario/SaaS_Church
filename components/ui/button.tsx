import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'font-bold rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 active:scale-95',
          {
            'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105': variant === 'primary',
            'bg-slate-900 text-white hover:bg-slate-800 hover:scale-105': variant === 'secondary',
            'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:scale-105': variant === 'outline',
            'px-4 py-2 text-sm': size === 'sm',
            'px-6 py-3 text-base': size === 'md',
            'px-10 py-4 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }

