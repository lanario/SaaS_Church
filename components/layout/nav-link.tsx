'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  prefetch?: boolean
  onClick?: () => void
}

export function NavLink({ href, children, className, prefetch = true, onClick }: NavLinkProps) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (href === pathname) {
      e.preventDefault()
      return
    }
    
    // Executar callback de fechamento (mobile) em transição
    startTransition(() => {
      onClick?.()
    })
  }

  return (
    <Link
      href={href}
      prefetch={prefetch}
      onClick={handleClick}
      className={cn(
        className,
        isPending && 'opacity-60'
      )}
      aria-disabled={isPending}
    >
      {children}
    </Link>
  )
}

