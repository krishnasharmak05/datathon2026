import { EmbeddingService } from '../core/services';
import { GoogleGenAI } from '@google/genai';

export class GeminiEmbeddingService implements EmbeddingService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    if (this.ai) {
      try {
        const result = await this.ai.models.embedContent({
          model: 'gemini-embedding-2',
          contents: text,
        });
        if (result.embeddings && result.embeddings[0] && result.embeddings[0].values) {
          return result.embeddings[0].values;
        }
        if ((result as any).embedding && (result as any).embedding.values) {
          return (result as any).embedding.values;
        }
      } catch (error) {
        console.error('Error fetching Gemini embedding:', error);
      }
    }
    return this.getOfflineMockEmbedding(text);
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

  private getOfflineMockEmbedding(text: string): number[] {
    // Generate a simple, deterministic pseudo-embedding based on string character hashes
    const size = 128; // Smaller dimension for mock similarity
    const vec = new Array(size).fill(0);
    const cleanText = text.toLowerCase();
    
    // Hash-based mock representation
    for (let i = 0; i < cleanText.length; i++) {
      const charCode = cleanText.charCodeAt(i);
      const index = (charCode + i) % size;
      vec[index] += 1;
    }

    // Normalize vector
    let mag = 0;
    for (let i = 0; i < size; i++) {
      mag += vec[i] * vec[i];
    }
    mag = Math.sqrt(mag);
    if (mag > 0) {
      for (let i = 0; i < size; i++) {
        vec[i] /= mag;
      }
    }

    return vec;
  }
}

export class QuickMLEmbeddingService implements EmbeddingService {
  async getEmbedding(text: string): Promise<number[]> {
    throw new Error('QuickML Embedding Service is only supported in Zoho Cloud Environment.');
  }

  computeCosineSimilarity(vecA: number[], vecB: number[]): number {
    throw new Error('QuickML Embedding Service is only supported in Zoho Cloud Environment.');
  }
}
