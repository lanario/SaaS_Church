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
  role: 'owner' | 'treasurer' | 'marketing' | 'member'
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
  const [editingRole, setEditingRole] = useState<'owner' | 'treasurer' | 'marketing' | 'member' | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    const result = await getChurchUsers()
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else if (result.users) {
      setUsers(result.users)
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
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">Carregando usuários...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FaUsers className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">Gerenciar Usuários e Permissões</h2>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
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
        <div className="text-center py-8">
          <p className="text-gray-600">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => {
            const isEditing = editingUserId === user.id
            const permissions = isEditing ? editingPermissions! : user.permissions
            const role = isEditing ? editingRole! : user.role

            return (
              <div
                key={user.id}
                className="border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Role: <span className="font-medium">{role}</span>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setEditingRole(e.target.value as typeof role)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="owner">Proprietário</option>
                        <option value="treasurer">Tesoureiro</option>
                        <option value="marketing">Marketing</option>
                        <option value="member">Membro</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-gray-200">
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
                    <span className="text-sm text-gray-700">Gerenciar Finanças</span>
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
                    <span className="text-sm text-gray-700">Gerenciar Membros</span>
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
                    <span className="text-sm text-gray-700">Gerenciar Eventos</span>
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
                    <span className="text-sm text-gray-700">Ver Relatórios</span>
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
                    <span className="text-sm text-gray-700">Enviar WhatsApp</span>
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

