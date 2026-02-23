import Link from "next/link";

export default function PythonSDKPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/docs" className="text-emerald-600 hover:underline text-sm">
          ← Back to Docs
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-4">Python SDK</h1>
        <p className="text-gray-600">
          Official Python SDK for GitChain.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Installation</h2>
          <div className="bg-white rounded-lg p-4">
            <pre className="text-sm"><code className="text-emerald-600">{`pip install gitchain
# or
poetry add gitchain`}</code></pre>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Quick Start</h2>
          <div className="bg-white rounded-lg p-4">
            <pre className="text-sm"><code className="text-emerald-600">{`from gitchain import GitChain

# Initialize client
client = GitChain("gc_live_your_api_key")

# Inject verified context
context = client.inject(
    containers=["0711:product:acme:widget-001:v1"],
    verify=True,
    format="markdown"
)

print(context.formatted)`}</code></pre>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">API Reference</h2>
          
          <h3 className="font-semibold mt-6 mb-2">client.inject()</h3>
          <p className="text-gray-600 mb-4">Inject verified context from containers.</p>
          <div className="bg-white rounded-lg p-4 mb-4">
            <pre className="text-sm"><code className="text-emerald-600">{`context = client.inject(
    containers: list[str],          # Container IDs
    verify: bool = True,            # Verify on blockchain
    format: str = "markdown",       # markdown | json | yaml
    include_citations: bool = True,
    max_tokens: int = None
)

# Returns InjectResult
context.containers      # List[Container]
context.formatted       # str
context.token_count     # int
context.verified        # bool
context.citations       # List[Citation]`}</code></pre>
          </div>

          <h3 className="font-semibold mt-6 mb-2">client.containers.list()</h3>
          <div className="bg-white rounded-lg p-4 mb-4">
            <pre className="text-sm"><code className="text-emerald-600">{`result = client.containers.list(
    type: str = None,
    namespace: str = None,
    limit: int = 20,
    offset: int = 0
)

for container in result.containers:
    print(container.id)`}</code></pre>
          </div>

          <h3 className="font-semibold mt-6 mb-2">client.containers.get()</h3>
          <div className="bg-white rounded-lg p-4 mb-4">
            <pre className="text-sm"><code className="text-emerald-600">{`container = client.containers.get(
    "0711:product:acme:widget-001:v1"
)

print(container.data)
print(container.meta)`}</code></pre>
          </div>

          <h3 className="font-semibold mt-6 mb-2">client.containers.create()</h3>
          <div className="bg-white rounded-lg p-4 mb-4">
            <pre className="text-sm"><code className="text-emerald-600">{`container = client.containers.create(
    type="product",
    namespace="acme",
    identifier="widget-002",
    data={"name": "Widget 2", "specs": {...}},
    meta={"description": "..."}
)

print(container.id)  # 0711:product:acme:widget-002:v1`}</code></pre>
          </div>

          <h3 className="font-semibold mt-6 mb-2">client.verify()</h3>
          <div className="bg-white rounded-lg p-4 mb-4">
            <pre className="text-sm"><code className="text-emerald-600">{`verification = client.verify(
    "0711:product:acme:widget-001:v1"
)

print(verification.verified)          # True
print(verification.chain.tx_hash)     # 0x...
print(verification.chain.block_number) # 18234567`}</code></pre>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Usage with LLMs</h2>
          <div className="bg-white rounded-lg p-4">
            <pre className="text-sm"><code className="text-emerald-600">{`from gitchain import GitChain
from openai import OpenAI

gitchain = GitChain("gc_live_...")
openai = OpenAI()

# Get verified context
context = gitchain.inject(
    containers=["0711:product:acme:widget-001:v1"],
    format="markdown"
)

# Use in ChatGPT
response = openai.chat.completions.create(
    model="gpt-4",
    messages=[
        {
            "role": "system",
            "content": f"You have access to verified product data:\\n\\n{context.formatted}"
        },
        {"role": "user", "content": "What are the product specifications?"}
    ]
)`}</code></pre>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Async Support</h2>
          <div className="bg-white rounded-lg p-4">
            <pre className="text-sm"><code className="text-emerald-600">{`from gitchain import AsyncGitChain
import asyncio

async def main():
    client = AsyncGitChain("gc_live_...")
    
    context = await client.inject(
        containers=["0711:product:acme:widget-001:v1"]
    )
    
    print(context.formatted)

asyncio.run(main())`}</code></pre>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Error Handling</h2>
          <div className="bg-white rounded-lg p-4">
            <pre className="text-sm"><code className="text-emerald-600">{`from gitchain import GitChain, GitChainError

try:
    context = client.inject(containers=[...])
except GitChainError as e:
    print(e.code)     # "CONTAINER_NOT_FOUND"
    print(e.message)  # "Container does not exist"`}</code></pre>
          </div>
        </section>

        <div className="mt-8 p-4 bg-blue-100/20 border border-blue-700 rounded-lg">
          <h3 className="font-semibold mb-2">📦 Package Info</h3>
          <p className="text-sm text-gray-600">
            <strong>PyPI:</strong> <code className="text-emerald-600">gitchain</code><br/>
            <strong>GitHub:</strong> <a href="https://github.com/C-0711/0711-gitchain" className="text-emerald-600 hover:underline">C-0711/0711-gitchain</a>
          </p>
        </div>
      </div>
    </div>
  );
}
