/**
 * Central API service layer for AdSpark AI
 * Handles all external API communications with proper error handling and retry logic
 */

class APIError extends Error {
  constructor(message, status, code) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.code = code
  }
}

class APIService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5173/api'
    this.retryAttempts = 3
    this.retryDelay = 1000
  }

  /**
   * Generic HTTP request method with retry logic
   */
  async request(url, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, config)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new APIError(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorData.code
          )
        }

        return await response.json()
      } catch (error) {
        if (attempt === this.retryAttempts || error instanceof APIError) {
          throw error
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
      }
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const url = new URL(endpoint, this.baseURL)
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key])
      }
    })

    return this.request(url.toString(), { method: 'GET' })
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    const url = new URL(endpoint, this.baseURL)
    return this.request(url.toString(), {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    const url = new URL(endpoint, this.baseURL)
    return this.request(url.toString(), {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    const url = new URL(endpoint, this.baseURL)
    return this.request(url.toString(), { method: 'DELETE' })
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile(endpoint, file, onProgress = null) {
    const formData = new FormData()
    formData.append('file', file)

    const url = new URL(endpoint, this.baseURL)
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100
            onProgress(percentComplete)
          }
        })
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch (error) {
            resolve({ success: true })
          }
        } else {
          reject(new APIError(`Upload failed: ${xhr.statusText}`, xhr.status))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new APIError('Upload failed: Network error'))
      })

      xhr.open('POST', url.toString())
      xhr.send(formData)
    })
  }

  /**
   * Set authentication token
   */
  setAuthToken(token) {
    this.authToken = token
  }

  /**
   * Get authenticated request headers
   */
  getAuthHeaders() {
    return this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}
  }
}

// Export singleton instance
export const apiService = new APIService()
export { APIError }

// Utility functions for common API patterns
export const withAuth = (headers = {}) => ({
  ...headers,
  ...apiService.getAuthHeaders(),
})

export const handleAPIError = (error) => {
  console.error('API Error:', error)
  
  if (error instanceof APIError) {
    switch (error.status) {
      case 401:
        // Handle unauthorized - redirect to login
        window.location.href = '/login'
        break
      case 403:
        return 'Access denied. Please check your permissions.'
      case 404:
        return 'Resource not found.'
      case 429:
        return 'Too many requests. Please try again later.'
      case 500:
        return 'Server error. Please try again later.'
      default:
        return error.message || 'An unexpected error occurred.'
    }
  }
  
  return 'Network error. Please check your connection.'
}
