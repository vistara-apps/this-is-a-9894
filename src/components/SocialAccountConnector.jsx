import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle, ExternalLink, Link } from 'lucide-react'

const SocialAccountConnector = ({ platform, variant = 'instagram' }) => {
  const { user, updateUser } = useAuth()
  
  const isConnected = user?.connectedSocialAccounts?.[platform]
  
  const platformConfig = {
    instagram: {
      name: 'Instagram',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      icon: '📷',
      description: 'Connect your Instagram business account to automatically post ad variations.'
    },
    tiktok: {
      name: 'TikTok',
      color: 'bg-black',
      icon: '🎵',
      description: 'Connect your TikTok for Business account to deploy video ad content.'
    }
  }

  const config = platformConfig[platform] || platformConfig.instagram

  const handleConnect = async () => {
    // Simulate OAuth flow
    setTimeout(() => {
      updateUser({
        connectedSocialAccounts: {
          ...user.connectedSocialAccounts,
          [platform]: true
        }
      })
    }, 1000)
  }

  const handleDisconnect = () => {
    updateUser({
      connectedSocialAccounts: {
        ...user.connectedSocialAccounts,
        [platform]: false
      }
    })
  }

  return (
    <div className="card">
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 rounded-lg ${config.color} flex items-center justify-center text-2xl`}>
          {config.icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-semibold text-text-primary">{config.name}</h3>
            {isConnected && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
          
          <p className="text-sm text-text-secondary mb-4">
            {config.description}
          </p>

          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Connected successfully</span>
              </div>
              
              <div className="flex space-x-3">
                <button className="btn-secondary text-sm">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View Account
                </button>
                <button 
                  onClick={handleDisconnect}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="btn-primary text-sm inline-flex items-center space-x-2"
            >
              <Link className="h-3 w-3" />
              <span>Connect {config.name}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SocialAccountConnector