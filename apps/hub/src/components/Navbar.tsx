"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchInput from "./SearchInput";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/containers", label: "Containers" },
  { href: "/namespaces", label: "Namespaces" },
  { href: "/inject", label: "Inject" },
  { href: "/verify", label: "Verify" },
  { href: "/docs", label: "Docs" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-gray-900/80 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-emerald-400">
              GitChain
            </Link>
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm transition ${
                    pathname === item.href || pathname.startsWith(item.href + "/")
                      ? "text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block w-64">
              <SearchInput />
            </div>
            <Link
              href="/settings"
              className="p-2 text-gray-400 hover:text-white"
              title="Settings"
            >
              ⚙️
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
