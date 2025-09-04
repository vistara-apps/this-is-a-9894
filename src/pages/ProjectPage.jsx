import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjects } from '../contexts/ProjectContext'
import { useAuth } from '../contexts/AuthContext'
import AICreativeCard from '../components/AICreativeCard'
import { 
  ArrowLeft, 
  Sparkles, 
  Share, 
  Download,
  Instagram,
  Music,
  AlertCircle
} from 'lucide-react'

const ProjectPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { projects, setCurrentProject, generateAdVariations, deployToSocial, loading } = useProjects()
  const { user } = useAuth()
  const [selectedVariation, setSelectedVariation] = useState(null)
  const [showDeployModal, setShowDeployModal] = useState(false)
  const [deploymentPlatform, setDeploymentPlatform] = useState('')

  const project = projects.find(p => p.id === id)

  useEffect(() => {
    if (project) {
      setCurrentProject(project)
    }
  }, [project, setCurrentProject])

  const handleGenerateVariations = async () => {
    if (!project?.productImageURL) return
    
    try {
      // Create a mock file from the URL for the generation process
      const response = await fetch(project.productImageURL)
      const blob = await response.blob()
      const file = new File([blob], 'product-image.jpg', { type: 'image/jpeg' })
      
      await generateAdVariations(project.id, file)
    } catch (error) {
      console.error('Failed to generate variations:', error)
    }
  }

  const handleDeploy = (variation) => {
    setSelectedVariation(variation)
    setShowDeployModal(true)
  }

  const handleDeployToSocial = async () => {
    if (!selectedVariation || !deploymentPlatform) return
    
    try {
      await deployToSocial(selectedVariation.id, deploymentPlatform)
      setShowDeployModal(false)
      setSelectedVariation(null)
      setDeploymentPlatform('')
    } catch (error) {
      console.error('Failed to deploy:', error)
    }
  }

  if (!project) {
    return (
      <div className="py-8">
        <div className="container">
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-text-primary mb-2">Project not found</h2>
            <p className="text-text-secondary mb-6">The project you're looking for doesn't exist.</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const connectedAccounts = user?.connectedSocialAccounts || {}
  const hasConnectedAccounts = connectedAccounts.instagram || connectedAccounts.tiktok

  return (
    <div className="py-8">
      <div className="container">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-text-secondary" />
          </button>
          
          <div className="flex-1">
            <h1 className="text-heading1 font-bold text-text-primary">{project.productName}</h1>
            <p className="text-text-secondary">
              Created on {new Date(project.creationDate).toLocaleDateString()}
            </p>
          </div>

          <div className="flex space-x-3">
            <button className="btn-secondary inline-flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button className="btn-secondary inline-flex items-center space-x-2">
              <Share className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Original Image */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Original Product Image</h2>
          <div className="card max-w-md">
            <img 
              src={project.productImageURL} 
              alt={project.productName}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        </div>

        {/* Generate Section */}
        {(!project.adVariations || project.adVariations.length === 0) && (
          <div className="mb-8">
            <div className="card max-w-2xl">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  Ready to generate ad variations?
                </h3>
                <p className="text-text-secondary mb-6">
                  Our AI will analyze your product image and create 3-5 unique ad variations with different styles and copy suggestions.
                </p>
                <button
                  onClick={handleGenerateVariations}
                  disabled={loading}
                  className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{loading ? 'Generating...' : 'Generate Ad Variations'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mb-8">
            <div className="card">
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  AI is generating your ad variations...
                </h3>
                <p className="text-text-secondary">
                  This usually takes 30-60 seconds. Please wait while we create amazing variations for you.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ad Variations */}
        {project.adVariations && project.adVariations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">
                Generated Ad Variations ({project.adVariations.length})
              </h2>
              
              {!hasConnectedAccounts && (
                <div className="flex items-center space-x-2 bg-yellow-50 text-yellow-800 px-3 py-2 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Connect social accounts to deploy</span>
                  <button
                    onClick={() => navigate('/settings')}
                    className="text-yellow-900 underline hover:no-underline"
                  >
                    Settings
                  </button>
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.adVariations.map((variation) => (
                <AICreativeCard
                  key={variation.id}
                  variation={variation}
                  variant="analyzed"
                  onDeploy={hasConnectedAccounts ? handleDeploy : undefined}
                />
              ))}
            </div>
          </div>
        )}

        {/* Deployment Modal */}
        {showDeployModal && selectedVariation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-surface rounded-lg shadow-modal max-w-md w-full">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  Deploy Ad Variation
                </h3>

                <div className="mb-6">
                  <img 
                    src={selectedVariation.imageUrl} 
                    alt="Selected variation"
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <p className="text-sm text-text-secondary">
                    {selectedVariation.generatedCopy}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-sm font-medium text-text-primary">Select platform:</p>
                  
                  {connectedAccounts.instagram && (
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        value="instagram"
                        checked={deploymentPlatform === 'instagram'}
                        onChange={(e) => setDeploymentPlatform(e.target.value)}
                        className="text-primary"
                      />
                      <Instagram className="h-5 w-5 text-purple-600" />
                      <span>Instagram</span>
                    </label>
                  )}

                  {connectedAccounts.tiktok && (
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        value="tiktok"
                        checked={deploymentPlatform === 'tiktok'}
                        onChange={(e) => setDeploymentPlatform(e.target.value)}
                        className="text-primary"
                      />
                      <Music className="h-5 w-5 text-black" />
                      <span>TikTok</span>
                    </label>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeployModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeployToSocial}
                    disabled={!deploymentPlatform || loading}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Deploying...' : 'Deploy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deployments */}
        {project.deployments && project.deployments.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-6">
              Deployed Ads ({project.deployments.length})
            </h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.deployments.map((deployment) => {
                const variation = project.adVariations.find(v => v.id === deployment.variationId)
                if (!variation) return null

                return (
                  <div key={deployment.id} className="card">
                    <div className="flex items-center space-x-2 mb-3">
                      {deployment.platform === 'instagram' ? (
                        <Instagram className="h-4 w-4 text-purple-600" />
                      ) : (
                        <Music className="h-4 w-4 text-black" />
                      )}
                      <span className="text-sm font-medium capitalize">{deployment.platform}</span>
                      <span className="text-xs text-text-secondary">
                        {new Date(deployment.deploymentDate).toLocaleDateString()}
                      </span>
                    </div>

                    <img 
                      src={variation.imageUrl} 
                      alt="Deployed ad"
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-text-primary">{deployment.metrics.views}</div>
                        <div className="text-text-secondary">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-text-primary">{deployment.metrics.likes}</div>
                        <div className="text-text-secondary">Likes</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectPage