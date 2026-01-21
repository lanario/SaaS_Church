import { getMembers } from '@/app/actions/members'
import { MemberList } from '@/components/members/member-list'
import { CreateMemberButton } from '@/components/members/create-member-button'
import { MemberSearch } from '@/components/members/member-search'

interface SearchParams {
  search?: string
  status?: string
}

export default async function MembrosPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { data: members, error } = await getMembers(
    searchParams.search,
    searchParams.status
  )

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
          Erro ao carregar membros: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Membros</h1>
          <p className="text-gray-500 mt-1">Gerencie todos os membros da igreja</p>
        </div>
        <CreateMemberButton />
      </div>

      <MemberSearch />

      <MemberList members={members || []} />
    </div>
  )
}

