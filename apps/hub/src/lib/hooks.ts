/**
 * React hooks for API data fetching
 */

import { useState, useEffect } from "react";
import api, { Container, Namespace } from "./api";

export function useContainers(params?: {
  type?: string;
  namespace?: string;
  limit?: number;
}) {
  const [containers, setContainers] = useState<Container[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getContainers(params)
      .then((result) => {
        setContainers(result.containers);
        setTotal(result.total);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [params?.type, params?.namespace, params?.limit]);

  return { containers, total, loading, error };
}

export function useContainer(id: string | null) {
  const [container, setContainer] = useState<Container | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setContainer(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .getContainer(id)
      .then(setContainer)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  return { container, loading, error };
}

export function useNamespaces(type?: string) {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getNamespaces(type)
      .then((result) => setNamespaces(result.namespaces))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [type]);

  return { namespaces, loading, error };
}

export function useSearch(query: string, options?: { type?: string }) {
  const [results, setResults] = useState<Container[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    api
      .search(query, options)
      .then((result) => {
        setResults(result.results);
        setTotal(result.total);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [query, options?.type]);

  return { results, total, loading, error };
}

export function useVerify(hashOrId: string | null) {
  const [result, setResult] = useState<{
    verified: boolean;
    container?: Container;
    chain?: { network: string; batchId: number; txHash?: string };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const verify = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.verify(id);
      setResult(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hashOrId) {
      verify(hashOrId);
    }
  }, [hashOrId]);

  return { result, loading, error, verify };
}
