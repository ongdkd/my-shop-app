"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { useOrderStore } from "@/store/orderStore";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function CheckoutPage() {
  const { cart, userName, userPhone, currentPosId, clearCart } = useCartStore();
  const { addOrder } = useOrderStore();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const totalPrice = cart.reduce((sum, item) => {
    const price = item.paymentType === "deposit" 
      ? item.deposit * item.quantity 
      : item.price * item.quantity;
    return sum + price;
  }, 0);

  const depositAmount = cart.reduce((sum, item) => {
    return item.paymentType === "deposit" 
      ? sum + (item.deposit * item.quantity)
      : sum;
  }, 0);

  const handleCompleteOrder = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    
    try {
      const orderId = addOrder({
        userName,
        posId: currentPosId || "pos1",
        items: cart,
        totalAmount: totalPrice,
        depositAmount,
        status: "completed"
      });

      clearCart();
      router.push(`/order-complete?orderId=${orderId}&posId=${currentPosId || "pos1"}`);
    } catch (error) {
      console.error("Error processing order:", error);
      alert("Failed to process order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Cart is Empty</h1>
          <p className="text-gray-600 mb-6">Add some items to your cart first</p>
          <Link
            href={currentPosId ? `/pos/${currentPosId}` : "/pos"}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-8">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link
            href={currentPosId ? `/pos/${currentPosId}` : "/pos"}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Checkout</h1>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Customer Information</h2>
          <div className="space-y-2 text-sm sm:text-base">
            <p><span className="font-medium">Name:</span> {userName}</p>
            <p><span className="font-medium">Phone:</span> {userPhone}</p>
            <p><span className="font-medium">Terminal:</span> {currentPosId?.toUpperCase()}</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Order Summary</h2>
          <div className="space-y-3 sm:space-y-4">
            {cart.map((item) => {
              const itemTotal = item.paymentType === "deposit"
                ? item.deposit * item.quantity
                : item.price * item.quantity;

              return (
                <div key={item.id} className="flex items-start gap-3 sm:gap-4 py-3 border-b border-gray-100 last:border-b-0">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded border flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/place-holder.png";
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 text-sm sm:text-base truncate">{item.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      ${item.paymentType === "deposit" ? item.deposit.toFixed(2) : item.price.toFixed(2)} × {item.quantity}
                    </p>
                    {item.paymentType === "deposit" && (
                      <p className="text-xs sm:text-sm text-orange-600 font-medium mt-1">Deposit Payment</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold text-gray-800 text-sm sm:text-base">
                      ${itemTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Total */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="space-y-2">
            <div className="flex justify-between text-base sm:text-lg">
              <span>Subtotal:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            {depositAmount > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Deposit Amount:</span>
                <span>${depositAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between text-lg sm:text-xl font-bold text-blue-600">
              <span>Total:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Complete Order Button - Fixed on mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:p-0 sm:bg-transparent sm:border-t-0">
          <button
            onClick={handleCompleteOrder}
            disabled={isProcessing}
            className="w-full bg-green-600 text-white py-3 sm:py-4 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors font-medium text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          >
            {isProcessing ? "Processing..." : "Complete Order"}
          </button>
        </div>
      </div>
    </div>
  );
}