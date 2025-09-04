import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Zap, 
  Target, 
  BarChart3, 
  ArrowRight,
  Star,
  CheckCircle,
  Sparkles
} from 'lucide-react'

const HomePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Generation',
      description: 'Create 3-5 unique ad variations from a single product image using advanced AI technology.'
    },
    {
      icon: Target,
      title: 'Smart Deployment',
      description: 'Automatically post variations to your connected TikTok and Instagram accounts for A/B testing.'
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Track metrics and identify winning creatives with our comprehensive analytics dashboard.'
    }
  ]

  const pricing = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      features: [
        '5 AI generations',
        '2 social deployments',
        'Basic analytics',
        'Email support'
      ],
      isPopular: false
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      features: [
        '50 AI generations',
        '20 social deployments',
        'Advanced analytics',
        'Priority support',
        'Custom branding'
      ],
      isPopular: true
    },
    {
      name: 'Premium',
      price: '$79',
      period: '/month',
      features: [
        'Unlimited generations',
        '100 social deployments',
        'Premium analytics',
        '24/7 support',
        'API access',
        'White-label option'
      ],
      isPopular: false
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-background py-20">
        <div className="container">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                <Zap className="h-4 w-4" />
                <span>AI-Powered Ad Generation</span>
              </div>
            </div>
            
            <h1 className="text-display font-extrabold text-text-primary mb-6 leading-tight">
              Generate and deploy ad variations in 
              <span className="text-primary"> minutes</span>, not hours
            </h1>
            
            <p className="text-xl text-text-secondary mb-8 leading-relaxed">
              Transform your single product image into multiple high-converting ad creatives 
              and automatically deploy them across social media platforms for instant A/B testing.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary text-lg px-8 py-4 inline-flex items-center space-x-2"
              >
                <span>Start Creating Ads</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              
              <button className="btn-secondary text-lg px-8 py-4">
                Watch Demo
              </button>
            </div>

            <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-text-secondary">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>5 free generations</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Setup in 2 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-surface">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-heading1 font-bold text-text-primary mb-4">
              Everything you need to create winning ads
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Our AI-powered platform streamlines your entire ad creation and testing workflow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="card text-center hover:shadow-lg transition-shadow duration-200">
                  <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-6">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-heading1 font-bold text-text-primary mb-4">
              Choose your plan
            </h2>
            <p className="text-xl text-text-secondary">
              Start for free, upgrade as you grow
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <div 
                key={index} 
                className={`card relative ${
                  plan.isPopular 
                    ? 'ring-2 ring-primary shadow-lg transform scale-105' 
                    : ''
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-end justify-center">
                    <span className="text-4xl font-bold text-text-primary">
                      {plan.price}
                    </span>
                    <span className="text-text-secondary mb-1">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  className={`w-full py-3 rounded-lg font-medium transition-colors duration-200 ${
                    plan.isPopular
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-gray-100 text-text-primary hover:bg-gray-200'
                  }`}
                >
                  {plan.name === 'Free' ? 'Get Started' : 'Upgrade Now'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container text-center">
          <h2 className="text-heading1 font-bold mb-4">
            Ready to transform your ad strategy?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of creators and businesses already using AdSpark AI
          </p>
          
          <div className="flex items-center justify-center space-x-2 mb-8">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
            ))}
            <span className="ml-2 text-lg">4.9/5 from 2,000+ users</span>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="bg-white text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors duration-200 inline-flex items-center space-x-2"
          >
            <span>Start Your Free Trial</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  )
}

export default HomePage