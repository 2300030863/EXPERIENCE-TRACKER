import { useState, useEffect } from 'react'
import { categoryAPI } from '../services/api'
import { Plus, Edit, Trash2, Tag, Users, Shield, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

function Categories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#2563eb'
  })

  const predefinedColors = [
    '#2563eb', '#059669', '#d97706', '#dc2626', 
    '#7c3aed', '#db2777', '#0891b2', '#65a30d',
    '#ea580c', '#4f46e5', '#0d9488', '#e11d48'
  ]

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await categoryAPI.getAll()
      setCategories(response.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await categoryAPI.update(editingCategory.id, formData)
        toast.success('Category updated successfully')
      } else {
        await categoryAPI.create(formData)
        toast.success('Category created successfully')
      }

      setShowModal(false)
      setEditingCategory(null)
      resetForm()
      fetchCategories()
    } catch (error) {
      toast.error('Failed to save category')
    }
  }

  const handleEdit = (category) => {
    if (category.isDefault) {
      toast.error('Cannot edit default categories')
      return
    }
    
    if (category.isOccupationGenerated) {
      toast.error('Cannot edit occupation-generated categories. You can delete and create a custom one instead.')
      return
    }
    
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#2563eb'
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    const category = categories.find(c => c.id === id)
    if (category?.isDefault) {
      toast.error('Cannot delete default categories')
      return
    }

    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoryAPI.delete(id)
        toast.success('Category deleted successfully')
        fetchCategories()
      } catch (error) {
        toast.error('Failed to delete category')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#2563eb'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent"></div>
      </div>
    )
  }

  const occupationCategories = categories.filter(c => c.isOccupationGenerated)
  const defaultCategories = categories.filter(c => c.isDefault)
  const customCategories = categories.filter(c => !c.isDefault && !c.isOccupationGenerated)

  const displayedCategories = 
    activeTab === 'occupation' ? occupationCategories :
    activeTab === 'custom' ? customCategories :
    activeTab === 'default' ? defaultCategories :
    categories

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Expense Categories</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Organize transactions with personalized occupation buckets and custom color tags.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingCategory(null)
            setShowModal(true)
          }}
          className="btn-primary w-full sm:w-auto"
        >
          <Plus size={16} className="mr-1.5" />
          Add Category
        </button>
      </div>

      {/* Tabs / Filter bar */}
      <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/90 rounded-lg max-w-fit shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'custom'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Custom ({customCategories.length})
        </button>
        <button
          onClick={() => setActiveTab('occupation')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'occupation'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Occupation ({occupationCategories.length})
        </button>
        <button
          onClick={() => setActiveTab('default')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'default'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Default ({defaultCategories.length})
        </button>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayedCategories.map((category) => {
          const isOccupation = category.isOccupationGenerated
          const isDefault = category.isDefault
          const isCustom = !isDefault && !isOccupation

          return (
            <div key={category.id} className="card hover:border-slate-300 transition-colors flex items-center justify-between p-4">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white shadow-xs"
                  style={{ backgroundColor: category.color || '#2563eb' }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 text-sm truncate">
                      {category.name}
                    </h3>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {isOccupation ? 'Occupation' : isDefault ? 'Default' : 'Custom'}
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>

              {!isDefault && (
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {!isOccupation && (
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      title="Edit category"
                    >
                      <Edit size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-5 sm:p-6 w-full max-w-md shadow-xl rounded-xl bg-white border border-slate-200 animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Health Insurance, Freelance Tools"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Optional brief description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Category Color
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className="h-8 rounded-lg transition-transform active:scale-95 flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: color }}
                    >
                      {formData.color === color && (
                        <Check size={16} className="text-white drop-shadow-xs" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Categories
