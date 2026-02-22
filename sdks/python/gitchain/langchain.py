"""
LangChain integration for GitChain

Provides tools and retrievers for using GitChain with LangChain agents.
"""

from typing import List, Optional, Type
from .client import GitChainClient
from .types import InjectedContext

try:
    from langchain.tools import BaseTool
    from langchain.schema import Document
    from langchain.retrievers import BaseRetriever
    from pydantic import BaseModel, Field
    
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    BaseTool = object
    BaseRetriever = object
    BaseModel = object


def _check_langchain():
    if not LANGCHAIN_AVAILABLE:
        raise ImportError(
            "LangChain is required for this feature. "
            "Install with: pip install gitchain[langchain]"
        )


class InjectInput(BaseModel):
    """Input for GitChain inject tool."""
    container_ids: List[str] = Field(
        description="List of container IDs to inject (e.g., 0711:product:bosch:7736606982:v3)"
    )
    verify: bool = Field(
        default=True,
        description="Whether to verify blockchain proofs"
    )


class GitChainInjectTool(BaseTool):
    """LangChain tool for injecting verified context from GitChain."""
    
    name: str = "gitchain_inject"
    description: str = (
        "Inject verified context from GitChain containers. "
        "Use this when you need factual product data, specifications, "
        "or other verified information. Returns markdown-formatted context."
    )
    args_schema: Type[BaseModel] = InjectInput
    
    client: GitChainClient = None
    
    def __init__(self, client: Optional[GitChainClient] = None, **kwargs):
        _check_langchain()
        super().__init__(**kwargs)
        self.client = client or GitChainClient()
    
    def _run(self, container_ids: List[str], verify: bool = True) -> str:
        """Execute the inject tool."""
        context = self.client.inject(
            containers=container_ids,
            verify=verify,
            format="markdown"
        )
        
        result = context.formatted
        if context.verified:
            result += "\n\n---\n✅ All data verified on blockchain"
        else:
            result += "\n\n---\n⚠️ Some data could not be verified"
        
        return result
    
    async def _arun(self, container_ids: List[str], verify: bool = True) -> str:
        """Async version - just calls sync for now."""
        return self._run(container_ids, verify)


class VerifyInput(BaseModel):
    """Input for GitChain verify tool."""
    container_id: str = Field(
        description="Container ID or hash to verify"
    )


class GitChainVerifyTool(BaseTool):
    """LangChain tool for verifying GitChain containers."""
    
    name: str = "gitchain_verify"
    description: str = (
        "Verify that a GitChain container is blockchain-anchored. "
        "Returns verification status and blockchain proof details."
    )
    args_schema: Type[BaseModel] = VerifyInput
    
    client: GitChainClient = None
    
    def __init__(self, client: Optional[GitChainClient] = None, **kwargs):
        _check_langchain()
        super().__init__(**kwargs)
        self.client = client or GitChainClient()
    
    def _run(self, container_id: str) -> str:
        """Execute the verify tool."""
        result = self.client.verify(container_id)
        
        if result.get("verified"):
            chain = result.get("chain", {})
            return (
                f"✅ Container verified\n"
                f"Network: {chain.get(network, unknown)}\n"
                f"Batch: {chain.get(batchId, unknown)}\n"
                f"TX: {chain.get(txHash, pending)}"
            )
        else:
            return f"❌ Container not verified: {result.get(reason, unknown)}"
    
    async def _arun(self, container_id: str) -> str:
        """Async version."""
        return self._run(container_id)


class GitChainRetriever(BaseRetriever):
    """LangChain retriever that fetches verified context from GitChain."""
    
    client: GitChainClient = None
    container_ids: List[str] = []
    verify: bool = True
    
    def __init__(
        self,
        container_ids: List[str],
        client: Optional[GitChainClient] = None,
        verify: bool = True,
        **kwargs
    ):
        _check_langchain()
        super().__init__(**kwargs)
        self.client = client or GitChainClient()
        self.container_ids = container_ids
        self.verify = verify
    
    def _get_relevant_documents(self, query: str) -> List[Document]:
        """Retrieve documents from GitChain containers."""
        context = self.client.inject(
            containers=self.container_ids,
            verify=self.verify,
            format="json"
        )
        
        documents = []
        for container in context.containers:
            doc = Document(
                page_content=str(container.data),
                metadata={
                    "id": container.id,
                    "type": container.type,
                    "name": container.meta.name,
                    "version": container.version,
                    "verified": context.verified,
                }
            )
            documents.append(doc)
        
        return documents
    
    async def _aget_relevant_documents(self, query: str) -> List[Document]:
        """Async version."""
        return self._get_relevant_documents(query)


def get_gitchain_tools(client: Optional[GitChainClient] = None) -> List[BaseTool]:
    """Get all GitChain LangChain tools."""
    _check_langchain()
    client = client or GitChainClient()
    return [
        GitChainInjectTool(client=client),
        GitChainVerifyTool(client=client),
    ]
