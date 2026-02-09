import { getMember, getMemberContributions } from '@/app/actions/members'
import { notFound } from 'next/navigation'
import { MemberProfile } from '@/components/members/member-profile'

export default async function MemberDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const result = await getMember(params.id)

  if (result.error || !result.data) {
    notFound()
  }

  const member = result.data as unknown as {
    id: string
    full_name: string
    email: string | null
    phone: string | null
    birth_date: string | null
    member_since: string | null
    status: string
    notes: string | null
    avatar_url: string | null
    zip_code?: string
    street?: string
    address_number?: string
    address_complement?: string
    neighborhood?: string
    city?: string
    state?: string
  }

  const { data: contributions } = await getMemberContributions(params.id)

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <MemberProfile member={member} contributions={contributions || []} />
    </div>
  )
}

