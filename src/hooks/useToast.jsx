/**
 * Toast hook for AdSpark AI
 * Manages toast notifications state and provides easy-to-use methods
 */
import { useState, useCallback } from 'react'

let toastId = 0

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = ++toastId
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast
    }

    setToasts(prev => [...prev, newToast])
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods for different toast types
  const success = useCallback((message, options = {}) => {
    return addToast({
      type: 'success',
      message,
      ...options
    })
  }, [addToast])

  const error = useCallback((message, options = {}) => {
    return addToast({
      type: 'error',
      message,
      duration: 8000, // Longer duration for errors
      ...options
    })
  }, [addToast])

  const warning = useCallback((message, options = {}) => {
    return addToast({
      type: 'warning',
      message,
      duration: 6000,
      ...options
    })
  }, [addToast])

  const info = useCallback((message, options = {}) => {
    return addToast({
      type: 'info',
      message,
      ...options
    })
  }, [addToast])

  // Promise-based toast for async operations
  const promise = useCallback((promise, options = {}) => {
    const {
      loading = 'Loading...',
      success: successMessage = 'Success!',
      error: errorMessage = 'Something went wrong'
    } = options

    const loadingToastId = addToast({
      type: 'info',
      message: loading,
      persistent: true
    })

    return promise
      .then((result) => {
        removeToast(loadingToastId)
        success(typeof successMessage === 'function' ? successMessage(result) : successMessage)
        return result
      })
      .catch((error) => {
        removeToast(loadingToastId)
        const message = typeof errorMessage === 'function' ? errorMessage(error) : errorMessage
        addToast({
          type: 'error',
          message,
          duration: 8000
        })
        throw error
      })
  }, [addToast, removeToast, success])

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
    promise
  }
}

// Global toast context for app-wide notifications
import React, { createContext, useContext } from 'react'
import { ToastContainer } from '../components/Toast.jsx'

const ToastContext = createContext()

export const ToastProvider = ({ children }) => {
  const toast = useToast()

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </ToastContext.Provider>
  )
}

export const useGlobalToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useGlobalToast must be used within a ToastProvider')
  }
  return context
}

// Utility functions for common toast patterns
export const toastUtils = {
  /**
   * Show API error toast with proper formatting
   */
  apiError: (toast, error) => {
    const message = error?.message || 'An unexpected error occurred'
    const action = error?.code === 'NETWORK_ERROR' ? {
      label: 'Retry',
      onClick: () => window.location.reload()
    } : null

    return toast.error(message, {
      title: 'API Error',
      action,
      duration: 10000
    })
  },

  /**
   * Show validation error toast
   */
  validationError: (toast, errors) => {
    const message = Array.isArray(errors) 
      ? errors.join(', ')
      : typeof errors === 'object'
        ? Object.values(errors).flat().join(', ')
        : errors

    return toast.warning(message, {
      title: 'Validation Error',
      duration: 6000
    })
  },

  /**
   * Show success toast for common actions
   */
  actionSuccess: (toast, action, item = '') => {
    const messages = {
      create: `${item} created successfully`,
      update: `${item} updated successfully`,
      delete: `${item} deleted successfully`,
      save: `${item} saved successfully`,
      copy: `${item} copied to clipboard`,
      share: `${item} shared successfully`
    }

    return toast.success(messages[action] || `${action} completed successfully`)
  },

  /**
   * Show loading toast for async operations
   */
  asyncOperation: (toast, promise, messages = {}) => {
    return toast.promise(promise, {
      loading: messages.loading || 'Processing...',
      success: messages.success || 'Operation completed successfully',
      error: messages.error || 'Operation failed'
    })
  },

  /**
   * Show feature unavailable toast
   */
  featureUnavailable: (toast, feature = 'This feature') => {
    return toast.info(`${feature} is coming soon!`, {
      title: 'Feature Unavailable',
      duration: 4000
    })
  },

  /**
   * Show upgrade required toast
   */
  upgradeRequired: (toast, feature = 'this feature') => {
    return toast.warning(`Please upgrade your plan to use ${feature}`, {
      title: 'Upgrade Required',
      action: {
        label: 'Upgrade Now',
        onClick: () => window.location.href = '/settings?tab=billing'
      },
      duration: 8000
    })
  }
}
