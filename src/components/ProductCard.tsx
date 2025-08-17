// app/component/ProductCard.tsx
import React from "react";
import Image from "next/image";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";

interface ProductCardProps {
  product: Product;
  onAddToCart: () => void;
}

export default function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  const { cart } = useCartStore();
  const cartItem = cart.find((item) => item.id === product.id);
  const quantity = cartItem?.quantity || 0;
  const isOutOfStock = product.stock !== "" && product.stock <= 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div className="relative group">
      {/* Quantity Badge */}
      {quantity > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center z-10 rounded-full shadow-lg">
          {quantity}
        </div>
      )}

      <button
        onClick={onAddToCart}
        disabled={isOutOfStock}
        className={`w-full bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all text-left ${
          isOutOfStock 
            ? "opacity-60 cursor-not-allowed" 
            : "hover:border-blue-200 cursor-pointer"
        }`}
      >
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          <Image
            src={product.image || "/images/place-holder.png"}
            alt={product.name}
            fill
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
              isOutOfStock ? "grayscale" : ""
            }`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/images/place-holder.png";
            }}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-gray-500/70 flex items-center justify-center">
              <span className="text-white text-sm font-bold">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4">
          {/* Product Name */}
          <h3 className={`font-semibold text-gray-900 mb-1 text-sm sm:text-base line-clamp-2 ${
            isOutOfStock ? "text-gray-500" : ""
          }`}>
            {product.name}
          </h3>

          {/* Description - Under product name with smaller text */}
          {product.description && (
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Price Details */}
          <div className="space-y-1 text-xs sm:text-sm text-gray-600 mb-3">
            <div className="flex justify-between">
              <span>Price:</span>
              <span className="font-medium">{formatPrice(product.price)}</span>
            </div>
            <div className="flex justify-between">
              <span>Deposit:</span>
              <span className="font-medium">{formatPrice(product.deposit)}</span>
            </div>
            {product.stock !== "" && (
              <div className="flex justify-between">
                <span>Stock:</span>
                <span className="font-medium">
                  {typeof product.stock === 'string' && product.stock === "" ? "Unlimited" : product.stock}
                </span>
              </div>
            )}
          </div>

          {/* Add to Cart Button - Always visible on mobile, hover on desktop */}
          <div className="block">
            {!isOutOfStock ? (
              <div className="w-full py-2 px-4 bg-blue-600 text-white rounded-md font-medium text-center text-sm sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 touch-manipulation">
                Add to Cart
              </div>
            ) : (
              <div className="w-full py-2 px-4 bg-gray-300 text-gray-500 rounded-md font-medium text-center text-sm">
                Out of Stock
              </div>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
