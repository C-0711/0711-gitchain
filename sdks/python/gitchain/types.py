"""
Type definitions for GitChain Python SDK
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime


@dataclass
class Citation:
    """Source citation for a data point"""
    document_id: str
    page: Optional[int] = None
    quote: Optional[str] = None
    confidence: str = "confirmed"  # confirmed, likely, inferred


@dataclass
class ChainProof:
    """Blockchain verification proof"""
    container_id: str
    verified: bool
    network: Optional[str] = None
    batch_id: Optional[int] = None
    tx_hash: Optional[str] = None
    block_number: Optional[int] = None
    verified_at: Optional[str] = None
    reason: Optional[str] = None


@dataclass
class ContainerMeta:
    """Container metadata"""
    name: str
    created_at: str
    updated_at: str
    author: str
    description: Optional[str] = None
    tags: List[str] = field(default_factory=list)


@dataclass
class Container:
    """GitChain container"""
    id: str
    type: str
    namespace: str
    identifier: str
    version: int
    meta: ContainerMeta
    data: Dict[str, Any]
    citations: List[Citation] = field(default_factory=list)
    chain: Optional[Dict[str, Any]] = None
    git: Optional[Dict[str, Any]] = None

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Container":
        """Create Container from API response dict"""
        meta = ContainerMeta(
            name=d["meta"]["name"],
            created_at=d["meta"]["createdAt"],
            updated_at=d["meta"]["updatedAt"],
            author=d["meta"]["author"],
            description=d["meta"].get("description"),
            tags=d["meta"].get("tags", []),
        )
        citations = [
            Citation(
                document_id=c["documentId"],
                page=c.get("page"),
                quote=c.get("quote"),
                confidence=c.get("confidence", "confirmed"),
            )
            for c in d.get("citations", [])
        ]
        return cls(
            id=d["id"],
            type=d["type"],
            namespace=d["namespace"],
            identifier=d["identifier"],
            version=d["version"],
            meta=meta,
            data=d.get("data", {}),
            citations=citations,
            chain=d.get("chain"),
            git=d.get("git"),
        )


@dataclass
class InjectedContext:
    """Result of inject() call"""
    containers: List[Container]
    citations: List[Citation]
    proofs: List[ChainProof]
    formatted: str
    token_count: int
    verified: bool
    verified_at: str

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "InjectedContext":
        """Create InjectedContext from API response dict"""
        containers = [Container.from_dict(c) for c in d.get("containers", [])]
        citations = [
            Citation(
                document_id=c["documentId"],
                page=c.get("page"),
                quote=c.get("quote"),
                confidence=c.get("confidence", "confirmed"),
            )
            for c in d.get("citations", [])
        ]
        proofs = [
            ChainProof(
                container_id=p["containerId"],
                verified=p["verified"],
                network=p.get("network"),
                batch_id=p.get("batchId"),
                tx_hash=p.get("txHash"),
                block_number=p.get("blockNumber"),
                verified_at=p.get("verifiedAt"),
                reason=p.get("reason"),
            )
            for p in d.get("proofs", [])
        ]
        return cls(
            containers=containers,
            citations=citations,
            proofs=proofs,
            formatted=d.get("formatted", ""),
            token_count=d.get("tokenCount", 0),
            verified=d.get("verified", False),
            verified_at=d.get("verifiedAt", ""),
        )
