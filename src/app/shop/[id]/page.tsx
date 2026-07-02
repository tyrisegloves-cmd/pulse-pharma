import { MOCK_PRODUCTS } from "@/lib/data";
import { ShieldAlert, Check, Truck, Info, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";

export default function ProductDetail({ params }: { params: { id: string } }) {
  const product = MOCK_PRODUCTS.find(p => p.id === params.id);
  
  if (!product) {
    notFound();
  }

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link href="/shop" className="inline-flex items-center gap-2 text-gray-500 hover:text-red-600 mb-8 text-sm font-medium transition-colors">
          <ArrowLeft size={16} /> Back to Shop
        </Link>

        <div className="flex flex-col md:flex-row gap-12">
          
          {/* Image Gallery */}
          <div className="w-full md:w-1/2">
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 flex items-center justify-center relative">
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="max-w-full h-auto max-h-[400px] object-contain rounded-xl"
              />
              {product.isPrescriptionRequired && (
                <div className="absolute top-4 left-4 bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <ShieldAlert size={16} /> Prescription Required
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="w-full md:w-1/2">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-gray-500 text-sm">{product.brand}</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500 text-sm">{product.category}</span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="text-3xl font-extrabold text-gray-900">
                GH₵ {product.price.toFixed(2)}
              </div>
              {product.inStock ? (
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Check size={14} /> In Stock
                </span>
              ) : (
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                  Out of Stock
                </span>
              )}
            </div>

            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              {product.description}
            </p>

            {product.isPrescriptionRequired && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-8 flex items-start gap-3 text-sm">
                <ShieldAlert className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <strong className="text-red-800 block mb-1">Prescription Required</strong>
                  <span className="text-red-700 block">You will need to upload a valid prescription during checkout. A pharmacist will verify it before dispensing.</span>
                  <Link href="/upload-prescription" className="inline-block mt-2 font-medium text-red-600 hover:underline">
                    Upload prescription now &rarr;
                  </Link>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-10">
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium transition-colors">-</button>
                <div className="px-4 py-3 bg-white text-gray-900 font-medium flex items-center justify-center w-12 border-x border-gray-200">1</div>
                <button className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium transition-colors">+</button>
              </div>
              <AddToCartButton inStock={product.inStock} />
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-gray-100 bg-gray-50 p-4 rounded-xl flex items-start gap-3">
                <Info className="text-gray-400 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Dosage Instructions</h4>
                  <p className="text-sm text-gray-500 mt-1">{product.dosage}</p>
                </div>
              </div>
              <div className="border border-gray-100 bg-gray-50 p-4 rounded-xl flex items-start gap-3">
                <Truck className="text-gray-400 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">Delivery Info</h4>
                  <p className="text-sm text-gray-500 mt-1">Eligible for 2-hour delivery in Accra metro area.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}