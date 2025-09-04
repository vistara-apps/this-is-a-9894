import React, { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

const ImageUploader = ({ onImageSelect, variant = 'default', className = '' }) => {
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setFileName(file.name)
      onImageSelect?.(file)
    }
  }

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const clearImage = () => {
    setPreviewUrl(null)
    setFileName('')
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    onImageSelect?.(null)
  }

  const openFileDialog = () => {
    inputRef.current?.click()
  }

  if (variant === 'withPreview' && previewUrl) {
    return (
      <div className={`card relative ${className}`}>
        <div className="flex items-start space-x-4">
          <div className="relative">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-24 h-24 object-cover rounded-lg"
            />
            <button
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-text-primary">{fileName}</h4>
            <p className="text-sm text-text-secondary mt-1">
              Image uploaded successfully. Ready to generate variations.
            </p>
            <button
              onClick={openFileDialog}
              className="text-sm text-primary hover:text-primary/80 mt-2"
            >
              Change image
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div className={`card ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-gray-100 rounded-full">
            <ImageIcon className="h-8 w-8 text-text-secondary" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-text-primary">
              Upload Product Image
            </h3>
            <p className="text-text-secondary mt-1">
              Drop your image here or click to browse
            </p>
          </div>

          <button
            onClick={openFileDialog}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Choose File</span>
          </button>
          
          <p className="text-xs text-text-secondary">
            Supports: JPG, PNG, WEBP up to 10MB
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  )
}

export default ImageUploader