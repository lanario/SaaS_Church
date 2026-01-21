import { z } from 'zod'

export const revenueCategorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal (#RRGGBB)'),
})

export const expenseCategorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal (#RRGGBB)'),
})

export const revenueSchema = z.object({
  categoryId: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().uuid('Categoria inválida').nullable().optional()
  ),
  memberId: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().uuid('Membro inválido').nullable().optional()
  ),
  amount: z.number({ required_error: 'Valor é obrigatório', invalid_type_error: 'Valor deve ser um número' }).positive('Valor deve ser maior que zero'),
  description: z.string().nullable().optional(),
  paymentMethod: z.enum(['cash', 'pix', 'card', 'transfer']).default('cash'),
  transactionDate: z.string().or(z.date()),
})

export const expenseSchema = z.object({
  categoryId: z.string().uuid('Categoria inválida').optional().nullable(),
  amount: z.number().positive('Valor deve ser maior que zero'),
  description: z.string().optional(),
  paymentMethod: z.enum(['cash', 'pix', 'card', 'transfer']).default('cash'),
  transactionDate: z.string().or(z.date()),
  receiptUrl: z.string().url('URL inválida').optional().nullable(),
})

export type RevenueCategoryInput = z.infer<typeof revenueCategorySchema>
export type ExpenseCategoryInput = z.infer<typeof expenseCategorySchema>
export type RevenueInput = z.infer<typeof revenueSchema>
export type ExpenseInput = z.infer<typeof expenseSchema>

