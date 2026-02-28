"use client";

/**
 * Command Palette (Cmd+K / Ctrl+K)
 * Global search and quick actions for the Hub.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Package,
  Users,
  Settings,
  Plus,
  LogOut,
  Home,
  Folder,
  FileText,
  Command,
  ArrowRight,
} from "lucide-react";

interface SearchResult {
  id: string;
  type: "container" | "organization" | "user" | "action";
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

const quickActions: SearchResult[] = [
  {
    id: "new-container",
    type: "action",
    title: "Create new container",
    subtitle: "Start a new project",
    icon: <Plus className="w-4 h-4" />,
    action: () => {},
  },
  {
    id: "go-dashboard",
    type: "action",
    title: "Go to Dashboard",
    icon: <Home className="w-4 h-4" />,
    action: () => {},
  },
  {
    id: "go-containers",
    type: "action",
    title: "Browse Containers",
    icon: <Folder className="w-4 h-4" />,
    action: () => {},
  },
  {
    id: "go-settings",
    type: "action",
    title: "Settings",
    subtitle: "Manage your account",
    icon: <Settings className="w-4 h-4" />,
    action: () => {},
  },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Initialize quick actions with proper navigation
  const getActions = useCallback((): SearchResult[] => {
    return [
      {
        id: "new-container",
        type: "action",
        title: "Create new container",
        subtitle: "Start a new project",
        icon: <Plus className="w-4 h-4" />,
        action: () => {
          router.push("/containers/new");
          setIsOpen(false);
        },
      },
      {
        id: "go-dashboard",
        type: "action",
        title: "Go to Dashboard",
        icon: <Home className="w-4 h-4" />,
        action: () => {
          router.push("/dashboard");
          setIsOpen(false);
        },
      },
      {
        id: "go-containers",
        type: "action",
        title: "Browse Containers",
        icon: <Folder className="w-4 h-4" />,
        action: () => {
          router.push("/containers");
          setIsOpen(false);
        },
      },
      {
        id: "go-explore",
        type: "action",
        title: "Explore",
        subtitle: "Discover popular containers",
        icon: <Search className="w-4 h-4" />,
        action: () => {
          router.push("/explore");
          setIsOpen(false);
        },
      },
      {
        id: "go-orgs",
        type: "action",
        title: "Organizations",
        icon: <Users className="w-4 h-4" />,
        action: () => {
          router.push("/orgs");
          setIsOpen(false);
        },
      },
      {
        id: "go-settings",
        type: "action",
        title: "Settings",
        subtitle: "Manage your account",
        icon: <Settings className="w-4 h-4" />,
        action: () => {
          router.push("/settings");
          setIsOpen(false);
        },
      },
    ];
  }, [router]);

  // Handle keyboard shortcut to open/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setSelectedIndex(0);
      setResults(getActions());
    }
  }, [isOpen, getActions]);

  // Search when query changes
  useEffect(() => {
    const searchContainers = async () => {
      if (!query.trim()) {
        setResults(getActions());
        return;
      }

      setIsSearching(true);

      // Filter quick actions
      const filteredActions = getActions().filter(
        (action) =>
          action.title.toLowerCase().includes(query.toLowerCase()) ||
          action.subtitle?.toLowerCase().includes(query.toLowerCase())
      );

      // Search containers via API
      try {
        const res = await fetch(`/api/containers?search=${encodeURIComponent(query)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          const containerResults: SearchResult[] = (data.containers || []).map(
            (container: { id: string; name: string; description?: string }) => ({
              id: `container-${container.id}`,
              type: "container" as const,
              title: container.name,
              subtitle: container.description || "Container",
              icon: <Package className="w-4 h-4" />,
              action: () => {
                router.push(`/containers/${container.id}`);
                setIsOpen(false);
              },
            })
          );

          setResults([...filteredActions, ...containerResults]);
        } else {
          setResults(filteredActions);
        }
      } catch {
        setResults(filteredActions);
      }

      setIsSearching(false);
    };

    const debounceTimer = setTimeout(searchContainers, 200);
    return () => clearTimeout(debounceTimer);
  }, [query, router, getActions]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Command palette */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search containers, actions, and more..."
              className="flex-1 text-base outline-none placeholder:text-gray-400"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto py-2">
            {isSearching && (
              <div className="px-4 py-8 text-center text-gray-500">
                <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2" />
                Searching...
              </div>
            )}

            {!isSearching && results.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No results found for "{query}"
              </div>
            )}

            {!isSearching &&
              results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={result.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-emerald-50 text-emerald-900"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 ${
                      index === selectedIndex ? "text-emerald-600" : "text-gray-400"
                    }`}
                  >
                    {result.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-xs text-gray-500 truncate">{result.subtitle}</div>
                    )}
                  </div>
                  {index === selectedIndex && (
                    <ArrowRight className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  )}
                </button>
              ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">↵</kbd>
              to select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">esc</kbd>
              to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Keyboard shortcut hint component to show in the UI.
 */
export function CommandPaletteHint() {
  return (
    <button
      onClick={() => {
        // Dispatch keyboard event to open command palette
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true })
        );
      }}
      className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
    >
      <Search className="w-4 h-4" />
      <span>Search</span>
      <kbd className="ml-2 flex items-center gap-0.5 text-xs">
        <Command className="w-3 h-3" />
        <span>K</span>
      </kbd>
    </button>
  );
}
