/**
 * Supabase client configuration for AdSpark AI
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Database table names (matching PRD schema)
export const TABLES = {
  USERS: 'users',
  PROJECTS: 'projects', 
  AD_VARIATIONS: 'ad_variations',
  AD_DEPLOYMENTS: 'ad_deployments',
  SUBSCRIPTIONS: 'subscriptions',
  USAGE_LOGS: 'usage_logs'
}

// Helper functions for common database operations
export const dbHelpers = {
  /**
   * Get current user profile
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  /**
   * Get user profile with subscription info
   */
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select(`
        *,
        subscriptions (
          tier,
          status,
          current_period_end,
          usage_limits
        )
      `)
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Create or update user profile
   */
  async upsertUserProfile(userId, profileData) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .upsert({
        id: userId,
        updated_at: new Date().toISOString(),
        ...profileData
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Get user's projects with pagination
   */
  async getUserProjects(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit
    
    const { data, error, count } = await supabase
      .from(TABLES.PROJECTS)
      .select(`
        *,
        ad_variations (
          id,
          image_url,
          generated_copy,
          ai_performance_score,
          created_at
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) throw error
    return { data, count, hasMore: count > offset + limit }
  },

  /**
   * Create new project
   */
  async createProject(userId, projectData) {
    const { data, error } = await supabase
      .from(TABLES.PROJECTS)
      .insert({
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...projectData
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Get project with all ad variations
   */
  async getProjectWithVariations(projectId, userId) {
    const { data, error } = await supabase
      .from(TABLES.PROJECTS)
      .select(`
        *,
        ad_variations (
          *,
          ad_deployments (
            id,
            platform,
            post_id,
            deployment_date,
            metrics,
            status
          )
        )
      `)
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Create ad variations for a project
   */
  async createAdVariations(projectId, variations) {
    const variationsWithMeta = variations.map(variation => ({
      project_id: projectId,
      created_at: new Date().toISOString(),
      ...variation
    }))

    const { data, error } = await supabase
      .from(TABLES.AD_VARIATIONS)
      .insert(variationsWithMeta)
      .select()
    
    if (error) throw error
    return data
  },

  /**
   * Create ad deployment record
   */
  async createAdDeployment(adVariationId, deploymentData) {
    const { data, error } = await supabase
      .from(TABLES.AD_DEPLOYMENTS)
      .insert({
        ad_variation_id: adVariationId,
        deployment_date: new Date().toISOString(),
        ...deploymentData
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Update deployment metrics
   */
  async updateDeploymentMetrics(deploymentId, metrics) {
    const { data, error } = await supabase
      .from(TABLES.AD_DEPLOYMENTS)
      .update({
        metrics,
        updated_at: new Date().toISOString()
      })
      .eq('id', deploymentId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Log usage for billing/analytics
   */
  async logUsage(userId, action, metadata = {}) {
    const { data, error } = await supabase
      .from(TABLES.USAGE_LOGS)
      .insert({
        user_id: userId,
        action,
        metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Get usage statistics for a user
   */
  async getUserUsage(userId, timeframe = '30 days') {
    const { data, error } = await supabase
      .from(TABLES.USAGE_LOGS)
      .select('action, created_at, metadata')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}

// Real-time subscriptions helper
export const realtimeHelpers = {
  /**
   * Subscribe to project changes
   */
  subscribeToProject(projectId, callback) {
    return supabase
      .channel(`project-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.PROJECTS,
        filter: `id=eq.${projectId}`
      }, callback)
      .subscribe()
  },

  /**
   * Subscribe to ad deployment updates
   */
  subscribeToDeployments(userId, callback) {
    return supabase
      .channel(`deployments-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.AD_DEPLOYMENTS
      }, callback)
      .subscribe()
  }
}
