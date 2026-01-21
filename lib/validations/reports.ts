import { z } from 'zod'

export const reportFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(['month', 'quarter', 'year', 'custom']).optional(),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2020).max(2100).optional(),
  quarter: z.number().min(1).max(4).optional(),
  categoryId: z.string().uuid().optional(),
})

export type ReportFilterInput = z.infer<typeof reportFilterSchema>

