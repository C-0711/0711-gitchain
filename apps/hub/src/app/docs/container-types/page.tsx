import Link from "next/link";

export default function ContainerTypesPage() {
  const types = [
    {
      type: "product",
      icon: "📦",
      color: "emerald",
      description: "Physical or digital products with specifications, features, and documentation.",
      examples: ["Electronics", "Industrial equipment", "Software products", "Consumer goods"],
      fields: ["name", "description", "specs", "features", "media", "documents", "certifications"],
    },
    {
      type: "campaign",
      icon: "📢",
      color: "blue",
      description: "Marketing campaigns, briefings, and promotional content with workflows.",
      examples: ["Product launches", "Ad campaigns", "Social media", "Email marketing"],
      fields: ["name", "objective", "target_audience", "assets", "timeline", "budget", "kpis"],
    },
    {
      type: "project",
      icon: "📋",
      color: "purple",
      description: "Projects, documentation, and collaborative work with full history.",
      examples: ["Software projects", "Research", "Documentation", "Reports"],
      fields: ["name", "description", "files", "tasks", "milestones", "team", "status"],
    },
    {
      type: "memory",
      icon: "🧠",
      color: "orange",
      description: "AI agent memories, context, and learned information for persistence.",
      examples: ["Agent context", "Conversation history", "Learned preferences", "User profiles"],
      fields: ["context", "facts", "preferences", "history", "associations"],
    },
    {
      type: "knowledge",
      icon: "📚",
      color: "yellow",
      description: "Knowledge bases, guides, and reference documentation.",
      examples: ["User guides", "FAQs", "Training data", "Reference docs"],
      fields: ["title", "content", "sections", "references", "tags", "related"],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/docs" className="text-emerald-600 hover:underline text-sm">
          ← Back to Docs
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-4">Container Types</h1>
        <p className="text-gray-600">
          GitChain supports five container types, each designed for specific use cases.
        </p>
      </div>

      <div className="space-y-8">
        {types.map((t) => (
          <div key={t.type} className={`bg-gray-50/50 border border-gray-300 rounded-lg p-6`}>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl">{t.icon}</span>
              <div>
                <h2 className="text-xl font-semibold capitalize">{t.type}</h2>
                <code className="text-sm text-gray-600">0711:{t.type}:namespace:id:v1</code>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{t.description}</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Example Use Cases</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {t.examples.map((ex) => (
                    <li key={ex}>• {ex}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Common Fields</h3>
                <div className="flex flex-wrap gap-1">
                  {t.fields.map((field) => (
                    <span key={field} className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-gray-50/30 border border-gray-300 rounded-lg">
        <h2 className="font-semibold mb-4">Container ID Format</h2>
        <code className="text-emerald-600 text-lg">0711:{"{type}"}:{"{namespace}"}:{"{identifier}"}:{"{version}"}</code>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">type</span>
            <p>product, campaign, project, memory, knowledge</p>
          </div>
          <div>
            <span className="text-gray-600">namespace</span>
            <p>Your organization or project name</p>
          </div>
          <div>
            <span className="text-gray-600">identifier</span>
            <p>Unique ID within namespace</p>
          </div>
          <div>
            <span className="text-gray-600">version</span>
            <p>v1, v2, v3... or "latest"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
