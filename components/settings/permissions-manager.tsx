'use client'

import { useState, useEffect } from 'react'
import { getChurchUsers, updateUserPermissions } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FaUsers, FaCheck, FaTimes, FaEdit, FaSave, FaTimesCircle } from 'react-icons/fa'

interface UserWithPermissions {
  id: string
  full_name: string
  email: string
  phone?: string | null
  role: 'owner' | 'collaborator' | 'treasurer' | 'marketing' | 'member'
  avatar_url?: string | null
  created_at: string
  permissions: {
    can_manage_finances: boolean
    can_manage_members: boolean
    can_manage_events: boolean
    can_view_reports: boolean
    can_send_whatsapp: boolean
  }
}

export function PermissionsManager() {
  const [users, setUsers] = useState<UserWithPermissions[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingPermissions, setEditingPermissions] = useState<UserWithPermissions['permissions'] | null>(null)
  const [editingRole, setEditingRole] = useState<'owner' | 'collaborator' | 'treasurer' | 'marketing' | 'member' | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    setMessage(null)
    const result = await getChurchUsers()
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      setUsers([])
    } else if (result.users) {
      setUsers(result.users)
      if (result.users.length === 0) {
        setMessage({ type: 'error', text: 'Nenhum usuário encontrado na igreja' })
      }
    } else {
      setUsers([])
      setMessage({ type: 'error', text: 'Erro desconhecido ao carregar usuários' })
    }
    
    setLoading(false)
  }

  function startEdit(user: UserWithPermissions) {
    setEditingUserId(user.id)
    setEditingPermissions({ ...user.permissions })
    setEditingRole(user.role)
    setMessage(null)
  }

  function cancelEdit() {
    setEditingUserId(null)
    setEditingPermissions(null)
    setEditingRole(null)
  }

  async function savePermissions(user: UserWithPermissions) {
    if (!editingPermissions || !editingRole) return

    setIsSubmitting(true)
    setMessage(null)

    // O server action vai buscar o church_id automaticamente
    const result = await updateUserPermissions({
      user_id: user.id,
      church_id: '', // Será preenchido automaticamente no server action
      role: editingRole,
      ...editingPermissions,
    })

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Permissões atualizadas com sucesso!' })
      await loadUsers()
      cancelEdit()
    }

    setIsSubmitting(false)
  }

  if (loading) {
    return (
      <Card className="p-6 bg-slate-700 border border-slate-600">
        <div className="text-center py-8">
          <p className="text-white">Carregando usuários...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-slate-700 border border-slate-600">
      <div className="flex items-center gap-3 mb-6">
        <FaUsers className="w-6 h-6 text-indigo-400" />
        <h2 className="text-xl font-bold text-white">Gerenciar Usuários e Permissões</h2>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-900/30 text-green-300 border border-green-500/30'
              : 'bg-red-900/30 text-red-300 border border-red-500/30'
          }`}
        >
          {message.type === 'success' ? (
            <FaCheck className="w-5 h-5" />
          ) : (
            <FaTimes className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {users.length === 0 ? (
        <div className="text-center py-8 border border-slate-600 rounded-lg bg-slate-800/50">
          <p className="text-white mb-2">Nenhum usuário encontrado</p>
          <p className="text-sm text-slate-400 mb-4">
            Certifique-se de que os usuários têm perfis criados na mesma igreja.
          </p>
          <Button
            onClick={loadUsers}
            variant="outline"
          >
            Recarregar
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-slate-400">
            Total: {users.length} {users.length === 1 ? 'usuário' : 'usuários'}
          </div>
          <div className="space-y-4">
          {users.map((user) => {
            const isEditing = editingUserId === user.id
            const permissions = isEditing ? editingPermissions! : user.permissions
            const role = isEditing ? editingRole! : user.role

            return (
              <div
                key={user.id}
                className="border border-slate-600 rounded-lg p-4 space-y-3 bg-slate-800/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{user.full_name}</h3>
                    <p className="text-sm text-slate-300">{user.email}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Role: <span className="font-medium text-white">{role}</span>
                    </p>
                  </div>
                  {!isEditing && (
                    <Button
                      onClick={() => startEdit(user)}
                      variant="outline"
                      size="sm"
                    >
                      <FaEdit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  )}
                  {isEditing && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => savePermissions(user)}
                        disabled={isSubmitting}
                        size="sm"
                      >
                        <FaSave className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                      <Button
                        onClick={cancelEdit}
                        variant="outline"
                        size="sm"
                        disabled={isSubmitting}
                      >
                        <FaTimesCircle className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="mt-3 space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">
                        Role
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setEditingRole(e.target.value as typeof role)}
                        className="w-full px-3 py-2 border border-slate-500 bg-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="owner" className="bg-slate-700 text-white">Proprietário</option>
                        <option value="collaborator" className="bg-slate-700 text-white">Colaborador</option>
                        <option value="treasurer" className="bg-slate-700 text-white">Tesoureiro</option>
                        <option value="marketing" className="bg-slate-700 text-white">Marketing</option>
                        <option value="member" className="bg-slate-700 text-white">Membro</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-slate-600">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.can_manage_finances}
                      onChange={(e) => {
                        if (isEditing && editingPermissions) {
                          setEditingPermissions({
                            ...editingPermissions,
                            can_manage_finances: e.target.checked,
                          })
                        }
                      }}
                      disabled={!isEditing}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-white">Gerenciar Finanças</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.can_manage_members}
                      onChange={(e) => {
                        if (isEditing && editingPermissions) {
                          setEditingPermissions({
                            ...editingPermissions,
                            can_manage_members: e.target.checked,
                          })
                        }
                      }}
                      disabled={!isEditing}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-white">Gerenciar Membros</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.can_manage_events}
                      onChange={(e) => {
                        if (isEditing && editingPermissions) {
                          setEditingPermissions({
                            ...editingPermissions,
                            can_manage_events: e.target.checked,
                          })
                        }
                      }}
                      disabled={!isEditing}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-white">Gerenciar Eventos</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.can_view_reports}
                      onChange={(e) => {
                        if (isEditing && editingPermissions) {
                          setEditingPermissions({
                            ...editingPermissions,
                            can_view_reports: e.target.checked,
                          })
                        }
                      }}
                      disabled={!isEditing}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-white">Ver Relatórios</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.can_send_whatsapp}
                      onChange={(e) => {
                        if (isEditing && editingPermissions) {
                          setEditingPermissions({
                            ...editingPermissions,
                            can_send_whatsapp: e.target.checked,
                          })
                        }
                      }}
                      disabled={!isEditing}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-white">Enviar WhatsApp</span>
                  </label>
                </div>
              </div>
            )
          })}
          </div>
        </>
      )}
    </Card>
  )
}

