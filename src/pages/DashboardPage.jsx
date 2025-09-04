import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../contexts/ProjectContext'
import ImageUploader from '../components/ImageUploader'
import { Plus, FolderOpen, Calendar, ArrowRight, Sparkles } from 'lucide-react'

const DashboardPage = () => {
  const { projects, createProject, loading } = useProjects()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [productImage, setProductImage] = useState(null)
  const navigate = useNavigate()

  const handleCreateProject = async () => {
    if (!projectName || !productImage) return
    
    try {
      const project = await createProject({
        productName: projectName,
        productImageURL: URL.createObjectURL(productImage)
      })
      
      setShowCreateForm(false)
      setProjectName('')
      setProductImage(null)
      navigate(`/project/${project.id}`)
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="py-8">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-heading1 font-bold text-text-primary">Dashboard</h1>
            <p className="text-text-secondary mt-1">
              Create and manage your ad generation projects
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Create Project Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-surface rounded-lg shadow-modal max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-text-primary">Create New Project</h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-text-secondary hover:text-text-primary"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Enter product name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Product Image
                    </label>
                    <ImageUploader
                      onImageSelect={setProductImage}
                      variant={productImage ? 'withPreview' : 'default'}
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateProject}
                      disabled={!projectName || !productImage || loading}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating...' : 'Create Project'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
                <div onClick={() => navigate(`/project/${project.id}`)}>
                  {/* Project Image */}
                  <div className="relative mb-4">
                    <img 
                      src={project.productImageURL} 
                      alt={project.productName}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-lg flex items-center justify-center">
                      <ArrowRight className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors duration-200">
                      {project.productName}
                    </h3>

                    <div className="flex items-center space-x-4 text-sm text-text-secondary">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(project.creationDate)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Sparkles className="h-3 w-3" />
                        <span>{project.adVariations?.length || 0} variations</span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">
                        {project.adVariations?.length > 0 ? 'Generated' : 'Ready to Generate'}
                      </span>
                      
                      <ArrowRight className="h-4 w-4 text-text-secondary group-hover:text-primary transition-colors duration-200" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="h-12 w-12 text-text-secondary" />
            </div>
            
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No projects yet
            </h3>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Create your first project by uploading a product image and let our AI generate amazing ad variations.
            </p>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Your First Project</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage