"use client";

import { MOCK_PRODUCTS } from "@/lib/data";
import { ShieldAlert, Check, Truck, ArrowLeft, Heart, Share2, Star, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
import { useState } from "react";

export default function ProductDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const product = MOCK_PRODUCTS.find(p => p.id === params.id);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageZoom, setImageZoom] = useState({ x: 0, y: 0 });
  const [showZoom, setShowZoom] = useState(false);
  
  if (!product) {
    return (
      <div className="bg-white min-h-screen py-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
            <p className="text-gray-600 text-sm mb-6">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Link 
              href="/shop" 
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Mock images array (main image + thumbnails)
  const images = [product.imageUrl, product.imageUrl, product.imageUrl];

  // Mock similar products
  const similarProducts = MOCK_PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  // Mock reviews
  const reviews = [
    { author: "Ama K.", rating: 5, text: "Excellent quality and fast delivery!", date: "2 days ago" },
    { author: "Kwesi M.", rating: 4, text: "Good product. Delivery was quick.", date: "1 week ago" },
    { author: "Abena L.", rating: 5, text: "Highly recommended. Best pharmacy service!", date: "2 weeks ago" },
  ];

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setImageZoom({ x, y });
    setShowZoom(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} on Pulse Pharma`,
        url: window.location.href,
      });
    }
  };

  const averageRating = 4.7;
  const totalReviews = 128;

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-red-600 mb-8 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} /> Go Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Image Gallery Section */}
          <div>
            {/* Main Image with Zoom */}
            <div 
              className="relative bg-gray-50 rounded-2xl p-8 border border-gray-100 flex items-center justify-center overflow-hidden group cursor-zoom-in mb-4"
              onMouseMove={handleImageMouseMove}
              onMouseLeave={() => setShowZoom(false)}
            >
              <img 
                src={images[selectedImageIndex]} 
                alt={product.name}
                className="max-w-full h-auto max-h-[500px] object-contain rounded-xl transition-transform group-hover:scale-110"
              />
              
              {/* Zoom Preview */}
              {showZoom && (
                <div className="absolute inset-0 bg-white rounded-2xl overflow-hidden">
                  <img 
                    src={images[selectedImageIndex]} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: `${imageZoom.x}% ${imageZoom.y}%`,
                      transform: 'scale(2)',
                    }}
                  />
                </div>
              )}

              {product.isPrescriptionRequired && (
                <div className="absolute top-4 left-4 bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <ShieldAlert size={16} /> Prescription Required
                </div>
              )}

              {/* Stock Badge */}
              <div className="absolute top-4 right-4">
                {product.inStock ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Check size={14} /> In Stock
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Gallery */}
            <div className="flex gap-4">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${
                    selectedImageIndex === idx ? 'border-red-600 shadow-md' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details Section */}
          <div>
            {/* Breadcrumb & Category */}
            <div className="mb-2 flex items-center gap-2">
              <span className="text-gray-500 text-sm">{product.brand}</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500 text-sm">{product.category}</span>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={i < Math.floor(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-gray-900">{averageRating}</span>
                <span className="text-gray-500">({totalReviews} reviews)</span>
              </div>
            </div>

            {/* Price & Availability */}
            <div className="flex items-center gap-6 mb-8">
              <div>
                <div className="text-sm text-gray-500 mb-1">Price</div>
                <div className="text-4xl font-extrabold text-gray-900">
                  GH₵ {product.price.toFixed(2)}
                </div>
              </div>
              {product.inStock ? (
                <div className="px-6 py-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="text-sm font-medium text-green-700 flex items-center gap-2">
                    <Check size={18} /> Available for delivery
                  </div>
                </div>
              ) : (
                <div className="px-6 py-3 bg-gray-100 border border-gray-200 rounded-xl">
                  <div className="text-sm font-medium text-gray-600">Currently Unavailable</div>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 text-base mb-8 leading-relaxed">
              {product.description}
            </p>

            {/* Prescription Alert */}
            {product.isPrescriptionRequired && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <strong className="text-red-800 block mb-1">Prescription Required</strong>
                  <span className="text-red-700 text-sm block mb-3">A valid prescription will be required during checkout for verification.</span>
                  <Link href="/upload-prescription" className="inline-flex items-center gap-1 font-medium text-red-600 hover:text-red-700 transition-colors">
                    Upload prescription now →
                  </Link>
                </div>
              </div>
            )}

            {/* Key Features/Benefits */}
            <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 p-6 rounded-xl">
              <div>
                <div className="font-semibold text-gray-900 text-sm mb-2">Dosage</div>
                <div className="text-gray-600 text-sm">{product.dosage}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm mb-2">Delivery</div>
                <div className="text-gray-600 text-sm">2-hour delivery in Accra</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm mb-2">Verified</div>
                <div className="text-gray-600 text-sm">Licensed pharmacists</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm mb-2">Secure</div>
                <div className="text-gray-600 text-sm">100% authentic products</div>
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium transition-colors"
                >
                  −
                </button>
                <div className="px-6 py-3 bg-white text-gray-900 font-bold flex items-center justify-center min-w-20">
                  {quantity}
                </div>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium transition-colors"
                >
                  +
                </button>
              </div>
              <AddToCartButton inStock={product.inStock} />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all border-2 flex items-center justify-center gap-2 ${
                  isWishlisted 
                    ? 'bg-red-50 border-red-300 text-red-600' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'
                }`}
              >
                <Heart size={20} className={isWishlisted ? 'fill-current' : ''} />
                {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
              </button>
              <button
                onClick={handleShare}
                className="py-3 px-4 rounded-lg font-medium border-2 border-gray-200 text-gray-600 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
              >
                <Share2 size={20} />
                Share
              </button>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-gray-200 bg-gray-50 p-4 rounded-xl flex items-start gap-3">
                <Truck className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Fast Delivery</h4>
                  <p className="text-sm text-gray-500 mt-1">Same-day delivery available in Accra metro.</p>
                </div>
              </div>
              <div className="border border-gray-200 bg-gray-50 p-4 rounded-xl flex items-start gap-3">
                <Check className="text-green-600 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Verified Quality</h4>
                  <p className="text-sm text-gray-500 mt-1">100% authentic & licensed products.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 pt-16 border-t border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
              <p className="text-gray-500 mt-1">Trusted by {totalReviews}+ customers</p>
            </div>
            <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Write a Review
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                    />
                  ))}
                </div>
                <p className="text-gray-700 font-medium mb-3">{review.text}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{review.author}</span>
                  <span className="text-xs text-gray-500">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="mt-16 pt-16 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {similarProducts.map(prod => (
                <Link
                  key={prod.id}
                  href={`/shop/${prod.id}`}
                  className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="bg-gray-50 h-48 flex items-center justify-center overflow-hidden">
                    <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-500 mb-1">{prod.category}</p>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">{prod.name}</h3>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-gray-900">GH₵ {prod.price.toFixed(2)}</span>
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">In Stock</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
