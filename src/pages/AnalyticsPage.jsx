import React, { useState } from 'react'
import { useProjects } from '../contexts/ProjectContext'
import AnalyticsChart from '../components/AnalyticsChart'
import { 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share,
  Calendar,
  Filter
} from 'lucide-react'

const AnalyticsPage = () => {
  const { projects } = useProjects()
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedProject, setSelectedProject] = useState('all')

  // Calculate aggregate metrics
  const allDeployments = projects.flatMap(p => p.deployments || [])
  const totalViews = allDeployments.reduce((sum, d) => sum + (d.metrics?.views || 0), 0)
  const totalLikes = allDeployments.reduce((sum, d) => sum + (d.metrics?.likes || 0), 0)
  const totalComments = allDeployments.reduce((sum, d) => sum + (d.metrics?.comments || 0), 0)
  const totalShares = allDeployments.reduce((sum, d) => sum + (d.metrics?.shares || 0), 0)

  // Prepare chart data
  const performanceData = projects.map(project => ({
    name: project.productName,
    value: (project.deployments || []).reduce((sum, d) => sum + (d.metrics?.views || 0), 0)
  }))

  const platformData = [
    {
      name: 'Instagram',
      value: allDeployments
        .filter(d => d.platform === 'instagram')
        .reduce((sum, d) => sum + (d.metrics?.views || 0), 0)
    },
    {
      name: 'TikTok',
      value: allDeployments
        .filter(d => d.platform === 'tiktok')
        .reduce((sum, d) => sum + (d.metrics?.views || 0), 0)
    }
  ]

  const engagementData = allDeployments.map((deployment, index) => ({
    name: `Ad ${index + 1}`,
    value: ((deployment.metrics?.likes || 0) + (deployment.metrics?.comments || 0)) / 
           Math.max(deployment.metrics?.views || 1, 1) * 100
  }))

  const metrics = [
    {
      label: 'Total Views',
      value: totalViews.toLocaleString(),
      icon: Eye,
      change: '+12.5%',
      positive: true
    },
    {
      label: 'Total Likes',
      value: totalLikes.toLocaleString(),
      icon: Heart,
      change: '+8.2%',
      positive: true
    },
    {
      label: 'Total Comments',
      value: totalComments.toLocaleString(),
      icon: MessageCircle,
      change: '+15.7%',
      positive: true
    },
    {
      label: 'Total Shares',
      value: totalShares.toLocaleString(),
      icon: Share,
      change: '+5.3%',
      positive: true
    }
  ]

  return (
    <div className="py-8">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-heading1 font-bold text-text-primary">Analytics</h1>
            <p className="text-text-secondary mt-1">
              Track performance across all your ad campaigns
            </p>
          </div>

          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.productName}
                </option>
              ))}
            </select>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {allDeployments.length > 0 ? (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {metrics.map((metric, index) => {
                const Icon = metric.icon
                return (
                  <div key={index} className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className={`text-sm font-medium ${
                        metric.positive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.change}
                      </span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-text-primary mb-1">
                        {metric.value}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {metric.label}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              <AnalyticsChart
                data={performanceData}
                title="Performance by Project"
                variant="bar"
              />
              <AnalyticsChart
                data={platformData}
                title="Views by Platform"
                variant="bar"
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <AnalyticsChart
                data={engagementData}
                title="Engagement Rate (%)"
                variant="line"
              />
              
              {/* Top Performing Ads */}
              <div className="card">
                <h3 className="text-lg font-semibold text-text-primary mb-6">
                  Top Performing Ads
                </h3>
                
                <div className="space-y-4">
                  {allDeployments
                    .sort((a, b) => (b.metrics?.views || 0) - (a.metrics?.views || 0))
                    .slice(0, 5)
                    .map((deployment, index) => {
                      const project = projects.find(p => 
                        p.deployments?.some(d => d.id === deployment.id)
                      )
                      const variation = project?.adVariations?.find(v => 
                        v.id === deployment.variationId
                      )
                      
                      if (!variation) return null

                      return (
                        <div key={deployment.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold">
                            #{index + 1}
                          </div>
                          
                          <img 
                            src={variation.imageUrl} 
                            alt="Ad"
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          
                          <div className="flex-1">
                            <div className="font-medium text-text-primary">
                              {project?.productName}
                            </div>
                            <div className="text-sm text-text-secondary capitalize">
                              {deployment.platform}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-medium text-text-primary">
                              {deployment.metrics?.views || 0}
                            </div>
                            <div className="text-sm text-text-secondary">
                              views
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="h-12 w-12 text-text-secondary" />
            </div>
            
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              No analytics data yet
            </h3>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Deploy some ad variations to start seeing performance analytics and insights.
            </p>
            
            <button
              onClick={() => window.history.back()}
              className="btn-primary"
            >
              Create Your First Project
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnalyticsPage