'use client'

import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'

interface Category {
  name: string
  icon: string
  href: string
  count: number
}

interface CategoryCardProps {
  category: Category
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const { t } = useTranslation()
  
  return (
    <Link
      href={category.href}
      className="bg-white rounded-lg p-4 text-center hover:shadow-lg transition-all duration-300 group"
    >
      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
        {category.icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-navy-500 transition-colors">
        {category.name}
      </h3>
      <p className="text-sm text-gray-500">
        {category.count} {t('allProducts').toLowerCase()}
      </p>
    </Link>
  )
}
