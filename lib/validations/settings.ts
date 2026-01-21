import { z } from 'zod'

/**
 * Schema para atualização de perfil do usuário
 */
export const updateProfileSchema = z.object({
  full_name: z.string().min(3, 'Nome completo deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido').optional().or(z.literal('')),
  avatar_url: z.string().url('URL inválida').optional().or(z.literal('')),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

/**
 * Schema para troca de senha
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

/**
 * Schema para atualização de igreja
 */
export const updateChurchSchema = z.object({
  name: z.string().min(3, 'Nome da igreja deve ter no mínimo 3 caracteres'),
  logo_url: z.string().url('URL inválida').optional().or(z.literal('')),
})

export type UpdateChurchInput = z.infer<typeof updateChurchSchema>

/**
 * Schema para atualização de permissões
 */
export const updatePermissionsSchema = z.object({
  user_id: z.string().uuid('ID de usuário inválido'),
  church_id: z.string().uuid('ID de igreja inválido').optional().or(z.literal('')), // Opcional, será preenchido no server action
  role: z.enum(['owner', 'treasurer', 'marketing', 'member'], {
    errorMap: () => ({ message: 'Role inválido' }),
  }),
  can_manage_finances: z.boolean(),
  can_manage_members: z.boolean(),
  can_manage_events: z.boolean(),
  can_view_reports: z.boolean(),
  can_send_whatsapp: z.boolean(),
})

export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>

