'use client'

import { useState } from 'react'
import { FaUser, FaCamera, FaSpinner } from 'react-icons/fa'
import { updateMemberAvatar } from '@/app/actions/members'
import { createClient } from '@/lib/supabase/client'

interface AvatarUploadProps {
  memberId: string
  currentAvatar?: string | null
}

export function AvatarUpload({ memberId, currentAvatar }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Apenas arquivos de imagem são permitidos')
      return
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Buscar church_id
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('church_id')
        .eq('id', user.id)
        .single()

      if (!profile?.church_id) {
        throw new Error('Igreja não encontrada')
      }

      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${memberId}-${Date.now()}.${fileExt}`
      const filePath = `${profile.church_id}/members/${fileName}`

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error('Erro ao obter URL da imagem')
      }

      // Atualizar avatar no banco
      const result = await updateMemberAvatar(memberId, urlData.publicUrl)

      if (result?.error) {
        throw new Error(result.error)
      }

      // Recarregar página
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative">
      {currentAvatar ? (
        <img
          src={currentAvatar}
          alt="Avatar"
          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
        />
      ) : (
        <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center border-4 border-white shadow-lg">
          <FaUser className="text-indigo-600 text-4xl" />
        </div>
      )}

      <label
        className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg"
        htmlFor={`avatar-upload-${memberId}`}
      >
        {uploading ? (
          <FaSpinner className="text-white animate-spin" />
        ) : (
          <FaCamera className="text-white text-sm" />
        )}
        <input
          id={`avatar-upload-${memberId}`}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
      </label>

      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs max-w-xs">
          {error}
        </div>
      )}
    </div>
  )
}

