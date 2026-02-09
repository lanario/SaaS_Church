'use server'

import { ensureUserProfile } from './ensure-user-profile'

/**
 * Função utilitária para obter o church_id do usuário autenticado
 * Usa a função centralizada ensureUserProfile para garantir que o perfil existe
 */
export async function getChurchId() {
  const result = await ensureUserProfile()
  
  if (result.error) {
    return { error: result.error, churchId: null }
  }

  if (!result.churchId) {
    return { 
      error: 'Igreja não encontrada no seu perfil. Por favor, entre em contato com o suporte.', 
      churchId: null 
    }
  }

  return { error: null, churchId: result.churchId }
}

