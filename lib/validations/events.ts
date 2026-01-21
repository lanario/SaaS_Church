import { z } from 'zod'

export const eventSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  eventDate: z.string().or(z.date()),
  eventTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido (HH:MM)').optional().or(z.literal('')),
  location: z.string().optional(),
  eventType: z.enum(['worship', 'meeting', 'special', 'other']).default('worship'),
  whatsappMessage: z.string().optional(),
  isPublic: z.boolean().default(true),
})

export const eventAttendanceSchema = z.object({
  eventId: z.string().uuid('ID do evento inválido'),
  memberId: z.string().uuid('ID do membro inválido'),
  status: z.enum(['confirmed', 'pending', 'absent']).default('pending'),
})

export type EventInput = z.infer<typeof eventSchema>
export type EventAttendanceInput = z.infer<typeof eventAttendanceSchema>

