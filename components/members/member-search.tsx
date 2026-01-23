'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function MemberSearch() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [status, setStatus] = useState(searchParams.get('status') || '')

    function handleSearch() {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (status) params.set('status', status)
        router.push(`/membros?${params.toString()}`)
    }

    function handleClear() {
        setSearch('')
        setStatus('')
        router.push('/membros')
    }

    return (
        <div className="bg-slate-700 rounded-xl border border-slate-600 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <Input
                        placeholder="Buscar por nome, email ou telefone..."
                        icon={<FaSearch />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <div>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-500 bg-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Todos os status</option>
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                        <option value="visitor">Visitante</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSearch} className="flex-1">
                        Buscar
                    </Button>
                    <Button variant="outline" onClick={handleClear}>
                        Limpar
                    </Button>
                </div>
            </div>
        </div>
    )
}

