// app/order-complete/page.tsx
"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useCartStore } from "@/store/cartStore";
import { useOrderStore } from "@/store/orderStore";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircleIcon,
  DocumentArrowDownIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import domtoimage from "dom-to-image";
import { CartItem } from "@/types";

interface OrderData {
  orderId: string;
  items: CartItem[];
  total: number;
  timestamp: Date;
  posId: string;
}

function OrderCompleteContent() {
  const { userName } = useCartStore();
  const { getOrderById } = useOrderStore();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    const posId = searchParams.get("posId") || "pos1";

    if (!orderId) {
      router.push(`/pos/${posId}`);
      return;
    }

    // Get order from store
    const order = getOrderById(orderId);

    if (order) {
      const orderData: OrderData = {
        orderId: order.id,
        items: order.items,
        total: order.totalAmount,
        timestamp: new Date(order.timestamp),
        posId: order.posId,
      };
      setOrderData(orderData);
    } else {
      // Order not found, redirect
      router.push(`/pos/${posId}`);
    }
  }, [searchParams, router, getOrderById]);

  const generateReceiptImage = async () => {
    if (!receiptRef.current || !orderData) return;

    setIsGeneratingImage(true);
    try {
      const node = receiptRef.current;

      // Get visual display size
      const rect = node.getBoundingClientRect();
      const scale = window.devicePixelRatio || 2; // mobile usually 2x or 3x

      const blob = await domtoimage.toBlob(node, {
        width: rect.width * scale,
        height: rect.height * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: rect.width + "px",
          height: rect.height + "px",
        },
        bgcolor: "#ffffff", // ensure white background for dark mode
      });

      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `receipt-${orderData.orderId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error generating receipt image:", error);
      alert("Failed to generate receipt image");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing order...</p>
        </div>
      </div>
    );
  }

  // If order has no items and no orderId in URL, show error state
  if (orderData.items.length === 0 && !searchParams.get("orderId")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              No Order Found
            </h1>
            <p className="text-gray-600 mb-6">
              There are no items in your order.
            </p>
            <Link
              href={`/pos/${orderData.posId}`}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start New Order
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-content,
          .receipt-content * {
            visibility: visible;
          }
          .receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24 sm:pb-8">
        {/* Success Header */}
        <div className="text-center mb-6 sm:mb-8 no-print">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <CheckCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Order Complete!
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Your order has been successfully processed
          </p>
        </div>

        {/* Receipt */}
        <div
          ref={receiptRef}
          className="receipt-content bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 mb-6"
        >
          {/* Receipt Header */}
          <div className="text-center border-b border-gray-200 pb-4 sm:pb-6 mb-4 sm:mb-6">
            <p className="text-gray-600 mb-2 text-sm sm:text-base">
              {userName ? `Order by ${userName}` : "Thank you for your order"}
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              ORDER RECEIPT
            </h2>
            <div className="text-base sm:text-lg font-semibold text-blue-600 mb-1">
              Order #{orderData.orderId}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              {orderData.timestamp.toLocaleDateString()} •{" "}
              {orderData.timestamp.toLocaleTimeString()}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">
              Terminal: {orderData.posId.toUpperCase()}
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Items Ordered
            </h3>
            <div className="space-y-4">
              {orderData.items.map((item, index) => {
                const itemTotal =
                  item.paymentType === "deposit"
                    ? item.price * item.quantity * 0.3
                    : item.price * item.quantity;

                return (
                  <div
                    key={index}
                    className="flex justify-between items-start py-3 border-b border-gray-100"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded border"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/images/place-holder.png";
                            }}
                          />
                        )}
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {item.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            ${item.price.toFixed(2)} × {item.quantity}
                          </p>
                          {item.paymentType === "deposit" && (
                            <p className="text-sm text-orange-600 font-medium">
                              Deposit Payment
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-800">
                        ${itemTotal.toFixed(2)}
                      </div>
                      {item.paymentType === "deposit" && (
                        <div className="text-xs text-gray-500">
                          Full: ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Total */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center text-xl font-bold text-gray-800">
              <span>Total Amount:</span>
              <span className="text-blue-600">
                ${orderData.total.toFixed(2)}
              </span>
            </div>

            {/* Additional Pricing Format */}
            <div className="mt-4 text-right">
              {(() => {
                const fullPrice = orderData.items.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                );
                const deliveryFee = 40;
                const remainingAmount = fullPrice - orderData.total;
                const remainingAndDeliverlyFeeAmount =
                  remainingAmount + deliveryFee;

                return (
                  <div>
                    <div className="text-xs text-gray-500">
                      Full: ${fullPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Remaining + Delivery Fee: ${remainingAmount.toFixed(2)} +
                      ${deliveryFee} = ${remainingAndDeliverlyFeeAmount}
                    </div>
                  </div>
                );
              })()}
            </div>

            {orderData.items.some((item) => item.paymentType === "deposit") && (
              <p className="text-sm text-orange-600 text-center mt-2">
                * Deposit payments require balance settlement on delivery
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-gray-600 mb-2">Thank you for your purchase!</p>
            <p className="text-sm text-gray-500">
              For any questions, please contact us with your order number.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="no-print fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={generateReceiptImage}
              disabled={isGeneratingImage}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation min-h-[44px] text-sm sm:text-base"
            >
              <DocumentArrowDownIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              {isGeneratingImage ? "Generating..." : "Download Receipt"}
            </button>

            <Link
              href={`/pos/${orderData.posId}`}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors font-medium flex items-center justify-center gap-2 touch-manipulation min-h-[44px] text-sm sm:text-base"
            >
              <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              New Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function OrderCompleteLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading order details...</p>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function OrderCompletePage() {
  return (
    <Suspense fallback={<OrderCompleteLoading />}>
      <OrderCompleteContent />
    </Suspense>
  );
}
