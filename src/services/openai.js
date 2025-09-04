/**
 * OpenAI service for AdSpark AI
 * Handles image generation and text analysis using OpenAI's APIs
 */
import OpenAI from 'openai'
import { APIError } from './api.js'

class OpenAIService {
  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    const organization = import.meta.env.VITE_OPENAI_ORGANIZATION

    if (!apiKey) {
      throw new Error('OpenAI API key is required. Please set VITE_OPENAI_API_KEY in your environment.')
    }

    this.client = new OpenAI({
      apiKey,
      organization,
      dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
    })

    this.defaultImageModel = 'dall-e-3'
    this.defaultTextModel = 'gpt-4'
    this.maxRetries = 3
  }

  /**
   * Generate ad variations from a product image
   */
  async generateAdVariations(productImageUrl, productName, options = {}) {
    const {
      numVariations = 3,
      style = 'modern',
      platform = 'instagram',
      targetAudience = 'general',
      onProgress = null
    } = options

    try {
      const variations = []
      
      for (let i = 0; i < numVariations; i++) {
        if (onProgress) {
          onProgress({
            step: 'generating',
            current: i + 1,
            total: numVariations,
            message: `Generating variation ${i + 1} of ${numVariations}...`
          })
        }

        // Generate image variation
        const imageVariation = await this.generateImageVariation(
          productImageUrl,
          productName,
          { style, platform, variationIndex: i }
        )

        // Generate copy for the variation
        const adCopy = await this.generateAdCopy(
          productName,
          { style, platform, targetAudience, variationIndex: i }
        )

        // Analyze performance potential
        const performanceScore = await this.analyzePerformancePotential(
          imageVariation.url,
          adCopy,
          { platform, targetAudience }
        )

        variations.push({
          imageUrl: imageVariation.url,
          generatedCopy: adCopy,
          aiPerformanceScore: performanceScore,
          generationMetadata: {
            model: this.defaultImageModel,
            style,
            platform,
            targetAudience,
            prompt: imageVariation.prompt,
            revisedPrompt: imageVariation.revised_prompt,
            generatedAt: new Date().toISOString()
          }
        })

        // Small delay to avoid rate limiting
        if (i < numVariations - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      if (onProgress) {
        onProgress({
          step: 'completed',
          current: numVariations,
          total: numVariations,
          message: 'All variations generated successfully!'
        })
      }

      return variations
    } catch (error) {
      console.error('Error generating ad variations:', error)
      throw new APIError(
        `Failed to generate ad variations: ${error.message}`,
        error.status || 500,
        'OPENAI_GENERATION_ERROR'
      )
    }
  }

  /**
   * Generate a single image variation
   */
  async generateImageVariation(productImageUrl, productName, options = {}) {
    const { style, platform, variationIndex } = options

    const stylePrompts = {
      modern: 'clean, minimalist, contemporary design',
      vibrant: 'bright colors, energetic, eye-catching',
      elegant: 'sophisticated, premium, refined aesthetic',
      playful: 'fun, creative, engaging and dynamic'
    }

    const platformSpecs = {
      instagram: 'square format (1:1), Instagram-optimized',
      tiktok: 'vertical format (9:16), TikTok-optimized'
    }

    const variations = [
      'lifestyle setting with natural lighting',
      'product showcase with dramatic lighting',
      'creative composition with artistic elements',
      'minimalist background with focus on product',
      'contextual environment showing product in use'
    ]

    const prompt = `Create a professional advertisement image for "${productName}". 
    Style: ${stylePrompts[style] || stylePrompts.modern}. 
    Format: ${platformSpecs[platform] || platformSpecs.instagram}.
    Composition: ${variations[variationIndex % variations.length]}.
    High quality, commercial photography style, suitable for social media advertising.
    No text or logos in the image.`

    try {
      const response = await this.client.images.generate({
        model: this.defaultImageModel,
        prompt,
        n: 1,
        size: platform === 'tiktok' ? '1024x1792' : '1024x1024',
        quality: 'hd',
        style: 'vivid'
      })

      return {
        url: response.data[0].url,
        prompt,
        revised_prompt: response.data[0].revised_prompt
      }
    } catch (error) {
      console.error('Error generating image variation:', error)
      throw new APIError(
        `Failed to generate image: ${error.message}`,
        error.status || 500,
        'OPENAI_IMAGE_ERROR'
      )
    }
  }

  /**
   * Generate ad copy for a variation
   */
  async generateAdCopy(productName, options = {}) {
    const { style, platform, targetAudience, variationIndex } = options

    const copyStyles = {
      modern: 'clean, direct, professional tone',
      vibrant: 'energetic, exciting, action-oriented',
      elegant: 'sophisticated, premium, refined language',
      playful: 'fun, casual, engaging and friendly'
    }

    const platformGuidelines = {
      instagram: 'Instagram post with hashtags, engaging and visual',
      tiktok: 'TikTok caption, trendy and conversational'
    }

    const audienceTargeting = {
      general: 'broad appeal, accessible language',
      young_adults: 'trendy, relatable, social media savvy',
      professionals: 'business-focused, value-driven',
      parents: 'family-oriented, practical benefits'
    }

    const copyVariations = [
      'benefit-focused with emotional appeal',
      'problem-solution approach',
      'social proof and testimonial style',
      'urgency and scarcity messaging',
      'storytelling and lifestyle approach'
    ]

    const prompt = `Write compelling ad copy for "${productName}".
    
    Style: ${copyStyles[style] || copyStyles.modern}
    Platform: ${platformGuidelines[platform] || platformGuidelines.instagram}
    Target Audience: ${audienceTargeting[targetAudience] || audienceTargeting.general}
    Approach: ${copyVariations[variationIndex % copyVariations.length]}
    
    Requirements:
    - Keep it concise and engaging
    - Include a clear call-to-action
    - Add relevant hashtags for ${platform}
    - Focus on benefits and value proposition
    - Make it platform-appropriate
    
    Return only the ad copy, no explanations.`

    try {
      const response = await this.client.chat.completions.create({
        model: this.defaultTextModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert copywriter specializing in social media advertising. Create compelling, conversion-focused ad copy.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.8
      })

      return response.choices[0].message.content.trim()
    } catch (error) {
      console.error('Error generating ad copy:', error)
      throw new APIError(
        `Failed to generate ad copy: ${error.message}`,
        error.status || 500,
        'OPENAI_TEXT_ERROR'
      )
    }
  }

  /**
   * Analyze performance potential of an ad variation
   */
  async analyzePerformancePotential(imageUrl, adCopy, options = {}) {
    const { platform, targetAudience } = options

    const prompt = `Analyze this ad creative for performance potential:

    Ad Copy: "${adCopy}"
    Platform: ${platform}
    Target Audience: ${targetAudience}
    
    Rate the performance potential from 0.0 to 1.0 based on:
    - Copy effectiveness and engagement potential
    - Platform optimization
    - Target audience alignment
    - Call-to-action strength
    - Overall commercial appeal
    
    Consider factors like:
    - Clarity of value proposition
    - Emotional appeal
    - Urgency and motivation
    - Platform-specific best practices
    - Audience relevance
    
    Return only a decimal number between 0.0 and 1.0, no explanations.`

    try {
      const response = await this.client.chat.completions.create({
        model: this.defaultTextModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert in social media advertising performance analysis. Provide accurate performance predictions based on creative elements.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 10,
        temperature: 0.3
      })

      const scoreText = response.choices[0].message.content.trim()
      const score = parseFloat(scoreText)
      
      // Validate score is between 0 and 1
      if (isNaN(score) || score < 0 || score > 1) {
        console.warn('Invalid performance score returned, using default:', scoreText)
        return 0.5 // Default middle score
      }

      return score
    } catch (error) {
      console.error('Error analyzing performance potential:', error)
      // Return default score on error
      return 0.5
    }
  }

  /**
   * Optimize existing ad copy
   */
  async optimizeAdCopy(originalCopy, performanceData, options = {}) {
    const { platform, targetAudience } = options

    const prompt = `Optimize this ad copy based on performance data:

    Original Copy: "${originalCopy}"
    Platform: ${platform}
    Target Audience: ${targetAudience}
    Performance Data: ${JSON.stringify(performanceData)}
    
    Improve the copy to increase engagement and conversion rates.
    Keep the same tone and style but enhance effectiveness.
    
    Return only the optimized ad copy, no explanations.`

    try {
      const response = await this.client.chat.completions.create({
        model: this.defaultTextModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert copywriter who optimizes ad copy based on performance data to improve conversion rates.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })

      return response.choices[0].message.content.trim()
    } catch (error) {
      console.error('Error optimizing ad copy:', error)
      throw new APIError(
        `Failed to optimize ad copy: ${error.message}`,
        error.status || 500,
        'OPENAI_OPTIMIZATION_ERROR'
      )
    }
  }

  /**
   * Check if OpenAI service is available
   */
  async healthCheck() {
    try {
      await this.client.models.list()
      return { status: 'healthy', timestamp: new Date().toISOString() }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService()
export default openaiService
