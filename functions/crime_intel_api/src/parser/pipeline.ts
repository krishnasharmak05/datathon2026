import { ParsedQuery } from '../core/pipeline';
import { DeterministicParser } from './parser';
import { EmbeddingClassifier } from './classifier';
import { LLMService, EmbeddingService } from '../core/services';

export class IntentResolutionPipeline {
  private deterministicParser = new DeterministicParser();
  private embeddingClassifier: EmbeddingClassifier;

  constructor(
    private llmService: LLMService,
    private embeddingService: EmbeddingService
  ) {
    this.embeddingClassifier = new EmbeddingClassifier(embeddingService);
  }

  async resolve(query: string, threshold: number = 0.8): Promise<ParsedQuery> {
    console.log(`[Pipeline] Resolving query: "${query}"`);

    // Stage 1: Deterministic Parser
    const detResult = this.deterministicParser.parse(query);
    if (detResult && detResult.confidence >= threshold) {
      console.log(`[Pipeline] Short-circuiting at Deterministic stage. Confidence: ${detResult.confidence}`);
      return detResult;
    }

    // Stage 2: Embedding-based Intent Classifier
    const embResult = await this.embeddingClassifier.classify(query, 0.65);
    if (embResult && embResult.confidence >= 0.65) {
      console.log(`[Pipeline] Short-circuiting at Embedding stage. Confidence: ${embResult.confidence}`);
      // Preserve any entities parsed deterministically if we can
      if (detResult) {
        embResult.entities = { ...detResult.entities, ...embResult.entities };
      }
      return embResult;
    }

    // Stage 3: LLM Intent Parsing
    console.log(`[Pipeline] Falling back to LLM intent resolution...`);
    const systemPrompt = `
      You are the Intent Parser for the Karnataka Police Crime Intelligence Platform.
      Your task is to analyze the user's query and extract a structured JSON response matching the schema:
      {
        "intent": "COUNT" | "LIST" | "TREND" | "HOTSPOT" | "COMPARE" | "TIMELINE" | "NETWORK" | "PREDICTION" | "SUMMARY" | "PROFILE" | "LOOKUP",
        "entities": {
          "district": string (e.g. "Bengaluru City", "Mysuru"),
          "districtId": number (1 for Bengaluru, 2 for Mysuru, etc.),
          "unit": string (police station name),
          "unitId": number,
          "crimeHead": string (e.g. "Cybercrime", "Narcotics", "Crimes Against Body"),
          "crimeHeadId": number,
          "crimeSubHead": string (e.g. "House Breaking", "Murder", "Theft"),
          "crimeSubHeadId": number,
          "year": number,
          "startDate": string (YYYY-MM-DD),
          "endDate": string (YYYY-MM-DD),
          "name": string (Accused or Suspect Name),
          "caseNo": string (CrimeNo or CaseNo),
          "act": string (e.g. "IPC", "NDPS", "POCSO", "IT_ACT", "KP_ACT"),
          "section": string (e.g. "302", "379", "66C"),
          "caseCategory": string (e.g. "FIR", "UDR", "Zero FIR", "PAR"),
          "caseCategoryId": number,
          "gravity": string (e.g. "Heinous", "Non-Heinous"),
          "gravityId": number,
          "caseStatus": string (e.g. "Under Investigation", "Charge Sheeted", "Closed"),
          "caseStatusId": number,
          "caste": string (e.g. "General", "OBC", "SC", "ST"),
          "casteId": number,
          "religion": string (e.g. "Hindu", "Muslim", "Christian", "Sikh", "Jain"),
          "religionId": number,
          "occupation": string (e.g. "Farmer", "Business Owner", "Student"),
          "occupationId": number,
          "complainantGender": string (e.g. "Male", "Female", "Transgender"),
          "complainantGenderId": number,
          "victimGender": string (e.g. "Male", "Female", "Transgender"),
          "victimGenderId": number,
          "accusedGender": string (e.g. "Male", "Female", "Transgender"),
          "accusedGenderId": number,
          "officerKgid": string (e.g. "KG-20001"),
          "officerName": string,
          "officerId": number,
          "victimPolice": number (0 or 1),
          "csType": string ("A" | "B" | "C")
        },
        "confidence": number (between 0.0 and 1.0)
      }

      Choose the intent that best fits:
      - COUNT: Counting cases
      - COMPARE: Comparing crime count/stats between places
      - TREND: Monthly or yearly charts/trends
      - HOTSPOT: Geospatial maps/hotspots
      - NETWORK: Cytoscape relationship link charts
      - TIMELINE: Date progressions of cases
      - PREDICTION: Recidivism scores, future forecasts
      - PROFILE: Offender behavioral profiles
      - SUMMARY: Fact summaries of crimes
      - LIST: Showing a list of crimes
      - LOOKUP: Searching details of a specific CaseNo / CrimeNo

      Respond ONLY with valid JSON. Do not include markdown codeblocks or extra text.
    `;

    try {
      const llmResponse = await this.llmService.generateText(query, systemPrompt);
      // Clean potential JSON markdown wrapper
      const jsonText = llmResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonText);
      
      return {
        intent: parsed.intent || 'LIST',
        entities: parsed.entities || {},
        confidence: parsed.confidence || 0.7,
        pipelineStage: 'llm'
      };
    } catch (e) {
      console.error('LLM Intent Parser failed or returned invalid JSON, fallback to default LIST:', e);
      
      // Heuristic fallback if LLM parsing errors out
      return {
        intent: detResult?.intent || 'LIST',
        entities: detResult?.entities || {},
        confidence: 0.5,
        pipelineStage: 'deterministic'
      };
    }
  }
}
