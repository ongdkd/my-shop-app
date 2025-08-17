// app/component/Header.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Admin", href: "/admin" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "POS 1", href: "/pos/pos1" },
    { name: "POS 2", href: "/pos/pos2" },
  ];

  const adminItems = [
    { name: "Admin Dashboard", href: "/admin" },
    { name: "POS Terminals", href: "/admin/pos" },
    { name: "POS Products", href: "/admin/pos-products" },
    { name: "Orders", href: "/admin/orders" },
    { name: "Settings", href: "/admin/settings" },
  ];

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Left: Logo & Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-blue-600">
            MyShop
          </Link>

          <nav className="hidden lg:flex gap-4 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2 py-1 rounded ${
                  pathname === item.href
                    ? "text-blue-600 font-semibold bg-blue-100"
                    : "text-gray-600 hover:text-blue-500"
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Admin Dropdown */}
            <div className="relative group">
              <button className="px-2 py-1 rounded text-gray-600 hover:text-blue-500 flex items-center gap-1">
                Admin
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                {adminItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-2 text-sm hover:bg-gray-50 ${
                      pathname === item.href
                        ? "text-blue-600 font-semibold bg-blue-50"
                        : "text-gray-700"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
