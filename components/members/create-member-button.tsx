'use client'

import Link from 'next/link'
import { FaPlus } from 'react-icons/fa'
import { Button } from '@/components/ui/button'

export function CreateMemberButton() {
  return (
    <Link href="/membros/novo">
      <Button className="flex items-center gap-2">
        <FaPlus />
        Novo Membro
      </Button>
    </Link>
  )
}

