# GitChain Python SDK

Blockchain-verified context injection for AI agents.

## Installation

```bash
pip install gitchain
```

## Quick Start

```python
from gitchain import inject

# Inject verified context
context = inject(["0711:product:bosch:7736606982:v3"])

# Use in your LLM prompt
print(context.formatted)
print(f"Token count: {context.token_count}")
print(f"Verified: {context.verified}")
```

## With OpenAI

```python
from gitchain import inject
import openai

# Get verified product context
context = inject(["0711:product:bosch:7736606982:v3"])

# Use in ChatGPT
response = openai.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": f"Verified context:\n{context.formatted}"},
        {"role": "user", "content": "What is the COP of this heat pump?"}
    ]
)
```

## With LangChain

```python
from gitchain import GitChainClient
from langchain.tools import tool

client = GitChainClient(api_key="...")

@tool
def inject_context(container_ids: list[str]) -> str:
    """Inject verified context from GitChain containers."""
    context = client.inject(containers=container_ids)
    return context.formatted
```

## API Reference

### inject()

```python
from gitchain import inject

context = inject(
    containers=["0711:product:bosch:7736606982:v3"],
    verify=True,           # Verify blockchain proofs
    format="markdown",     # Output format: markdown, json, yaml
    include_citations=True,  # Include source citations
    max_tokens=4000,       # Truncate if needed
)
```

### GitChainClient

```python
from gitchain import GitChainClient

client = GitChainClient(
    api_url="https://api.gitchain.0711.io",
    api_key="your-api-key",
)

# Inject context
context = client.inject(["0711:product:bosch:7736606982:v3"])

# Get single container
container = client.get_container("0711:product:bosch:7736606982:v3")

# Verify
result = client.verify("0711:product:bosch:7736606982:v3")
```

## Container IDs

Format: `0711:{type}:{namespace}:{identifier}:{version}`

Examples:
- `0711:product:bosch:7736606982:v3` - Specific version
- `0711:product:bosch:7736606982:latest` - Latest version
- `0711:campaign:0711:q1-launch:v2` - Campaign
- `0711:knowledge:etim:EC012034:v1` - Domain knowledge

## License

MIT
