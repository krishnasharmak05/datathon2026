import { ParsedQuery } from '../core/pipeline';
import { EmbeddingService } from '../core/services';

interface IntentTemplate {
  intent: string;
  phrase: string;
  embedding?: number[];
}

export class EmbeddingClassifier {
  private templates: IntentTemplate[] = [
    { intent: 'COUNT', phrase: 'What is the total count of crimes? How many cases are registered?' },
    { intent: 'COMPARE', phrase: 'Compare crime rates or statistics between different districts or police stations.' },
    { intent: 'TREND', phrase: 'Show crime growth over time, monthly trends, or yearly progression charts.' },
    { intent: 'HOTSPOT', phrase: 'Find crime hotspots, high-density areas, and cluster maps using coordinates.' },
    { intent: 'NETWORK', phrase: 'Show criminal relationship networks, co-accused links, and Cytoscape graphs.' },
    { intent: 'TIMELINE', phrase: 'Provide the historical case timeline, dates of arrest, and chargesheet filings.' },
    { intent: 'PREDICTION', phrase: 'Predict case duration, forecast future crime count, or calculate repeat offender recidivism risk.' },
    { intent: 'PROFILE', phrase: 'Generate offender behavioral profile, preferred crime category, overlap, and locations.' },
    { intent: 'SUMMARY', phrase: 'Give me a text summary of the case brief facts.' },
    { intent: 'LIST', phrase: 'Show a list of cases or search results matching the criteria.' },
    { intent: 'LOOKUP', phrase: 'Lookup case information, details of the FIR, and court hearing details.' }
  ];

  private initialized = false;

  constructor(private embeddingService: EmbeddingService) {}

  private async initialize() {
    if (this.initialized) return;
    
    // Embed the templates
    for (const t of this.templates) {
      t.embedding = await this.embeddingService.getEmbedding(t.phrase);
    }
    
    this.initialized = true;
  }

  async classify(query: string, threshold: number = 0.60): Promise<ParsedQuery | null> {
    await this.initialize();
    
    try {
      const queryEmbedding = await this.embeddingService.getEmbedding(query);
      
      let bestIntent = '';
      let maxScore = -1;

      for (const t of this.templates) {
        if (t.embedding) {
          const score = this.embeddingService.computeCosineSimilarity(queryEmbedding, t.embedding);
          if (score > maxScore) {
            maxScore = score;
            bestIntent = t.intent;
          }
        }
      }

      console.log(`[Embedding Classifier] Classified intent: ${bestIntent} with score: ${maxScore.toFixed(3)}`);

      if (maxScore >= threshold) {
        // Run deterministic entities parse on top of the classified intent
        const dummyQuery: ParsedQuery = {
          intent: bestIntent,
          entities: {}, // Populate with default heuristics
          confidence: maxScore,
          pipelineStage: 'embedding'
        };

        // Try extracting standard year, coordinates, etc.
        const text = query.toLowerCase();
        const yearMatch = text.match(/\b(202\d)\b/);
        if (yearMatch) dummyQuery.entities.year = parseInt(yearMatch[1], 10);
        
        const caseNoMatch = text.match(/\b(\d{9,17})\b/);
        if (caseNoMatch) dummyQuery.entities.caseNo = caseNoMatch[1];

        // Match district names
        if (text.includes('bengaluru') || text.includes('bangalore')) {
          dummyQuery.entities.district = 'Bengaluru City';
          dummyQuery.entities.districtId = 1;
        } else if (text.includes('mysuru') || text.includes('mysore')) {
          dummyQuery.entities.district = 'Mysuru';
          dummyQuery.entities.districtId = 2;
        } else if (text.includes('mangaluru') || text.includes('mangalore')) {
          dummyQuery.entities.district = 'Mangaluru City';
          dummyQuery.entities.districtId = 4;
        }

        // Match accused name
        const nameMatch = text.match(/(?:accused|suspect|named|relation of|criminal|offender)\s+([a-zA-Z\s]+)/);
        if (nameMatch) {
          dummyQuery.entities.name = nameMatch[1].trim();
        }

        return dummyQuery;
      }
    } catch (error) {
      console.error('Error during embedding classification:', error);
    }

    return null;
  }
}
