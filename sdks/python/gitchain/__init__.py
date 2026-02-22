"""
GitChain Python SDK

Blockchain-verified context injection for AI agents.

Example:
    from gitchain import GitChainClient, inject

    # Quick inject
    context = inject(["0711:product:bosch:7736606982:v3"])
    print(context.formatted)

    # With client
    client = GitChainClient(api_key="...")
    context = client.inject(
        containers=["0711:product:bosch:7736606982:v3"],
        verify=True,
        format="markdown"
    )
"""

from .client import GitChainClient
from .inject import inject, inject_batch
from .types import Container, InjectedContext, Citation, ChainProof

__version__ = "0.1.0"
__all__ = [
    "GitChainClient",
    "inject",
    "inject_batch",
    "Container",
    "InjectedContext",
    "Citation",
    "ChainProof",
]

# Re-export integrations
from .langchain import get_gitchain_tools, GitChainRetriever
from .openai import GITCHAIN_FUNCTIONS, GitChainFunctionHandler, create_system_prompt
