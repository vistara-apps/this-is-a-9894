import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import SocialAccountConnector from '../components/SocialAccountConnector'
import { 
  User, 
  CreditCard, 
  Bell, 
  Shield, 
  Key,
  Save,
  Crown
} from 'lucide-react'

const SettingsPage = () => {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({
    email: user?.email || '',
    name: user?.name || '',
    notifications: {
      deploymentComplete: true,
      weeklyReports: true,
      performanceAlerts: false
    }
  })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'social', label: 'Social Accounts', icon: Key },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ]

  const handleSaveProfile = () => {
    updateUser({
      email: formData.email,
      name: formData.name
    })
    // Show success message
  }

  const handleNotificationChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }))
  }

  const subscriptionPlans = [
    { name: 'Free', price: '$0', current: user?.subscriptionTier === 'free' },
    { name: 'Pro', price: '$29', current: user?.subscriptionTier === 'pro' },
    { name: 'Premium', price: '$79', current: user?.subscriptionTier === 'premium' }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Profile Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        )

      case 'social':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Connected Accounts</h3>
              <p className="text-text-secondary mb-6">
                Connect your social media accounts to automatically deploy ad variations.
              </p>
            </div>

            <div className="space-y-4">
              <SocialAccountConnector platform="instagram" variant="instagram" />
              <SocialAccountConnector platform="tiktok" variant="tiktok" />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">📋 Setup Requirements</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Instagram: Business or Creator account required</li>
                <li>• TikTok: Business account with API access</li>
                <li>• Both platforms require app review for posting permissions</li>
              </ul>
            </div>
          </div>
        )

      case 'billing':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Subscription</h3>
              <div className="flex items-center space-x-2 mb-6">
                <Crown className="h-5 w-5 text-yellow-500" />
                <span className="font-medium text-text-primary capitalize">
                  {user?.subscriptionTier} Plan
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`card relative ${
                    plan.current
                      ? 'ring-2 ring-primary border-primary/20'
                      : ''
                  }`}
                >
                  {plan.current && (
                    <div className="absolute -top-2 -right-2 bg-primary text-white px-2 py-1 rounded-full text-xs font-medium">
                      Current
                    </div>
                  )}

                  <div className="text-center">
                    <h4 className="font-semibold text-text-primary mb-2">{plan.name}</h4>
                    <div className="text-2xl font-bold text-text-primary mb-4">
                      {plan.price}<span className="text-sm text-text-secondary">/mo</span>
                    </div>
                    
                    {!plan.current && (
                      <button className="btn-primary w-full text-sm">
                        Upgrade
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-medium text-text-primary mb-4">Usage This Month</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-text-primary">12</div>
                  <div className="text-sm text-text-secondary">AI Generations Used</div>
                  <div className="text-xs text-text-secondary mt-1">
                    {user?.subscriptionTier === 'free' ? '5 remaining' : '38 remaining'}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-text-primary">8</div>
                  <div className="text-sm text-text-secondary">Social Deployments</div>
                  <div className="text-xs text-text-secondary mt-1">
                    {user?.subscriptionTier === 'free' ? '0 remaining' : '12 remaining'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Notification Preferences</h3>
              <p className="text-text-secondary mb-6">
                Choose what notifications you want to receive.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-text-primary">Deployment Complete</div>
                  <div className="text-sm text-text-secondary">
                    Get notified when ad variations are successfully deployed
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifications.deploymentComplete}
                    onChange={(e) => handleNotificationChange('deploymentComplete', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-text-primary">Weekly Reports</div>
                  <div className="text-sm text-text-secondary">
                    Receive weekly performance summaries via email
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifications.weeklyReports}
                    onChange={(e) => handleNotificationChange('weeklyReports', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-text-primary">Performance Alerts</div>
                  <div className="text-sm text-text-secondary">
                    Get alerted when ads perform exceptionally well or poorly
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifications.performanceAlerts}
                    onChange={(e) => handleNotificationChange('performanceAlerts', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Security Settings</h3>
              <p className="text-text-secondary mb-6">
                Manage your account security and privacy.
              </p>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h4 className="font-medium text-text-primary mb-2">Change Password</h4>
                <p className="text-sm text-text-secondary mb-4">
                  Update your password to keep your account secure.
                </p>
                <button className="btn-secondary">
                  Change Password
                </button>
              </div>

              <div className="card">
                <h4 className="font-medium text-text-primary mb-2">Two-Factor Authentication</h4>
                <p className="text-sm text-text-secondary mb-4">
                  Add an extra layer of security to your account.
                </p>
                <button className="btn-secondary">
                  Enable 2FA
                </button>
              </div>

              <div className="card">
                <h4 className="font-medium text-text-primary mb-2">API Keys</h4>
                <p className="text-sm text-text-secondary mb-4">
                  Manage API keys for integrations and automations.
                </p>
                <button className="btn-secondary">
                  Manage API Keys
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="py-8">
      <div className="container max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-heading1 font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:text-text-primary hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="card">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage