// Cloudinary helper - Upload qua Backend API

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const token = localStorage.getItem('auth_token')
    
    const response = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('Upload failed')
    }
    
    const result = await response.json()
    
    if (result.success && result.data) {
      return result.data // Cloudinary URL
    } else {
      throw new Error(result.message || 'Upload failed')
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw error
  }
}

// Helper để chuyển đổi URL
export const getImageUrl = (url: string): string => {
  // Nếu là local image
  if (url.startsWith('/images/')) {
    return url
  }
  
  // Nếu là Cloudinary URL
  if (url.startsWith('https://res.cloudinary.com/')) {
    return url
  }
  
  // Fallback
  return url
}
