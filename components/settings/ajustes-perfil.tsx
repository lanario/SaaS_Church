'use client'

import { ProfileForm } from './profile-form'

interface AjustesPerfilProps {
  initialData: {
    full_name: string
    email: string
    phone?: string | null
    avatar_url?: string | null
  }
}

export function AjustesPerfil({ initialData }: AjustesPerfilProps) {
  return (
    <div>
      <ProfileForm initialData={initialData} />
    </div>
  )
}

