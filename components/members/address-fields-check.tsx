'use client'

import { useEffect, useState } from 'react'
import { checkMembersAddressFields } from '@/app/actions/migrations'
import { FaExclamationTriangle } from 'react-icons/fa'

/**
 * Componente que verifica se os campos de endereço existem no banco
 * e mostra uma mensagem informativa se necessário
 */
export function AddressFieldsCheck() {
  const [checking, setChecking] = useState(true)
  const [fieldsExist, setFieldsExist] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkFields() {
      try {
        const result = await checkMembersAddressFields()
        setFieldsExist(result.exists)
      } catch (error) {
        setFieldsExist(false)
      } finally {
        setChecking(false)
      }
    }

    checkFields()
  }, [])

  if (checking) {
    return null // Não mostra nada enquanto verifica
  }

  if (fieldsExist) {
    return null // Campos existem, não precisa mostrar nada
  }

  // Campos não existem, mostrar aviso
  return (
    <div className="mb-6 p-4 bg-amber-900/30 border border-amber-700 rounded-xl">
      <div className="flex items-start gap-3">
        <FaExclamationTriangle className="text-amber-400 text-xl mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-amber-300 mb-1">
            ⚠️ Campos de Endereço Não Configurados
          </h4>
          <p className="text-sm text-amber-200 mb-3">
            Os campos de endereço ainda não foram criados no banco de dados. Você pode continuar usando o sistema normalmente, mas a funcionalidade de endereço não estará disponível até executar a migração.
          </p>
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-300 mb-2 font-semibold">
              Para habilitar os campos de endereço:
            </p>
            <ol className="text-xs text-slate-200 space-y-1 list-decimal list-inside mb-2">
              <li>Abra o Supabase Dashboard</li>
              <li>Vá em SQL Editor</li>
              <li>Execute o arquivo: <code className="bg-slate-900 px-1 rounded">supabase/MIGRATION_ADDRESS_FIELDS.sql</code></li>
            </ol>
            <p className="text-xs text-slate-400 mt-2">
              Ou execute o arquivo completo: <code className="bg-slate-900 px-1 rounded">supabase/TOTAL_SQL.sql</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
