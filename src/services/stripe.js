/**
 * Stripe payment service for AdSpark AI
 * Handles subscription billing and payment processing
 */
import { loadStripe } from '@stripe/stripe-js'
import { APIError } from './api.js'

class StripeService {
  constructor() {
    this.publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    this.stripePromise = null
    
    if (this.publishableKey) {
      this.stripePromise = loadStripe(this.publishableKey)
    }

    // Subscription tiers configuration
    this.subscriptionTiers = {
      free: {
        name: 'Free',
        price: 0,
        priceId: null,
        features: [
          '5 AI generations per month',
          '2 social media deployments per month',
          'Basic analytics',
          'Email support'
        ],
        limits: {
          generations_per_month: 5,
          deployments_per_month: 2,
          projects: 3
        }
      },
      pro: {
        name: 'Pro',
        price: 29,
        priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
        features: [
          '50 AI generations per month',
          '20 social media deployments per month',
          'Advanced analytics',
          'Priority support',
          'Custom branding'
        ],
        limits: {
          generations_per_month: 50,
          deployments_per_month: 20,
          projects: 25
        }
      },
      premium: {
        name: 'Premium',
        price: 79,
        priceId: import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID,
        features: [
          'Unlimited AI generations',
          '100 social media deployments per month',
          'Advanced analytics & insights',
          '24/7 priority support',
          'Custom branding',
          'API access',
          'White-label options'
        ],
        limits: {
          generations_per_month: -1, // Unlimited
          deployments_per_month: 100,
          projects: -1 // Unlimited
        }
      }
    }
  }

  /**
   * Get Stripe instance
   */
  async getStripe() {
    if (!this.stripePromise) {
      throw new Error('Stripe not initialized. Please check your publishable key.')
    }
    return await this.stripePromise
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(priceId, userId, options = {}) {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId,
          successUrl: options.successUrl || `${window.location.origin}/dashboard?success=true`,
          cancelUrl: options.cancelUrl || `${window.location.origin}/settings?canceled=true`,
          metadata: options.metadata || {}
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new APIError(error.message || 'Failed to create checkout session', response.status)
      }

      const { sessionId } = await response.json()
      
      const stripe = await this.getStripe()
      const { error } = await stripe.redirectToCheckout({ sessionId })
      
      if (error) {
        throw new APIError(error.message, 400, 'STRIPE_REDIRECT_ERROR')
      }

      return { sessionId }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw error
    }
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(customerId, returnUrl = null) {
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          returnUrl: returnUrl || `${window.location.origin}/settings`
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new APIError(error.message || 'Failed to create portal session', response.status)
      }

      const { url } = await response.json()
      window.location.href = url

      return { url }
    } catch (error) {
      console.error('Error creating portal session:', error)
      throw error
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId) {
    try {
      const response = await fetch(`/api/stripe/subscription/${subscriptionId}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new APIError(error.message || 'Failed to get subscription', response.status)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting subscription:', error)
      throw error
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    try {
      const response = await fetch(`/api/stripe/subscription/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelAtPeriodEnd
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new APIError(error.message || 'Failed to cancel subscription', response.status)
      }

      return await response.json()
    } catch (error) {
      console.error('Error canceling subscription:', error)
      throw error
    }
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(subscriptionId) {
    try {
      const response = await fetch(`/api/stripe/subscription/${subscriptionId}/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new APIError(error.message || 'Failed to resume subscription', response.status)
      }

      return await response.json()
    } catch (error) {
      console.error('Error resuming subscription:', error)
      throw error
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId, newPriceId, options = {}) {
    try {
      const response = await fetch(`/api/stripe/subscription/${subscriptionId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPriceId,
          prorationBehavior: options.prorationBehavior || 'create_prorations'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new APIError(error.message || 'Failed to update subscription', response.status)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating subscription:', error)
      throw error
    }
  }

  /**
   * Get usage-based billing information
   */
  async getUsageRecord(subscriptionItemId, timestamp = null) {
    try {
      const params = new URLSearchParams()
      if (timestamp) {
        params.append('timestamp', timestamp)
      }

      const response = await fetch(`/api/stripe/usage/${subscriptionItemId}?${params.toString()}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new APIError(error.message || 'Failed to get usage record', response.status)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting usage record:', error)
      throw error
    }
  }

  /**
   * Report usage for billing
   */
  async reportUsage(subscriptionItemId, quantity, timestamp = null, action = 'increment') {
    try {
      const response = await fetch('/api/stripe/usage/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionItemId,
          quantity,
          timestamp: timestamp || Math.floor(Date.now() / 1000),
          action
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new APIError(error.message || 'Failed to report usage', response.status)
      }

      return await response.json()
    } catch (error) {
      console.error('Error reporting usage:', error)
      throw error
    }
  }

  /**
   * Get upcoming invoice
   */
  async getUpcomingInvoice(customerId, subscriptionId = null) {
    try {
      const params = new URLSearchParams({ customer: customerId })
      if (subscriptionId) {
        params.append('subscription', subscriptionId)
      }

      const response = await fetch(`/api/stripe/invoice/upcoming?${params.toString()}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new APIError(error.message || 'Failed to get upcoming invoice', response.status)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting upcoming invoice:', error)
      throw error
    }
  }

  /**
   * Get payment methods for customer
   */
  async getPaymentMethods(customerId) {
    try {
      const response = await fetch(`/api/stripe/payment-methods/${customerId}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new APIError(error.message || 'Failed to get payment methods', response.status)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting payment methods:', error)
      throw error
    }
  }

  /**
   * Get subscription tier information
   */
  getSubscriptionTier(tierName) {
    return this.subscriptionTiers[tierName] || null
  }

  /**
   * Get all subscription tiers
   */
  getAllSubscriptionTiers() {
    return this.subscriptionTiers
  }

  /**
   * Check if user can perform action based on subscription limits
   */
  canPerformAction(userSubscription, action, currentUsage = {}) {
    const tier = this.getSubscriptionTier(userSubscription.tier)
    if (!tier) return false

    const limits = tier.limits
    
    switch (action) {
      case 'generate_image':
        if (limits.generations_per_month === -1) return true
        return (currentUsage.generations_this_month || 0) < limits.generations_per_month

      case 'deploy_ad':
        if (limits.deployments_per_month === -1) return true
        return (currentUsage.deployments_this_month || 0) < limits.deployments_per_month

      case 'create_project':
        if (limits.projects === -1) return true
        return (currentUsage.total_projects || 0) < limits.projects

      default:
        return false
    }
  }

  /**
   * Calculate usage percentage for display
   */
  getUsagePercentage(userSubscription, action, currentUsage = {}) {
    const tier = this.getSubscriptionTier(userSubscription.tier)
    if (!tier) return 0

    const limits = tier.limits
    
    switch (action) {
      case 'generate_image':
        if (limits.generations_per_month === -1) return 0
        return Math.min(100, ((currentUsage.generations_this_month || 0) / limits.generations_per_month) * 100)

      case 'deploy_ad':
        if (limits.deployments_per_month === -1) return 0
        return Math.min(100, ((currentUsage.deployments_this_month || 0) / limits.deployments_per_month) * 100)

      case 'create_project':
        if (limits.projects === -1) return 0
        return Math.min(100, ((currentUsage.total_projects || 0) / limits.projects) * 100)

      default:
        return 0
    }
  }

  /**
   * Format price for display
   */
  formatPrice(amount, currency = 'usd') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount)
  }

  /**
   * Check if payments are enabled
   */
  isEnabled() {
    return import.meta.env.VITE_ENABLE_PAYMENTS === 'true' && !!this.publishableKey
  }

  /**
   * Get trial period information
   */
  getTrialInfo(tierName) {
    // Define trial periods for each tier
    const trialPeriods = {
      pro: 14, // 14 days
      premium: 7 // 7 days
    }

    return {
      days: trialPeriods[tierName] || 0,
      hasTrialPeriod: !!trialPeriods[tierName]
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService()
export default stripeService
