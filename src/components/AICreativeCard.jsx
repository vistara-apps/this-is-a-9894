import React, { useState } from 'react'
import { Star, Copy, Download, Share, Zap, TrendingUp } from 'lucide-react'

const AICreativeCard = ({ 
  variation, 
  variant = 'generated', 
  onDeploy,
  className = '' 
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(variation.generatedCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 9) return 'text-green-600'
    if (score >= 7) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={`card hover:shadow-lg transition-shadow duration-200 ${className}`}>
      {/* Image */}
      <div className="relative mb-4">
        <img 
          src={variation.imageUrl} 
          alt="Ad Variation" 
          className="w-full h-48 object-cover rounded-lg"
        />
        <div className="absolute top-2 right-2 bg-surface/90 backdrop-blur-sm rounded-md px-2 py-1">
          <span className="text-sm font-medium text-text-primary">
            {variation.style}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* AI Performance Score */}
        {variant === 'analyzed' && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">AI Performance Score</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-lg font-bold ${getScoreColor(variation.aiPerformanceScore)}`}>
                {variation.aiPerformanceScore}/10
              </span>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-3 w-3 ${
                      i < Math.floor(variation.aiPerformanceScore / 2) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generated Copy */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-text-primary">Generated Copy</h4>
            <button
              onClick={handleCopyText}
              className="flex items-center space-x-1 text-sm text-text-secondary hover:text-text-primary"
            >
              <Copy className="h-3 w-3" />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-sm text-text-secondary bg-gray-50 p-3 rounded-lg">
            {variation.generatedCopy}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="flex space-x-2">
            <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <Download className="h-4 w-4" />
            </button>
            <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <Share className="h-4 w-4" />
            </button>
          </div>
          
          <button
            onClick={() => onDeploy?.(variation)}
            className="btn-primary text-sm px-4 py-2 inline-flex items-center space-x-2"
          >
            <Zap className="h-3 w-3" />
            <span>Deploy</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AICreativeCard