import { SemanticSearchService } from '../core/services';

export class QuickMLSemanticSearchService implements SemanticSearchService {
  async indexCase(caseId: number, briefFacts: string): Promise<void> {
    try {
      const projectId = process.env.CATALYST_PROJECT_ID;
      const apiDomain = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.com';
      const endpoint = `${apiDomain}/v1/project/${projectId}/quickml/rag/index`;

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CATALYST_QUICKML_API_KEY || ''}`
        },
        body: JSON.stringify({
          document_id: String(caseId),
          text: briefFacts
        })
      });
    } catch (error) {
      console.error('Error indexing case in QuickML RAG:', error);
    }
  }

  async search(query: string, limit: number = 5): Promise<{
    caseId: number;
    crimeNo: string;
    briefFacts: string;
    score: number;
  }[]> {
    try {
      const projectId = process.env.CATALYST_PROJECT_ID;
      const apiDomain = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.com';
      const endpoint = `${apiDomain}/v1/project/${projectId}/quickml/rag/search`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CATALYST_QUICKML_API_KEY || ''}`
        },
        body: JSON.stringify({
          query,
          limit
        })
      });

      if (!response.ok) {
        throw new Error(`QuickML RAG search failed with status: ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data.results || [];
    } catch (error) {
      console.error('Error in QuickML RAG search:', error);
      return [];
    }
  }
}
