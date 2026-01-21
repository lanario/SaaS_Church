import { z } from 'zod'

export const memberSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  birthDate: z.string().optional().or(z.literal('')),
  memberSince: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'visitor']).default('active'),
  notes: z.string().optional(),
})

export const createMemberAccountSchema = z.object({
  memberId: z.string().uuid('ID do membro inválido'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
})

export type MemberInput = z.infer<typeof memberSchema>
export type CreateMemberAccountInput = z.infer<typeof createMemberAccountSchema>

