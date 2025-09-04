import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const AnalyticsChart = ({ 
  data = [], 
  variant = 'bar', 
  title = 'Performance Metrics',
  className = '' 
}) => {
  const renderChart = () => {
    if (variant === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(240, 80%, 50%)" 
              strokeWidth={2}
              dot={{ fill: "hsl(240, 80%, 50%)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="hsl(240, 80%, 50%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className={`card ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      </div>
      {data.length > 0 ? (
        renderChart()
      ) : (
        <div className="h-300 flex items-center justify-center text-text-secondary">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              📊
            </div>
            <p>No data available yet</p>
            <p className="text-sm mt-1">Deploy some ads to see analytics</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsChart