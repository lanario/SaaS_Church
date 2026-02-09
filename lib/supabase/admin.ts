/**
 * Cliente Supabase Admin (Service Role)
 * Usado apenas para operações administrativas como migrações
 * NUNCA exponha este cliente no cliente (browser)
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let adminClientInstance: SupabaseClient | null = null

/**
 * Obtém o cliente admin de forma lazy
 * Só cria o cliente quando realmente necessário (runtime)
 * Isso evita erros durante o build time
 */
function getAdminClient(): SupabaseClient {
  if (adminClientInstance) {
    return adminClientInstance
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não está definido')
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não está definido. Adicione no .env.local')
  }

  adminClientInstance = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  return adminClientInstance
}

/**
 * Exporta o cliente admin
 * A criação é lazy - só acontece quando o cliente é usado
 * Usa Proxy para interceptar todas as propriedades e métodos
 */
export const adminClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getAdminClient()
    const value = (client as any)[prop]
    
    // Se for uma função, bind ao cliente
    if (typeof value === 'function') {
      return value.bind(client)
    }
    
    return value
  },
}) as unknown as SupabaseClient
