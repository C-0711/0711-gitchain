"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { href: "/explore", label: "Explore" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/containers", label: "Containers" },
    { href: "/namespaces", label: "Namespaces" },
    { href: "/inject", label: "Inject" },
    { href: "/verify", label: "Verify" },
    { href: "/docs", label: "Docs" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">⛓️</span>
              <span className="text-xl font-bold text-white">GitChain</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    pathname === item.href || pathname.startsWith(item.href + "/")
                      ? "bg-gray-800 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search containers..."
                  className="w-64 bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 border border-gray-600 rounded px-1">
                  /
                </div>
              </div>
            </div>

            {/* Create dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                onBlur={() => setTimeout(() => setShowCreateMenu(false), 200)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-md text-sm font-medium transition"
              >
                <span>+</span>
                <span className="hidden sm:inline">New</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showCreateMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1">
                  <Link
                    href="/containers/new"
                    className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-700"
                  >
                    <span>📦</span>
                    <div>
                      <div className="font-medium">New container</div>
                      <div className="text-xs text-gray-400">Create a knowledge container</div>
                    </div>
                  </Link>
                  <Link
                    href="/namespaces/new"
                    className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-700"
                  >
                    <span>📁</span>
                    <div>
                      <div className="font-medium">New namespace</div>
                      <div className="text-xs text-gray-400">Organize your containers</div>
                    </div>
                  </Link>
                  <hr className="my-1 border-gray-700" />
                  <Link
                    href="/batch"
                    className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-700"
                  >
                    <span>📤</span>
                    <div>
                      <div className="font-medium">Batch import</div>
                      <div className="text-xs text-gray-400">Import multiple containers</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-800"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                  D
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1">
                  <div className="px-4 py-2 border-b border-gray-700">
                    <div className="font-medium">Demo User</div>
                    <div className="text-sm text-gray-400">demo@example.com</div>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-700"
                  >
                    <span>👤</span> Your profile
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-700"
                  >
                    <span>📊</span> Your dashboard
                  </Link>
                  <Link
                    href="/containers?owner=me"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-700"
                  >
                    <span>📦</span> Your containers
                  </Link>
                  <Link
                    href="/namespaces?owner=me"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-700"
                  >
                    <span>📁</span> Your namespaces
                  </Link>
                  <Link
                    href="/history"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-700"
                  >
                    <span>📜</span> Activity history
                  </Link>
                  <hr className="my-1 border-gray-700" />
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-700"
                  >
                    <span>⚙️</span> Settings
                  </Link>
                  <hr className="my-1 border-gray-700" />
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700">
                    <span>🚪</span> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu - simplified */}
      <div className="md:hidden border-t border-gray-800">
        <div className="flex overflow-x-auto px-2 py-2 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${
                pathname === item.href
                  ? "bg-gray-800 text-white"
                  : "text-gray-400"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
