import { MemberForm } from '@/components/members/member-form'

export default function NovoMembroPage() {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Novo Membro</h1>
        <MemberForm />
      </div>
    </div>
  )
}

