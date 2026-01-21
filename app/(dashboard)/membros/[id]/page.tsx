import { getMember, getMemberContributions } from '@/app/actions/members'
import { notFound } from 'next/navigation'
import { MemberProfile } from '@/components/members/member-profile'

export default async function MemberDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: member, error } = await getMember(params.id)

  if (error || !member) {
    notFound()
  }

  const { data: contributions } = await getMemberContributions(params.id)

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <MemberProfile member={member} contributions={contributions || []} />
    </div>
  )
}

