"""
Convenience functions for context injection
"""

from typing import List, Optional

from .client import get_client
from .types import InjectedContext


def inject(
    containers: List[str],
    verify: bool = True,
    format: str = "markdown",
    include_citations: bool = True,
    max_tokens: Optional[int] = None,
    api_url: str = "https://api.gitchain.0711.io",
    api_key: Optional[str] = None,
) -> InjectedContext:
    """
    Inject verified context from containers

    Quick convenience function that creates a client and calls inject.

    Example:
        from gitchain import inject

        context = inject(["0711:product:bosch:7736606982:v3"])
        print(context.formatted)  # Use in LLM prompt

    Args:
        containers: List of container IDs
        verify: Verify blockchain proofs (default: True)
        format: Output format (markdown, json, yaml)
        include_citations: Include source citations (default: True)
        max_tokens: Maximum tokens for output
        api_url: API endpoint
        api_key: API key for authentication

    Returns:
        InjectedContext with verified data
    """
    client = get_client(api_url=api_url, api_key=api_key)
    return client.inject(
        containers=containers,
        verify=verify,
        format=format,
        include_citations=include_citations,
        max_tokens=max_tokens,
    )


def inject_batch(
    container_lists: List[List[str]],
    verify: bool = True,
    format: str = "markdown",
    api_url: str = "https://api.gitchain.0711.io",
    api_key: Optional[str] = None,
) -> List[InjectedContext]:
    """
    Inject multiple container sets in parallel

    Example:
        contexts = inject_batch([
            ["0711:product:bosch:123"],
            ["0711:product:bosch:456"],
        ])

    Args:
        container_lists: List of container ID lists
        verify: Verify blockchain proofs
        format: Output format
        api_url: API endpoint
        api_key: API key

    Returns:
        List of InjectedContext results
    """
    client = get_client(api_url=api_url, api_key=api_key)
    return [
        client.inject(containers=containers, verify=verify, format=format)
        for containers in container_lists
    ]
