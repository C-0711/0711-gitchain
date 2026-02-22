"""
OpenAI integration for GitChain

Provides function definitions and helpers for using GitChain with OpenAI API.
"""

from typing import List, Optional, Dict, Any
from .client import GitChainClient
from .types import InjectedContext


# OpenAI function definitions for function calling
GITCHAIN_FUNCTIONS = [
    {
        "name": "gitchain_inject",
        "description": "Inject verified context from GitChain containers into the conversation. Use when you need factual product data, specifications, or other verified information.",
        "parameters": {
            "type": "object",
            "properties": {
                "container_ids": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of container IDs (e.g., 0711:product:bosch:7736606982:v3)"
                },
                "verify": {
                    "type": "boolean",
                    "description": "Whether to verify blockchain proofs",
                    "default": True
                }
            },
            "required": ["container_ids"]
        }
    },
    {
        "name": "gitchain_verify",
        "description": "Verify that a container or hash is blockchain-anchored.",
        "parameters": {
            "type": "object",
            "properties": {
                "container_id": {
                    "type": "string",
                    "description": "Container ID or content hash to verify"
                }
            },
            "required": ["container_id"]
        }
    }
]


class GitChainFunctionHandler:
    """Handler for GitChain OpenAI function calls."""
    
    def __init__(self, client: Optional[GitChainClient] = None):
        self.client = client or GitChainClient()
    
    def handle_function_call(
        self,
        function_name: str,
        arguments: Dict[str, Any]
    ) -> str:
        """Handle a function call from OpenAI."""
        if function_name == "gitchain_inject":
            return self._handle_inject(arguments)
        elif function_name == "gitchain_verify":
            return self._handle_verify(arguments)
        else:
            return f"Unknown function: {function_name}"
    
    def _handle_inject(self, arguments: Dict[str, Any]) -> str:
        """Handle gitchain_inject function call."""
        container_ids = arguments.get("container_ids", [])
        verify = arguments.get("verify", True)
        
        context = self.client.inject(
            containers=container_ids,
            verify=verify,
            format="markdown"
        )
        
        return context.formatted
    
    def _handle_verify(self, arguments: Dict[str, Any]) -> str:
        """Handle gitchain_verify function call."""
        container_id = arguments.get("container_id", "")
        
        result = self.client.verify(container_id)
        
        if result.get("verified"):
            chain = result.get("chain", {})
            return (
                f"Verified: Yes\n"
                f"Network: {chain.get(network)}\n"
                f"Batch: {chain.get(batchId)}\n"
                f"Transaction: {chain.get(txHash, pending)}"
            )
        else:
            return f"Verified: No\nReason: {result.get(reason, unknown)}"


def create_system_prompt(
    container_ids: List[str],
    client: Optional[GitChainClient] = None,
    verify: bool = True
) -> str:
    """
    Create a system prompt with injected GitChain context.
    
    Example:
        prompt = create_system_prompt(["0711:product:bosch:7736606982:v3"])
        
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": "What is the COP?"}
            ]
        )
    """
    client = client or GitChainClient()
    
    context = client.inject(
        containers=container_ids,
        verify=verify,
        format="markdown"
    )
    
    prompt = (
        "You have access to the following verified product data:\n\n"
        f"{context.formatted}\n\n"
    )
    
    if context.verified:
        prompt += "All data above is verified on blockchain and can be cited.\n"
    else:
        prompt += "Note: Some data could not be verified.\n"
    
    return prompt
