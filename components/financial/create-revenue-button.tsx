'use client'

import Link from 'next/link'
import { FaPlus } from 'react-icons/fa'
import { Button } from '@/components/ui/button'

interface CreateRevenueButtonProps {
  categories: Array<{ id: string; name: string }>
}

export function CreateRevenueButton({ categories }: CreateRevenueButtonProps) {
  if (categories.length === 0) {
    return (
      <div className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
        Crie uma categoria primeiro
      </div>
    )
  }

  return (
    <Link href="/receitas/nova">
      <Button className="flex items-center gap-2">
        <FaPlus />
        Nova Receita
      </Button>
    </Link>
  )
}

