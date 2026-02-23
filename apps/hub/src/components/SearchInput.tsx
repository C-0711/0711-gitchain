"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/lib/hooks";

export default function SearchInput() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const { results, loading } = useSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        placeholder="Search containers... (Cmd+K)"
        className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
      />

      {focused && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-gray-50 border border-gray-300 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-gray-600 text-sm">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-gray-600 text-sm">No results found</div>
          ) : (
            results.slice(0, 8).map((container) => (
              <button
                key={container.id}
                onClick={() => {
                  router.push("/containers/" + encodeURIComponent(container.id));
                  setQuery("");
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-300 last:border-0"
              >
                <div className="font-medium">{container.meta.name}</div>
                <code className="text-xs text-gray-600">{container.id}</code>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
