"use client";

import Link from "next/link";
import Image from "next/image";
import { getCategoryIcon } from "@/lib/categoryIcons";

interface CategoryCardProps {
  category: string;
  imageUrl?: string;
  showImage?: boolean;
}

export function CategoryCard({ category, imageUrl, showImage = false }: CategoryCardProps) {
  const categoryData = getCategoryIcon(category);

  const Icon = categoryData.icon;

  return (
    <Link
      href={`/shop?category=${encodeURIComponent(category)}`}
      className="group block h-full bg-gray-50 border border-gray-100 hover:border-red-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-xl overflow-hidden"
    >
      {/* Image background (optional) */}
      {showImage && (
        <div className="relative h-24 overflow-hidden bg-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={category}
              fill
              sizes="(max-width: 768px) 50vw, 20vw"
              className="object-cover group-hover:scale-110 transition-transform duration-300 opacity-40 group-hover:opacity-60"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="p-6 flex flex-col items-center text-center">
        {/* Icon */}
        <div
          className={`w-12 h-12 mx-auto ${categoryData.bgColor} rounded-full flex items-center justify-center group-hover:${categoryData.bgColor} transition-colors mb-4`}
        >
          <Icon size={20} className={`${categoryData.color} group-hover:scale-110 transition-transform duration-300`} />
        </div>

        {/* Category name */}
        <h3 className="font-medium text-gray-900 group-hover:text-red-600 transition-colors text-sm sm:text-base">
          {category}
        </h3>
      </div>
    </Link>
  );
}
