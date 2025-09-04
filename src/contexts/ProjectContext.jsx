import React, { createContext, useContext, useState, useCallback } from 'react'

const ProjectContext = createContext()

export const useProjects = () => {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider')
  }
  return context
}

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [loading, setLoading] = useState(false)

  const createProject = useCallback(async (projectData) => {
    setLoading(true)
    try {
      const newProject = {
        id: Date.now().toString(),
        ...projectData,
        creationDate: new Date().toISOString(),
        adVariations: [],
        deployments: []
      }
      setProjects(prev => [...prev, newProject])
      setCurrentProject(newProject)
      return newProject
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProject = useCallback((projectId, updates) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, ...updates } : p
    ))
    if (currentProject?.id === projectId) {
      setCurrentProject(prev => ({ ...prev, ...updates }))
    }
  }, [currentProject])

  const generateAdVariations = useCallback(async (projectId, imageFile) => {
    setLoading(true)
    try {
      // Simulate AI generation delay
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const variations = [
        {
          id: `var_${Date.now()}_1`,
          imageUrl: URL.createObjectURL(imageFile),
          generatedCopy: "🔥 Transform your space with this amazing product! Limited time offer - don't miss out! #productivity #lifestyle",
          aiPerformanceScore: 8.5,
          style: 'Modern & Clean'
        },
        {
          id: `var_${Date.now()}_2`,
          imageUrl: URL.createObjectURL(imageFile),
          generatedCopy: "✨ Discover the secret to effortless success! Join thousands of satisfied customers. #innovation #quality",
          aiPerformanceScore: 7.8,
          style: 'Bold & Dynamic'
        },
        {
          id: `var_${Date.now()}_3`,
          imageUrl: URL.createObjectURL(imageFile),
          generatedCopy: "💡 The perfect solution you've been waiting for! Premium quality, unbeatable price. #value #trending",
          aiPerformanceScore: 9.2,
          style: 'Elegant & Professional'
        }
      ]

      updateProject(projectId, { adVariations: variations })
      return variations
    } finally {
      setLoading(false)
    }
  }, [updateProject])

  const deployToSocial = useCallback(async (variationId, platform) => {
    setLoading(true)
    try {
      // Simulate deployment delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const deployment = {
        id: `dep_${Date.now()}`,
        variationId,
        platform,
        postId: `${platform}_${Date.now()}`,
        deploymentDate: new Date().toISOString(),
        metrics: {
          views: Math.floor(Math.random() * 1000),
          likes: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 20),
          shares: Math.floor(Math.random() * 10)
        }
      }

      if (currentProject) {
        const updatedDeployments = [...(currentProject.deployments || []), deployment]
        updateProject(currentProject.id, { deployments: updatedDeployments })
      }

      return deployment
    } finally {
      setLoading(false)
    }
  }, [currentProject, updateProject])

  const value = {
    projects,
    currentProject,
    setCurrentProject,
    createProject,
    updateProject,
    generateAdVariations,
    deployToSocial,
    loading
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}