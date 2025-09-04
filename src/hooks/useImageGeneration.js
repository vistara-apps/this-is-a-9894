/**
 * Custom hook for managing image generation workflow
 */
import { useState, useCallback } from 'react'
import { openaiService } from '../services/openai.js'
import { dbHelpers } from '../lib/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'

export const useImageGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const [generatedVariations, setGeneratedVariations] = useState([])
  const { user } = useAuth()

  const generateVariations = useCallback(async (projectData, options = {}) => {
    if (!user) {
      setError('User must be authenticated to generate variations')
      return null
    }

    setIsGenerating(true)
    setError(null)
    setProgress({ step: 'initializing', message: 'Starting generation...' })

    try {
      // Check usage limits
      const canGenerate = await dbHelpers.checkUsageLimit(user.id, 'image_generation')
      if (!canGenerate) {
        throw new Error('Usage limit exceeded. Please upgrade your plan or wait until next month.')
      }

      // Log usage
      await dbHelpers.logUsage(user.id, 'image_generation', {
        projectId: projectData.id,
        productName: projectData.productName,
        options
      })

      // Generate variations using OpenAI
      const variations = await openaiService.generateAdVariations(
        projectData.productImageUrl,
        projectData.productName,
        {
          ...options,
          onProgress: setProgress
        }
      )

      // Save variations to database
      setProgress({ step: 'saving', message: 'Saving variations to database...' })
      const savedVariations = await dbHelpers.createAdVariations(projectData.id, variations)

      // Update project status
      await dbHelpers.updateProject(projectData.id, {
        status: 'completed',
        generatedAdVariations: savedVariations.map(v => v.id)
      })

      setGeneratedVariations(savedVariations)
      setProgress({ step: 'completed', message: 'Generation completed successfully!' })
      
      return savedVariations
    } catch (err) {
      console.error('Error generating variations:', err)
      setError(err.message || 'Failed to generate ad variations')
      
      // Update project status to failed if it exists
      if (projectData.id) {
        try {
          await dbHelpers.updateProject(projectData.id, {
            status: 'failed',
            metadata: { error: err.message }
          })
        } catch (updateError) {
          console.error('Failed to update project status:', updateError)
        }
      }
      
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [user])

  const regenerateVariation = useCallback(async (variationId, projectData, options = {}) => {
    if (!user) {
      setError('User must be authenticated to regenerate variations')
      return null
    }

    setIsGenerating(true)
    setError(null)
    setProgress({ step: 'regenerating', message: 'Regenerating variation...' })

    try {
      // Check usage limits
      const canGenerate = await dbHelpers.checkUsageLimit(user.id, 'image_generation')
      if (!canGenerate) {
        throw new Error('Usage limit exceeded. Please upgrade your plan or wait until next month.')
      }

      // Generate single variation
      const imageVariation = await openaiService.generateImageVariation(
        projectData.productImageUrl,
        projectData.productName,
        options
      )

      const adCopy = await openaiService.generateAdCopy(
        projectData.productName,
        options
      )

      const performanceScore = await openaiService.analyzePerformancePotential(
        imageVariation.url,
        adCopy,
        options
      )

      const newVariation = {
        imageUrl: imageVariation.url,
        generatedCopy: adCopy,
        aiPerformanceScore: performanceScore,
        generationMetadata: {
          model: 'dall-e-3',
          ...options,
          prompt: imageVariation.prompt,
          revisedPrompt: imageVariation.revised_prompt,
          generatedAt: new Date().toISOString(),
          regenerated: true,
          originalVariationId: variationId
        }
      }

      // Save new variation to database
      const savedVariation = await dbHelpers.createAdVariations(projectData.id, [newVariation])

      // Log usage
      await dbHelpers.logUsage(user.id, 'image_generation', {
        projectId: projectData.id,
        variationId: savedVariation[0].id,
        regenerated: true,
        originalVariationId: variationId
      })

      setProgress({ step: 'completed', message: 'Variation regenerated successfully!' })
      
      return savedVariation[0]
    } catch (err) {
      console.error('Error regenerating variation:', err)
      setError(err.message || 'Failed to regenerate variation')
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [user])

  const optimizeVariation = useCallback(async (variationId, performanceData, options = {}) => {
    if (!user) {
      setError('User must be authenticated to optimize variations')
      return null
    }

    setIsGenerating(true)
    setError(null)
    setProgress({ step: 'optimizing', message: 'Optimizing ad copy...' })

    try {
      // Get original variation
      const variation = generatedVariations.find(v => v.id === variationId)
      if (!variation) {
        throw new Error('Variation not found')
      }

      // Optimize the copy
      const optimizedCopy = await openaiService.optimizeAdCopy(
        variation.generatedCopy,
        performanceData,
        options
      )

      // Update variation in database
      const updatedVariation = await dbHelpers.updateAdVariation(variationId, {
        generatedCopy: optimizedCopy,
        generationMetadata: {
          ...variation.generationMetadata,
          optimized: true,
          optimizedAt: new Date().toISOString(),
          originalCopy: variation.generatedCopy,
          performanceData
        }
      })

      // Update local state
      setGeneratedVariations(prev => 
        prev.map(v => v.id === variationId ? updatedVariation : v)
      )

      setProgress({ step: 'completed', message: 'Variation optimized successfully!' })
      
      return updatedVariation
    } catch (err) {
      console.error('Error optimizing variation:', err)
      setError(err.message || 'Failed to optimize variation')
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [user, generatedVariations])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const resetProgress = useCallback(() => {
    setProgress(null)
  }, [])

  const clearVariations = useCallback(() => {
    setGeneratedVariations([])
  }, [])

  return {
    // State
    isGenerating,
    progress,
    error,
    generatedVariations,
    
    // Actions
    generateVariations,
    regenerateVariation,
    optimizeVariation,
    clearError,
    resetProgress,
    clearVariations,
    
    // Computed values
    hasVariations: generatedVariations.length > 0,
    canGenerate: !isGenerating && user,
    progressPercentage: progress?.current && progress?.total 
      ? Math.round((progress.current / progress.total) * 100)
      : 0
  }
}
