/**
 * Schemas de Validação Zod
 * Exemplos para referência durante o desenvolvimento
 */

import { z } from 'zod';

// ============================================
// AUTENTICAÇÃO
// ============================================

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  churchName: z.string().min(3, 'Nome da igreja deve ter no mínimo 3 caracteres'),
  fullName: z.string().min(3, 'Nome completo deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone inválido'),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'Você deve aceitar os termos de uso',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

// ============================================
// MEMBROS
// ============================================

export const memberSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone inválido').optional().or(z.literal('')),
  birthDate: z.date().optional(),
  memberSince: z.date().optional(),
  status: z.enum(['active', 'inactive', 'visitor']).default('active'),
  notes: z.string().optional(),
});

export const createMemberAccountSchema = z.object({
  memberId: z.string().uuid('ID do membro inválido'),
  email: z.string().email('E-mail inválido'),
  temporaryPassword: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

// ============================================
// FINANCEIRO - RECEITAS
// ============================================

export const revenueCategorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal (#RRGGBB)'),
});

export const revenueSchema = z.object({
  categoryId: z.string().uuid('Categoria inválida').optional(),
  memberId: z.string().uuid('Membro inválido').optional().nullable(),
  amount: z.number().positive('Valor deve ser maior que zero'),
  description: z.string().optional(),
  paymentMethod: z.enum(['cash', 'pix', 'card', 'transfer']).default('cash'),
  transactionDate: z.date(),
});

// ============================================
// FINANCEIRO - DESPESAS
// ============================================

export const expenseCategorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal (#RRGGBB)'),
});

export const expenseSchema = z.object({
  categoryId: z.string().uuid('Categoria inválida').optional(),
  amount: z.number().positive('Valor deve ser maior que zero'),
  description: z.string().optional(),
  paymentMethod: z.enum(['cash', 'pix', 'card', 'transfer']).default('cash'),
  transactionDate: z.date(),
  receiptUrl: z.string().url('URL inválida').optional(),
});

// ============================================
// EVENTOS
// ============================================

export const eventSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  eventDate: z.date(),
  eventTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido (HH:MM)').optional(),
  location: z.string().optional(),
  eventType: z.enum(['worship', 'meeting', 'special', 'other']).default('worship'),
  whatsappMessage: z.string().optional(),
  isPublic: z.boolean().default(true),
});

export const eventAttendanceSchema = z.object({
  eventId: z.string().uuid('ID do evento inválido'),
  memberId: z.string().uuid('ID do membro inválido'),
  status: z.enum(['confirmed', 'pending', 'absent']).default('pending'),
});

// ============================================
// PERMISSÕES
// ============================================

export const userPermissionSchema = z.object({
  userId: z.string().uuid('ID do usuário inválido'),
  churchId: z.string().uuid('ID da igreja inválido'),
  canManageFinances: z.boolean().default(false),
  canManageMembers: z.boolean().default(false),
  canManageEvents: z.boolean().default(false),
  canViewReports: z.boolean().default(false),
  canSendWhatsapp: z.boolean().default(false),
});

// ============================================
// CONFIGURAÇÕES
// ============================================

export const churchSettingsSchema = z.object({
  name: z.string().min(3, 'Nome da igreja deve ter no mínimo 3 caracteres'),
  logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

export const userProfileSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone inválido').optional().or(z.literal('')),
  avatarUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

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
});

// ============================================
// RELATÓRIOS
// ============================================

export const reportFilterSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  categoryId: z.string().uuid().optional(),
  memberId: z.string().uuid().optional(),
  reportType: z.enum(['monthly', 'annual', 'custom']).default('monthly'),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'Data final deve ser maior ou igual à data inicial',
  path: ['endDate'],
});

// ============================================
// WHATSAPP
// ============================================

export const whatsappMessageSchema = z.object({
  eventId: z.string().uuid('ID do evento inválido'),
  memberIds: z.array(z.string().uuid('ID do membro inválido')).min(1, 'Selecione pelo menos um membro'),
  message: z.string().min(10, 'Mensagem deve ter no mínimo 10 caracteres'),
  sendAt: z.date().optional(), // Para agendamento
});

// ============================================
// TIPOS INFERIDOS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type MemberInput = z.infer<typeof memberSchema>;
export type RevenueInput = z.infer<typeof revenueSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type UserPermissionInput = z.infer<typeof userPermissionSchema>;
export type ReportFilterInput = z.infer<typeof reportFilterSchema>;
export type WhatsAppMessageInput = z.infer<typeof whatsappMessageSchema>;

