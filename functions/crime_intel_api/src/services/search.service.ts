import { SemanticSearchService, EmbeddingService } from '../core/services';
import { caseRepository } from '../db';

export class LocalSemanticSearchService implements SemanticSearchService {
  constructor(private embeddingService: EmbeddingService) {}

  async indexCase(caseId: number, briefFacts: string): Promise<void> {
    // In-memory indexing is done on-demand in the search method 
    // by loading from database to ensure up-to-date search.
  }

  async search(query: string, limit: number = 5): Promise<{
    caseId: number;
    crimeNo: string;
    briefFacts: string;
    score: number;
  }[]> {
    try {
      // 1. Get embedding for the query
      const queryEmbedding = await this.embeddingService.getEmbedding(query);

      // 2. Load all cases from the database
      const cases = await caseRepository.list();
      
      const scoredResults = await Promise.all(
        cases.map(async (c) => {
          // Generate embedding for case brief facts (memoized deterministic hash locally)
          const caseEmbedding = await this.embeddingService.getEmbedding(c.BriefFacts || '');
          const score = this.embeddingService.computeCosineSimilarity(queryEmbedding, caseEmbedding);
          return {
            caseId: c.CaseMasterID,
            crimeNo: c.CrimeNo,
            briefFacts: c.BriefFacts || '',
            score: score
          };
        })
      );

      // 3. Sort by score descending and return top matches
      return scoredResults
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error during local semantic search:', error);
      return [];
    }
  }
}

export class QuickMLSemanticSearchService implements SemanticSearchService {
  async indexCase(caseId: number, briefFacts: string): Promise<void> {
    throw new Error('QuickML Semantic Search is only supported in Zoho Cloud Environment.');
  }

  async search(query: string, limit?: number): Promise<any[]> {
    throw new Error('QuickML Semantic Search is only supported in Zoho Cloud Environment.');
  }
}
