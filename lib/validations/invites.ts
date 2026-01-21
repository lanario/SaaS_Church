import { z } from 'zod'

/**
 * Schema para criar convite
 */
export const createInviteSchema = z.object({
  email: z.string().email('E-mail inválido'),
  expires_in_days: z.number().min(1).max(30).default(7), // Padrão 7 dias
})

export type CreateInviteInput = z.infer<typeof createInviteSchema>

/**
 * Schema para aceitar convite
 */
export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
})

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>

