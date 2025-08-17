// app/component/CartPanel.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { XMarkIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline";
import { useCartStore } from "@/store/cartStore";

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartPanel({ isOpen, onClose }: CartPanelProps) {
  const { cart, updateQuantity, setPaymentType, getTotalPrice, clearCart } =
    useCartStore();

  const totalPrice = getTotalPrice();

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${
          isOpen ? "opacity-50" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Cart Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-96 bg-white shadow-xl transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">Shopping Cart</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <XMarkIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 p-4 rounded-lg border"
                  >
                    <div className="flex items-start gap-4">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/images/place-holder.png";
                          }}
                        />
                      )}

                      {/* Product Details - Left Side */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {item.name}
                        </h3>
                        <p className="text-base text-gray-600 mb-1">
                          $
                          {item.paymentType === "deposit"
                            ? item.deposit.toFixed(2)
                            : item.price.toFixed(2)}{" "}
                          each
                        </p>
                        {/* Dynamic Total Price */}
                        <p className="text-sm font-medium text-gray-800">
                          Total: $
                          {item.paymentType === "deposit"
                            ? (item.deposit * item.quantity).toFixed(2)
                            : (item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Controls - Right Side */}
                      <div className="flex flex-col items-end gap-3 flex-shrink-0">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 bg-white rounded-lg border">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
                          >
                            <MinusIcon className="h-4 w-4 text-gray-600" />
                          </button>
                          <span className="px-3 py-2 min-w-12 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors"
                          >
                            <PlusIcon className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>

                        {/* Deposit Checkbox */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.paymentType === "deposit"}
                            onChange={(e) =>
                              setPaymentType(
                                item.id,
                                e.target.checked ? "deposit" : "full"
                              )
                            }
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm text-gray-600 whitespace-nowrap">
                            Deposit
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold text-blue-600">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>

              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Proceed to Checkout
                </Link>

                <button
                  onClick={() => {
                    clearCart();
                    onClose();
                  }}
                  className="block w-full bg-gray-200 text-gray-700 text-center py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
