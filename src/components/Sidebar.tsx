// app/component/Sidebar.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useCartStore } from "@/store/cartStore";
import { getActivePosTerminals } from "@/lib/posData";
import { PosTerminal } from "@/types";

export default function Sidebar({
  open,
  setOpen,
  showCart,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  showCart: boolean;
}) {
  const pathname = usePathname();
  const { userName } = useCartStore();
  const [activePosTerminals, setActivePosTerminals] = useState<PosTerminal[]>([]);

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  useEffect(() => {
    // Load active POS terminals
    const loadActivePosTerminals = () => {
      const activePos = getActivePosTerminals();
      setActivePosTerminals(activePos);
    };

    loadActivePosTerminals();

    // Listen for POS updates
    const handlePosUpdate = () => {
      loadActivePosTerminals();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pos-terminals-data") {
        loadActivePosTerminals();
      }
    };

    window.addEventListener("posTerminalUpdated", handlePosUpdate);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", loadActivePosTerminals);

    return () => {
      window.removeEventListener("posTerminalUpdated", handlePosUpdate);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", loadActivePosTerminals);
    };
  }, []);

  return (
    <>
      {/* Slide-in toggle button - Only show when closed */}
      {!showCart && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-1/4 -translate-y-1/2 left-0 z-[60] bg-white p-3 sm:p-3 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 touch-manipulation rounded-r-xl hover:left-1 sm:hover:left-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Bars3Icon className="h-5 w-5 text-gray-700" />
        </button>
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-2xl z-50 transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          w-72 sm:w-64 p-4 pt-6 overflow-y-auto`}
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        {/* Close button for mobile */}
        <div className="flex justify-end mb-4 sm:hidden">
          <button
            onClick={() => setOpen(false)}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <XMarkIcon className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Desktop close button - only show when sidebar is open */}
        {open && (
          <button
            onClick={() => setOpen(false)}
            className="hidden sm:block fixed top-1/4 -translate-y-1/2 left-64 z-[60] bg-white p-3 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 touch-manipulation rounded-r-xl rounded-l-none"
          >
            <XMarkIcon className="h-5 w-5 text-gray-700" />
          </button>
        )}

        {/* Sidebar Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h2 className="text-lg sm:text-xl font-bold text-blue-600">
              Kagayaku Shop
            </h2>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm">
            Point of Sale System
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Navigation
          </div>
          
          {/* POS Selection */}
          <Link
            href="/pos"
            className={`px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 touch-manipulation min-h-[44px] ${
              pathname === "/pos"
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                pathname === "/pos" ? "bg-white" : "bg-gray-400"
              }`}
            ></div>
            🏪 Select POS Terminal
          </Link>



          {/* Active POS Terminals */}
          {activePosTerminals.length > 0 && (
            <>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">
                Active Terminals ({activePosTerminals.length})
              </div>
              {activePosTerminals.map((pos) => (
                <Link
                  key={pos.id}
                  href={`/pos/${pos.id}`}
                  className={`px-3 py-3 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 touch-manipulation min-h-[44px] ${
                    pathname === `/pos/${pos.id}`
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ 
                      backgroundColor: pathname === `/pos/${pos.id}` ? "white" : pos.themeColor 
                    }}
                  ></div>
                  <span className="flex-1 truncate">{pos.name}</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full" title="Online" />
                </Link>
              ))}
            </>
          )}

          {/* User Info */}
          {userName && (
            <>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">
                Current User
              </div>
              <div className="px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-700 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                {userName}
              </div>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
