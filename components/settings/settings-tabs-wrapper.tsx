'use client'

import { SettingsTabs } from './settings-tabs'
import { AjustesPerfil } from './ajustes-perfil'
import { AjustesIgreja } from './ajustes-igreja'
import { AjustesUsuarios } from './ajustes-usuarios'
import { FaUser, FaChurch, FaUsers } from 'react-icons/fa'

interface SettingsTabsWrapperProps {
  isOwner: boolean
  profileData: {
    full_name: string
    email: string
    phone?: string | null
    avatar_url?: string | null
  }
  churchData: {
    name: string
    logo_url?: string | null
  }
}

export function SettingsTabsWrapper({ isOwner, profileData, churchData }: SettingsTabsWrapperProps) {
  // Definir abas disponíveis (agora no cliente)
  const tabs = [
    { id: 'perfil', label: 'Meu Perfil', icon: FaUser },
    ...(isOwner ? [
      { id: 'igreja', label: 'Igreja', icon: FaChurch },
      { id: 'usuarios', label: 'Usuários e Permissões', icon: FaUsers },
    ] : []),
  ]

  return (
    <SettingsTabs tabs={tabs} defaultTab="perfil">
      {(activeTab) => {
        if (activeTab === 'perfil') {
          return <AjustesPerfil initialData={profileData} />
        }

        if (activeTab === 'igreja' && isOwner) {
          return <AjustesIgreja initialData={churchData} />
        }

        if (activeTab === 'usuarios' && isOwner) {
          return <AjustesUsuarios />
        }

        return null
      }}
    </SettingsTabs>
  )
}

