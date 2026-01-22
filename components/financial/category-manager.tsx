'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa'
import { createRevenueCategory, createExpenseCategory, updateRevenueCategory, updateExpenseCategory, deleteRevenueCategory, deleteExpenseCategory } from '@/app/actions/financial'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface Category {
  id: string
  name: string
  description?: string | null
  color: string
}

interface CategoryManagerProps {
  type: 'revenue' | 'expense'
  categories: Category[]
  title: string
}

export function CategoryManager({ type, categories, title }: CategoryManagerProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#6366f1' })
  const [editCategory, setEditCategory] = useState({ name: '', description: '', color: '#6366f1' })
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleCreate() {
    if (!newCategory.name.trim()) {
      alert('Nome da categoria é obrigatório')
      return
    }

    setIsLoading(true)
    try {
      if (type === 'revenue') {
        await createRevenueCategory(newCategory)
      } else {
        await createExpenseCategory(newCategory)
      }
      setNewCategory({ name: '', description: '', color: '#6366f1' })
      setIsCreating(false)
      router.refresh()
    } catch (error) {
      alert('Erro ao criar categoria')
    } finally {
      setIsLoading(false)
    }
  }

  function handleEditClick(category: Category) {
    setEditingId(category.id)
    setEditCategory({
      name: category.name,
      description: category.description || '',
      color: category.color,
    })
  }

  async function handleUpdate() {
    if (!editCategory.name.trim()) {
      alert('Nome da categoria é obrigatório')
      return
    }

    if (!editingId) return

    setIsLoading(true)
    try {
      if (type === 'revenue') {
        await updateRevenueCategory(editingId, editCategory)
      } else {
        await updateExpenseCategory(editingId, editCategory)
      }
      setEditingId(null)
      setEditCategory({ name: '', description: '', color: '#6366f1' })
      router.refresh()
    } catch (error) {
      alert('Erro ao atualizar categoria')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return
    }

    setDeletingId(id)
    try {
      if (type === 'revenue') {
        await deleteRevenueCategory(id)
      } else {
        await deleteExpenseCategory(id)
      }
      router.refresh()
    } catch (error) {
      alert('Erro ao excluir categoria')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-white">{title}</h3>
          {!isCreating && (
            <Button
              size="sm"
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2"
            >
              <FaPlus />
              Nova
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isCreating && (
          <div className="mb-6 p-4 bg-slate-600 rounded-xl space-y-4">
            <Input
              placeholder="Nome da categoria"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            />
            <textarea
              placeholder="Descrição (opcional)"
              className="w-full px-4 py-3 border border-slate-500 bg-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              rows={2}
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
            />
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-slate-200">Cor:</label>
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="w-16 h-10 rounded border border-slate-500"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={isLoading} size="sm">
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCreating(false)
                  setNewCategory({ name: '', description: '', color: '#6366f1' })
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {categories.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">
              Nenhuma categoria cadastrada
            </p>
          ) : (
            categories.map((category) => {
              const isEditing = editingId === category.id

              return (
                <div key={category.id}>
                  {isEditing ? (
                    <div className="mb-2 p-4 bg-indigo-900/30 border border-indigo-700 rounded-xl space-y-4">
                      <Input
                        placeholder="Nome da categoria"
                        value={editCategory.name}
                        onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                      />
                      <textarea
                        placeholder="Descrição (opcional)"
                        className="w-full px-4 py-3 border border-slate-500 bg-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                        rows={2}
                        value={editCategory.description}
                        onChange={(e) => setEditCategory({ ...editCategory, description: e.target.value })}
                      />
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-semibold text-slate-200">Cor:</label>
                        <input
                          type="color"
                          value={editCategory.color}
                          onChange={(e) => setEditCategory({ ...editCategory, color: e.target.value })}
                          className="w-16 h-10 rounded border border-slate-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleUpdate} disabled={isLoading} size="sm">
                          {isLoading ? 'Salvando...' : 'Salvar'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingId(null)
                            setEditCategory({ name: '', description: '', color: '#6366f1' })
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <p className="font-medium text-white">{category.name}</p>
                          {category.description && (
                            <p className="text-sm text-slate-300">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(category)}
                          className="text-indigo-600 hover:text-indigo-700"
                          title="Editar categoria"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          disabled={deletingId === category.id}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50"
                          title="Excluir categoria"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}

