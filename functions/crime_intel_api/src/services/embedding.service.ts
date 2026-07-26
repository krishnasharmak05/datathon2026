import { EmbeddingService } from '../core/services';

export class QuickMLEmbeddingService implements EmbeddingService {
  async getEmbedding(text: string): Promise<number[]> {
    try {
      const projectId = process.env.CATALYST_PROJECT_ID;
      const apiDomain = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.com';
      const endpoint = `${apiDomain}/v1/project/${projectId}/quickml/embeddings`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CATALYST_QUICKML_API_KEY || ''}`
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`QuickML Embedding generation failed: ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data.embedding || [];
    } catch (error) {
      console.error('Error getting embedding from QuickML:', error);
      throw error;
    }
  }

  computeCosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < Math.min(vecA.length, vecB.length); i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
