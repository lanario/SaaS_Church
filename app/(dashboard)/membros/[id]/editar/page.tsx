import { getMember } from '@/app/actions/members'
import { notFound } from 'next/navigation'
import { MemberForm } from '@/components/members/member-form'

/**
 * Subtrai 1 dia de uma data no formato YYYY-MM-DD
 * Usado para compensar o +1 dia que foi adicionado ao salvar
 */
function subtractOneDay(dateStr: string | null | undefined): string {
  if (!dateStr || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr || ''
  }
  
  const [year, month, day] = dateStr.split('-').map(Number)
  
  // Array com dias em cada mês
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  
  // Verificar se é ano bissexto
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
  if (isLeapYear) {
    daysInMonth[1] = 29
  }
  
  let newDay = day - 1
  let newMonth = month
  let newYear = year
  
  // Se o dia é menor que 1, voltar para o mês anterior
  if (newDay < 1) {
    newMonth = month - 1
    if (newMonth < 1) {
      newMonth = 12
      newYear = year - 1
    }
    newDay = daysInMonth[newMonth - 1]
  }
  
  return `${newYear}-${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`
}

export default async function EditarMembroPage({
  params,
}: {
  params: { id: string }
}) {
  const result = await getMember(params.id)

  if (result.error || !result.data) {
    notFound()
  }

  // Type assertion: sabemos que result.data não é null após a verificação
  const member = result.data as unknown as {
    id: string
    full_name: string
    email: string | null
    phone: string | null
    birth_date: string | null
    member_since: string | null
    status: string
    notes: string | null
    zip_code?: string
    street?: string
    address_number?: string
    address_complement?: string
    neighborhood?: string
    city?: string
    state?: string
  }

  // Subtrair 1 dia das datas ao carregar (para compensar o +1 dia adicionado ao salvar)
  const birthDate = member.birth_date ? subtractOneDay(member.birth_date) : ''
  const memberSince = member.member_since ? subtractOneDay(member.member_since) : ''

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Editar Membro</h1>
        <MemberForm
          member={{
            id: member.id,
            fullName: member.full_name,
            email: member.email || '',
            phone: member.phone || '',
            birthDate: birthDate,
            memberSince: memberSince,
            status: member.status as 'active' | 'inactive' | 'visitor',
            notes: member.notes || '',
            zipCode: (member as any).zip_code || '',
            street: (member as any).street || '',
            addressNumber: (member as any).address_number || '',
            addressComplement: (member as any).address_complement || '',
            neighborhood: (member as any).neighborhood || '',
            city: (member as any).city || '',
            state: (member as any).state || '',
          }}
          mode="edit"
        />
      </div>
    </div>
  )
}

