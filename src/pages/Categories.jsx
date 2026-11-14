import { useState, useEffect } from 'react'
import { categoryAPI } from '../services/api'
import { Plus, Edit, Trash2, Tag, Users, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

function Categories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#0624e4ff'
  })
  
  // Categorize categories for display - Show ALL categories
  const allUserCategories = categories.filter(c => c.user?.id === user?.id || c.isDefault)
  const myCategories = categories.filter(c => c.user?.id === user?.id && !c.isDefault && !c.isOccupationGenerated)
  const occupationCategories = categories.filter(c => c.isOccupationGenerated && c.user?.id === user?.id)
  const defaultCategories = categories.filter(c => c.isDefault)
  const groupSharedCategories = categories.filter(c => c.user?.id !== user?.id && !c.isDefault && !c.isOccupationGenerated)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll()
      console.log('=== CATEGORIES DEBUG ===')
      console.log('Total categories received:', response.data.length)
      console.log('All categories:', response.data)
      
      // Check each category's properties
      response.data.forEach((cat, index) => {
        console.log(`Category ${index + 1}:`, {
          id: cat.id,
          name: cat.name,
          isDefault: cat.isDefault,
          isOccupationGenerated: cat.isOccupationGenerated,
          userId: cat.user?.id,
          color: cat.color
        })
      })
      
      setCategories(response.data)
      
      // Debug logging
      const myCategories = response.data.filter(c => c.user?.id === user?.id && !c.isDefault && !c.isOccupationGenerated)
      const occupationCategories = response.data.filter(c => c.isOccupationGenerated && c.user?.id === user?.id)
      const defaultCategories = response.data.filter(c => c.isDefault)
      const groupSharedCategories = response.data.filter(c => c.user?.id !== user?.id && !c.isDefault && !c.isOccupationGenerated)
      
      console.log('User ID:', user?.id)
      console.log('My Categories:', myCategories.length, myCategories)
      console.log('Occupation Categories:', occupationCategories.length, occupationCategories)
      console.log('Default Categories:', defaultCategories.length)
      console.log('Group Shared Categories:', groupSharedCategories.length)
      console.log('=== END DEBUG ===')
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
      color: category.color || '#3B82F6'
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
      color: '#3B82F6'
    })
  }

  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="categories-wrapper">
      <div className="categories-background">
        <div className="categories-orb categories-orb-1"></div>
        <div className="categories-orb categories-orb-2"></div>
      </div>
      
      <div className="space-y-6 relative z-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Categories</h1>
        <button
          onClick={() => {
            resetForm()
            setEditingCategory(null)
            setShowModal(true)
          }}
          className="btn-primary flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
        >
          <Plus size={20} className="mr-2" />
          Add Category
        </button>
      </div>

      {/* All Categories Section */}
      <div className="categories-section">
        <h2 className="section-title">
          <Tag className="inline w-5 h-5 mr-2" />
          All Categories ({categories.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const isOccupation = category.isOccupationGenerated
            const isDefault = category.isDefault
            const isMine = category.user?.id === user?.id
            const isShared = !isMine && !isDefault
            
            return (
              <div 
                key={category.id} 
                className={`card backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 border-l-4 ${
                  isOccupation ? 'bg-gradient-to-br from-amber-50/90 to-orange-50/90 border-orange-500' :
                  isDefault ? 'bg-gradient-to-br from-gray-50/90 to-slate-50/90' :
                  isShared ? 'bg-gradient-to-br from-green-50/90 to-emerald-50/90 border-green-500' :
                  'bg-white/90'
                }`}
                style={!isOccupation && !isShared ? { borderLeftColor: category.color } : {}}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div
                      className={`w-5 h-5 rounded-full mr-3 shadow-lg ring-2 ring-white ${isOccupation ? 'animate-pulse' : ''}`}
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                      <div className="flex gap-1 mt-1">
                        {isOccupation && (
                          <span className="inline-block text-xs bg-gradient-to-r from-orange-400 to-amber-400 text-white px-2 py-0.5 rounded-full shadow-sm">
                            Occupation
                          </span>
                        )}
                        {isDefault && (
                          <span className="inline-block text-xs bg-gradient-to-r from-blue-400 to-sky-400 text-white px-2 py-0.5 rounded-full shadow-sm">
                            Default
                          </span>
                        )}
                        {isShared && (
                          <span className="inline-block text-xs bg-gradient-to-r from-green-400 to-emerald-400 text-white px-2 py-0.5 rounded-full shadow-sm">
                            Shared
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {!isDefault && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                        title="Edit Category"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Delete Category"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* My Categories Section */}
      {false && myCategories.length > 0 && (
        <div className="categories-section">
          <h2 className="section-title">
            <Tag className="inline w-5 h-5 mr-2" />
            My Categories ({myCategories.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCategories.map((category) => (
              <div key={category.id} className="card bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 border-l-4" style={{ borderLeftColor: category.color }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div
                      className="w-5 h-5 rounded-full mr-3 shadow-lg ring-2 ring-white animate-pulse"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                      title="Edit Category"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title="Delete Category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Occupation Categories Section */}
      {occupationCategories.length > 0 && (
        <div className="categories-section">
          <h2 className="section-title">
            <Tag className="inline w-5 h-5 mr-2" />
            Occupation Categories ({occupationCategories.length})
          </h2>
          <p className="section-description">
            These categories are automatically generated based on your selected occupation and tailored to your professional needs.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {occupationCategories.map((category) => (
              <div key={category.id} className="card bg-gradient-to-br from-amber-50/90 to-orange-50/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div
                      className="w-5 h-5 rounded-full mr-3 shadow-lg ring-2 ring-white animate-pulse"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                      <span className="inline-block mt-1 text-xs bg-gradient-to-r from-orange-400 to-amber-400 text-white px-2 py-0.5 rounded-full shadow-sm">
                        Occupation
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                      title="Edit Category"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title="Delete Category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Group/Admin Shared Categories Section */}
      {groupSharedCategories.length > 0 && (
        <div className="categories-section">
          <h2 className="section-title">
            <Users className="inline w-5 h-5 mr-2" />
            Group Shared Categories ({groupSharedCategories.length})
          </h2>
          <p className="section-description">
            These categories are shared by your admin or group members and are available for your use.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupSharedCategories.map((category) => (
              <div key={category.id} className="card bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 border-l-4 border-indigo-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div
                      className="w-5 h-5 rounded-full mr-3 shadow-lg ring-2 ring-white"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-gradient-to-r from-indigo-400 to-blue-400 text-white px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                          <Shield size={10} />
                          Shared
                        </span>
                        {category.user?.username && (
                          <span className="text-xs text-gray-500">by {category.user.username}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Default Categories Section */}
      {defaultCategories.length > 0 && (
        <div className="categories-section">
          <h2 className="section-title">
            <Tag className="inline w-5 h-5 mr-2" />
            Default Categories ({defaultCategories.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {defaultCategories.map((category) => (
              <div key={category.id} className="card bg-gradient-to-br from-gray-50/90 to-slate-50/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 border-l-4" style={{ borderLeftColor: category.color }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div
                      className="w-5 h-5 rounded-full mr-3 shadow-lg ring-2 ring-white"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                      <span className="inline-block mt-1 text-xs bg-gradient-to-r from-blue-400 to-sky-400 text-white px-2 py-0.5 rounded-full shadow-sm">
                        Default
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {categories.length === 0 && (
        <div className="text-center py-12">
          <Tag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Categories Yet</h3>
          <p className="text-gray-500">Create your first category to get started</p>
        </div>
      )}

      {/* Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-4 sm:p-6 border w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl bg-white/95 backdrop-blur-lg animate-fadeIn">
            <div className="mt-3">
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field mt-1"
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Color</label>
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2">
                      {predefinedColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-8 h-8 rounded-full border-2 ${
                            formData.color === color ? 'border-gray-400' : 'border-gray-200'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="mt-2 w-full h-10 rounded border border-gray-300"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
      
      <style>{`
        .categories-wrapper {
          position: relative;
          min-height: 100vh;
        }
        
        .categories-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #FCE7F3 0%, #E0E7FF 100%);
          z-index: -1;
        }
        
        .categories-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(65px);
          opacity: 0.3;
          animation: float-cat 22s ease-in-out infinite;
        }
        
        .categories-orb-1 {
          width: 420px;
          height: 420px;
          background: linear-gradient(135deg, #A855F7 0%, #EC4899 100%);
          top: -120px;
          right: -120px;
        }
        
        .categories-orb-2 {
          width: 360px;
          height: 360px;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          bottom: -100px;
          left: -100px;
          animation-delay: 11s;
        }
        
        @keyframes float-cat {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(35px, -35px) scale(1.12); }
      }
      
      .categories-section {
        margin-bottom: 2.5rem;
        padding: 1.5rem;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 100%);
        border-radius: 16px;
        backdrop-filter: blur(10px);
      }
      
      .section-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
      }
      
      .section-description {
        color: #6b7280;
        font-size: 0.875rem;
        margin-bottom: 1.25rem;
        font-style: italic;
        padding: 0.75rem 1rem;
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border-left: 4px solid #3b82f6;
        border-radius: 8px;
      }
    `}</style>
    </div>
  )
}

export default Categories



