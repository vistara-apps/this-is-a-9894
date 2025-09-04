/**
 * Social Media API service for AdSpark AI
 * Handles Instagram and TikTok integrations for automated posting and analytics
 */
import { APIError } from './api.js'

class SocialMediaService {
  constructor() {
    this.instagramClientId = import.meta.env.VITE_INSTAGRAM_CLIENT_ID
    this.instagramClientSecret = import.meta.env.VITE_INSTAGRAM_CLIENT_SECRET
    this.tiktokClientKey = import.meta.env.VITE_TIKTOK_CLIENT_KEY
    this.tiktokClientSecret = import.meta.env.VITE_TIKTOK_CLIENT_SECRET
    this.appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173'
  }

  /**
   * Instagram OAuth URL generation
   */
  getInstagramAuthUrl(state = null) {
    if (!this.instagramClientId) {
      throw new Error('Instagram client ID not configured')
    }

    const params = new URLSearchParams({
      client_id: this.instagramClientId,
      redirect_uri: `${this.appUrl}/auth/instagram/callback`,
      scope: 'user_profile,user_media',
      response_type: 'code',
      ...(state && { state })
    })

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`
  }

  /**
   * TikTok OAuth URL generation
   */
  getTikTokAuthUrl(state = null) {
    if (!this.tiktokClientKey) {
      throw new Error('TikTok client key not configured')
    }

    const params = new URLSearchParams({
      client_key: this.tiktokClientKey,
      redirect_uri: `${this.appUrl}/auth/tiktok/callback`,
      scope: 'user.info.basic,video.list,video.upload',
      response_type: 'code',
      ...(state && { state })
    })

    return `https://www.tiktok.com/auth/authorize/?${params.toString()}`
  }

  /**
   * Exchange Instagram authorization code for access token
   */
  async exchangeInstagramCode(code) {
    try {
      const response = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.instagramClientId,
          client_secret: this.instagramClientSecret,
          grant_type: 'authorization_code',
          redirect_uri: `${this.appUrl}/auth/instagram/callback`,
          code
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new APIError(error.error_message || 'Failed to exchange Instagram code', response.status)
      }

      const data = await response.json()
      
      // Get long-lived token
      const longLivedToken = await this.getInstagramLongLivedToken(data.access_token)
      
      return {
        accessToken: longLivedToken.access_token,
        userId: data.user_id,
        expiresIn: longLivedToken.expires_in,
        tokenType: longLivedToken.token_type
      }
    } catch (error) {
      console.error('Error exchanging Instagram code:', error)
      throw error
    }
  }

  /**
   * Get Instagram long-lived access token
   */
  async getInstagramLongLivedToken(shortLivedToken) {
    try {
      const params = new URLSearchParams({
        grant_type: 'ig_exchange_token',
        client_secret: this.instagramClientSecret,
        access_token: shortLivedToken
      })

      const response = await fetch(`https://graph.instagram.com/access_token?${params.toString()}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new APIError(error.error.message || 'Failed to get long-lived token', response.status)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting Instagram long-lived token:', error)
      throw error
    }
  }

  /**
   * Exchange TikTok authorization code for access token
   */
  async exchangeTikTokCode(code) {
    try {
      const response = await fetch('https://open-api.tiktok.com/oauth/access_token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: this.tiktokClientKey,
          client_secret: this.tiktokClientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${this.appUrl}/auth/tiktok/callback`
        })
      })

      if (!response.ok) {
        throw new APIError('Failed to exchange TikTok code', response.status)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new APIError(data.error_description || data.error, 400)
      }

      return {
        accessToken: data.data.access_token,
        refreshToken: data.data.refresh_token,
        expiresIn: data.data.expires_in,
        openId: data.data.open_id,
        scope: data.data.scope
      }
    } catch (error) {
      console.error('Error exchanging TikTok code:', error)
      throw error
    }
  }

  /**
   * Post content to Instagram
   */
  async postToInstagram(accessToken, imageUrl, caption, options = {}) {
    try {
      // Step 1: Create media container
      const containerResponse = await fetch(`https://graph.instagram.com/v18.0/me/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption,
          access_token: accessToken
        })
      })

      if (!containerResponse.ok) {
        const error = await containerResponse.json()
        throw new APIError(error.error.message || 'Failed to create Instagram media container', containerResponse.status)
      }

      const containerData = await containerResponse.json()
      const creationId = containerData.id

      // Step 2: Publish the media
      const publishResponse = await fetch(`https://graph.instagram.com/v18.0/me/media_publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: accessToken
        })
      })

      if (!publishResponse.ok) {
        const error = await publishResponse.json()
        throw new APIError(error.error.message || 'Failed to publish Instagram media', publishResponse.status)
      }

      const publishData = await publishResponse.json()

      return {
        postId: publishData.id,
        platform: 'instagram',
        status: 'posted',
        postedAt: new Date().toISOString(),
        mediaUrl: imageUrl,
        caption
      }
    } catch (error) {
      console.error('Error posting to Instagram:', error)
      throw error
    }
  }

  /**
   * Post content to TikTok
   */
  async postToTikTok(accessToken, videoUrl, caption, options = {}) {
    try {
      // Note: TikTok requires video content, not images
      // This is a simplified implementation - in production, you'd need to convert images to videos
      
      const response = await fetch('https://open-api.tiktok.com/share/video/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_url: videoUrl,
          text: caption,
          privacy_level: options.privacyLevel || 'SELF_ONLY', // For testing
          disable_duet: options.disableDuet || false,
          disable_comment: options.disableComment || false,
          disable_stitch: options.disableStitch || false
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new APIError(error.error.message || 'Failed to post to TikTok', response.status)
      }

      const data = await response.json()

      return {
        postId: data.data.share_id,
        platform: 'tiktok',
        status: 'posted',
        postedAt: new Date().toISOString(),
        mediaUrl: videoUrl,
        caption
      }
    } catch (error) {
      console.error('Error posting to TikTok:', error)
      throw error
    }
  }

  /**
   * Get Instagram post metrics
   */
  async getInstagramMetrics(accessToken, postId) {
    try {
      const response = await fetch(
        `https://graph.instagram.com/v18.0/${postId}?fields=id,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${accessToken}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new APIError(error.error.message || 'Failed to get Instagram metrics', response.status)
      }

      const data = await response.json()

      return {
        platform: 'instagram',
        postId: data.id,
        likes: data.like_count || 0,
        comments: data.comments_count || 0,
        shares: 0, // Instagram doesn't provide share count via API
        views: 0, // Not available for image posts
        engagement: (data.like_count || 0) + (data.comments_count || 0),
        permalink: data.permalink,
        timestamp: data.timestamp,
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error getting Instagram metrics:', error)
      throw error
    }
  }

  /**
   * Get TikTok post metrics
   */
  async getTikTokMetrics(accessToken, postId) {
    try {
      const response = await fetch(
        `https://open-api.tiktok.com/video/query/?access_token=${accessToken}&open_id=${postId}&fields=like_count,comment_count,share_count,view_count`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new APIError(error.error.message || 'Failed to get TikTok metrics', response.status)
      }

      const data = await response.json()
      const video = data.data.videos[0]

      return {
        platform: 'tiktok',
        postId: video.id,
        likes: video.like_count || 0,
        comments: video.comment_count || 0,
        shares: video.share_count || 0,
        views: video.view_count || 0,
        engagement: (video.like_count || 0) + (video.comment_count || 0) + (video.share_count || 0),
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error getting TikTok metrics:', error)
      throw error
    }
  }

  /**
   * Refresh Instagram access token
   */
  async refreshInstagramToken(accessToken) {
    try {
      const response = await fetch(
        `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new APIError(error.error.message || 'Failed to refresh Instagram token', response.status)
      }

      return await response.json()
    } catch (error) {
      console.error('Error refreshing Instagram token:', error)
      throw error
    }
  }

  /**
   * Refresh TikTok access token
   */
  async refreshTikTokToken(refreshToken) {
    try {
      const response = await fetch('https://open-api.tiktok.com/oauth/refresh_token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: this.tiktokClientKey,
          client_secret: this.tiktokClientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      })

      if (!response.ok) {
        throw new APIError('Failed to refresh TikTok token', response.status)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new APIError(data.error_description || data.error, 400)
      }

      return data.data
    } catch (error) {
      console.error('Error refreshing TikTok token:', error)
      throw error
    }
  }

  /**
   * Validate platform and credentials
   */
  validatePlatform(platform) {
    const supportedPlatforms = ['instagram', 'tiktok']
    if (!supportedPlatforms.includes(platform)) {
      throw new APIError(`Unsupported platform: ${platform}. Supported platforms: ${supportedPlatforms.join(', ')}`, 400)
    }
  }

  /**
   * Check if social media features are enabled
   */
  isEnabled() {
    return import.meta.env.VITE_ENABLE_SOCIAL_POSTING === 'true'
  }

  /**
   * Get platform-specific posting requirements
   */
  getPlatformRequirements(platform) {
    const requirements = {
      instagram: {
        mediaTypes: ['image'],
        maxCaptionLength: 2200,
        aspectRatios: ['1:1', '4:5', '9:16'],
        minImageSize: { width: 320, height: 320 },
        maxImageSize: { width: 1440, height: 1440 }
      },
      tiktok: {
        mediaTypes: ['video'],
        maxCaptionLength: 150,
        aspectRatios: ['9:16'],
        minVideoDuration: 3, // seconds
        maxVideoDuration: 180, // seconds
        maxFileSize: 287 * 1024 * 1024 // 287MB
      }
    }

    return requirements[platform] || null
  }
}

// Export singleton instance
export const socialMediaService = new SocialMediaService()
export default socialMediaService
