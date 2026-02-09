'use server'

import { revalidatePath } from 'next/cache'
import { ensureUserProfile } from '@/lib/utils/ensure-user-profile'

/**
 * Verificar e criar perfil se não existir
 * Usa a função centralizada ensureUserProfile
 */
export async function ensureProfile() {
  const result = await ensureUserProfile()

  if (result.error) {
    return { error: result.error, profile: null }
  }

  // Garantir categorias padrão de receitas se necessário
  if (result.churchId) {
    const { ensureDefaultCategories } = await import('@/app/actions/financial')
    ensureDefaultCategories(result.churchId).catch(console.error)
  }

  revalidatePath('/', 'layout')
  return { error: null, profile: result.profile }
}

