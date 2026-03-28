'use client'

import { useState } from 'react'
import { FiUpload, FiX } from 'react-icons/fi'
import { uploadToCloudinary } from '@/lib/cloudinary'
import toast from 'react-hot-toast'

interface ImageItem {
  id?: number
  imageUrl: string
  displayOrder: number
  isPrimary?: boolean
  altText?: string
}

interface MultiImageUploadProps {
  productId?: number
  images: ImageItem[]
  onChange: (images: ImageItem[]) => void
  maxImages?: number
  disabled?: boolean
}

export default function MultiImageUpload({ 
  productId,
  images, 
  onChange, 
  maxImages = 9,
  disabled 
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Kiểm tra số lượng ảnh
    if (images.length + files.length > maxImages) {
      toast.error(`Chỉ được upload tối đa ${maxImages} ảnh`)
      return
    }

    // Validate từng file
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chỉ chọn file ảnh')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Mỗi ảnh không được vượt quá 10MB')
        return
      }
    }

    try {
      setUploading(true)
      
      // Upload từng ảnh lên Cloudinary
      const uploadPromises = files.map(file => uploadToCloudinary(file))
      const urls = await Promise.all(uploadPromises)
      
      // Tạo danh sách ảnh mới
      const newImages: ImageItem[] = urls.map((url, index) => ({
        imageUrl: url,
        displayOrder: images.length + index
      }))
      
      onChange([...images, ...newImages])
      toast.success(`Upload thành công ${urls.length} ảnh!`)
      
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Lỗi khi upload ảnh')
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    
    // Cập nhật lại displayOrder
    newImages.forEach((img, i) => {
      img.displayOrder = i
    })
    
    onChange(newImages)
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {/* Danh sách ảnh hiện tại */}
      {images.map((image, index) => (
        <div 
          key={index}
          className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
        >
          <img 
            src={image.imageUrl} 
            alt={`Product ${index + 1}`}
            className="w-full h-full object-cover"
          />
          
          {/* Nút xóa */}
          {!disabled && (
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg"
              title="Xóa ảnh"
            >
              <FiX size={16} />
            </button>
          )}
          
          {/* Số thứ tự */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            {index + 1}
          </div>
        </div>
      ))}
      
      {/* Nút upload thêm ảnh - ô nhỏ cùng kích thước */}
      {images.length < maxImages && !disabled && (
        <label className="relative bg-gray-50 rounded-lg overflow-hidden aspect-square border-2 border-dashed border-gray-300 cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors flex items-center justify-center">
          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          ) : (
            <div className="text-gray-400 hover:text-red-500 transition-colors">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          )}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={disabled || uploading}
          />
        </label>
      )}
    </div>
  )
}
