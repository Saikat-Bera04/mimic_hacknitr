/**
 * Calculate cosine similarity between two vectors
 * @param vecA - First vector (embedding)
 * @param vecB - Second vector (embedding)
 * @returns Cosine similarity score between -1 and 1 (typically 0 to 1 for embeddings)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  if (vecA.length === 0) {
    return 0;
  }

  // Calculate dot product
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  // Avoid division by zero
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Find top-K most similar items from a list based on cosine similarity
 * @param queryEmbedding - Query vector embedding
 * @param items - Array of items with embeddings
 * @param k - Number of top results to return
 * @param threshold - Minimum similarity score (0-1)
 * @returns Sorted array of items with their similarity scores
 */
export function findTopKSimilar<T extends { embedding: number[] }>(
  queryEmbedding: number[],
  items: T[],
  k: number = 5,
  threshold: number = 0.3
): Array<T & { similarity: number }> {
  // Calculate similarity for all items
  const similarities = items.map((item) => ({
    ...item,
    similarity: cosineSimilarity(queryEmbedding, item.embedding),
  }));

 
  const filtered = similarities.filter((item) => item.similarity >= threshold);

  
  return filtered.sort((a, b) => b.similarity - a.similarity).slice(0, k);
}
