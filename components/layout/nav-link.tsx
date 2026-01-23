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
}

export function NavLink({ href, children, className, prefetch = true }: NavLinkProps) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (href === pathname) {
      e.preventDefault()
      return
    }
    startTransition(() => {
      // Navegação será feita pelo Link
    })
  }

  return (
    <Link
      href={href}
      prefetch={prefetch}
      onClick={handleClick}
      className={cn(
        className,
        isPending && 'opacity-70 pointer-events-none'
      )}
    >
      {children}
    </Link>
  )
}

