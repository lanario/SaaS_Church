import { getMember } from '@/app/actions/members'
import { notFound } from 'next/navigation'
import { MemberForm } from '@/components/members/member-form'

export default async function EditarMembroPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: member, error } = await getMember(params.id)

  if (error || !member) {
    notFound()
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Editar Membro</h1>
        <MemberForm
          member={{
            id: member.id,
            fullName: member.full_name,
            email: member.email || '',
            phone: member.phone || '',
            birthDate: member.birth_date || '',
            memberSince: member.member_since || '',
            status: member.status as 'active' | 'inactive' | 'visitor',
            notes: member.notes || '',
          }}
          mode="edit"
        />
      </div>
    </div>
  )
}

