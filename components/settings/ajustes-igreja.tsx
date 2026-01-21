'use client'

import { ChurchForm } from './church-form'

interface AjustesIgrejaProps {
  initialData: {
    name: string
    logo_url?: string | null
  }
}

export function AjustesIgreja({ initialData }: AjustesIgrejaProps) {
  return (
    <div>
      <ChurchForm initialData={initialData} />
    </div>
  )
}

