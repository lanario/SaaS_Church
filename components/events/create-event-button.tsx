'use client'

import Link from 'next/link'
import { FaPlus } from 'react-icons/fa'
import { Button } from '@/components/ui/button'

export function CreateEventButton() {
  return (
    <Link href="/eventos/novo">
      <Button className="flex items-center gap-2">
        <FaPlus />
        Novo Evento
      </Button>
    </Link>
  )
}

