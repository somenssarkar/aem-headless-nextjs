/**
 * Splits text into overlapping windows for RAG chunking.
 * Returns [] for empty/whitespace-only input.
 */
export function chunkText(text: string, size: number, overlap: number): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < trimmed.length) {
    chunks.push(trimmed.slice(start, start + size));
    if (start + size >= trimmed.length) break;
    start += size - overlap;
  }
  return chunks;
}
