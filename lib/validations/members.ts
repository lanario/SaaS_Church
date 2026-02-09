import { z } from 'zod'

// Validação de CEP (formato: 00000-000 ou 00000000)
const zipCodeRegex = /^\d{5}-?\d{3}$/

export const memberSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  birthDate: z.string().optional().or(z.literal('')),
  memberSince: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'visitor']).default('active'),
  notes: z.string().optional(),
  // Campos de endereço
  zipCode: z.string().regex(zipCodeRegex, 'CEP inválido').optional().or(z.literal('')),
  street: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2, 'Estado deve ter 2 caracteres').optional(),
})

export const createMemberAccountSchema = z.object({
  memberId: z.string().uuid('ID do membro inválido'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
})

export type MemberInput = z.infer<typeof memberSchema>
export type CreateMemberAccountInput = z.infer<typeof createMemberAccountSchema>

