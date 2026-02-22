import Link from "next/link";
import type { Container } from "@/lib/api";

interface ContainerCardProps {
  container: Container;
  compact?: boolean;
}

const typeColors: Record<string, string> = {
  product: "bg-emerald-900/30 text-emerald-400 border-emerald-700",
  campaign: "bg-blue-900/30 text-blue-400 border-blue-700",
  project: "bg-purple-900/30 text-purple-400 border-purple-700",
  memory: "bg-orange-900/30 text-orange-400 border-orange-700",
  knowledge: "bg-yellow-900/30 text-yellow-400 border-yellow-700",
};

export default function ContainerCard({ container, compact }: ContainerCardProps) {
  return (
    <Link
      href={"/containers/" + encodeURIComponent(container.id)}
      className="block bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-emerald-500 transition"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={"px-2 py-0.5 text-xs rounded border " + (typeColors[container.type] || "bg-gray-700")}
            >
              {container.type}
            </span>
            {container.chain && (
              <span className="text-emerald-400 text-xs">✓ Verified</span>
            )}
          </div>
          <h3 className="font-semibold truncate">{container.meta.name}</h3>
          {!compact && (
            <code className="text-xs text-gray-500 block truncate">
              {container.id}
            </code>
          )}
        </div>
        <span className="text-gray-500 text-sm whitespace-nowrap">
          v{container.version}
        </span>
      </div>
    </Link>
  );
}
