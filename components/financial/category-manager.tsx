'use client'

import { useState } from 'react'
import { FaPlus, FaTrash } from 'react-icons/fa'
import { createRevenueCategory, createExpenseCategory, deleteRevenueCategory, deleteExpenseCategory } from '@/app/actions/financial'
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
  const [isCreating, setIsCreating] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#6366f1' })
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
      window.location.reload()
    } catch (error) {
      alert('Erro ao criar categoria')
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
      window.location.reload()
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
          <h3 className="font-bold text-gray-800">{title}</h3>
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
          <div className="mb-6 p-4 bg-slate-50 rounded-xl space-y-4">
            <Input
              placeholder="Nome da categoria"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            />
            <textarea
              placeholder="Descrição (opcional)"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
            />
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-slate-700">Cor:</label>
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="w-16 h-10 rounded border border-slate-200"
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
            <p className="text-gray-500 text-sm text-center py-4">
              Nenhuma categoria cadastrada
            </p>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <p className="font-medium text-gray-800">{category.name}</p>
                    {category.description && (
                      <p className="text-sm text-gray-500">{category.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(category.id)}
                  disabled={deletingId === category.id}
                  className="text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  <FaTrash />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

