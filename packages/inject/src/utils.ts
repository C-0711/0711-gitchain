/**
 * Utility functions
 */

/**
 * Estimate token count for a string
 * Rough approximation: ~4 characters per token for English
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to approximate token limit
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  
  return text.slice(0, maxChars - 100) + "\n\n[... truncated for context limit]";
}

/**
 * Hash content for verification
 */
export function hashContent(content: string): string {
  // Simple hash for now - use crypto in production
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
}
