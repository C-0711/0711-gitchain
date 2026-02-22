"""
GitChain API Client
"""

import json
from typing import Optional, List, Dict, Any
from urllib.request import Request, urlopen
from urllib.error import HTTPError

from .types import Container, InjectedContext


class GitChainClient:
    """
    GitChain API client for Python

    Example:
        client = GitChainClient(api_key="your-api-key")
        context = client.inject(["0711:product:bosch:7736606982:v3"])
        print(context.formatted)
    """

    def __init__(
        self,
        api_url: str = "https://api.gitchain.0711.io",
        api_key: Optional[str] = None,
        timeout: int = 30,
    ):
        self.api_url = api_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout

    def inject(
        self,
        containers: List[str],
        verify: bool = True,
        format: str = "markdown",
        include_citations: bool = True,
        max_tokens: Optional[int] = None,
    ) -> InjectedContext:
        """
        Inject verified context from containers

        Args:
            containers: List of container IDs
            verify: Verify blockchain proofs (default: True)
            format: Output format (markdown, json, yaml)
            include_citations: Include source citations (default: True)
            max_tokens: Maximum tokens for output

        Returns:
            InjectedContext with verified data
        """
        data = {
            "containers": containers,
            "verify": verify,
            "format": format,
            "includeCitations": include_citations,
        }
        if max_tokens:
            data["maxTokens"] = max_tokens

        response = self._request("POST", "/api/inject", data)
        return InjectedContext.from_dict(response)

    def get_container(self, container_id: str) -> Optional[Container]:
        """
        Get a single container by ID

        Args:
            container_id: Container ID (e.g., "0711:product:bosch:7736606982:v3")

        Returns:
            Container or None if not found
        """
        try:
            response = self._request("GET", f"/api/containers/{container_id}")
            return Container.from_dict(response)
        except HTTPError as e:
            if e.code == 404:
                return None
            raise

    def verify(self, hash_or_id: str) -> Dict[str, Any]:
        """
        Verify a container or content hash

        Args:
            hash_or_id: Container ID or content hash

        Returns:
            Verification result with blockchain proof
        """
        return self._request("GET", f"/api/verify/{hash_or_id}")

    def _request(
        self,
        method: str,
        path: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Make HTTP request to API"""
        url = f"{self.api_url}{path}"
        
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        body = json.dumps(data).encode() if data else None
        request = Request(url, data=body, headers=headers, method=method)

        try:
            with urlopen(request, timeout=self.timeout) as response:
                return json.loads(response.read())
        except HTTPError as e:
            error_body = e.read().decode()
            try:
                error_data = json.loads(error_body)
                raise Exception(error_data.get("error", f"HTTP {e.code}"))
            except json.JSONDecodeError:
                raise Exception(f"HTTP {e.code}: {error_body}")


# Default client instance
_default_client: Optional[GitChainClient] = None


def get_client(
    api_url: str = "https://api.gitchain.0711.io",
    api_key: Optional[str] = None,
) -> GitChainClient:
    """Get or create default client instance"""
    global _default_client
    if _default_client is None or api_key:
        _default_client = GitChainClient(api_url=api_url, api_key=api_key)
    return _default_client
