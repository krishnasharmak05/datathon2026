import { ApiResponse, ParsedQuery } from '../../core/pipeline';
import { llmService } from '../../services';
import { SqlTracer } from '../../db/sqlite.repo';

export class ResponseBuilder {
  async buildResponse(
    query: string,
    parsed: ParsedQuery,
    analyticsResult: any,
    executionTimeMs: number,
    language: 'en' | 'kn' = 'en'
  ): Promise<ApiResponse> {
    
    // 1. Build prompt for the LLM to format the response
    const systemPrompt = `
      You are the conversational interface for the Karnataka Police Crime Intelligence Platform.
      You are given a user query, a resolved intent, and the JSON analytical output of deterministic SQL/ML processing.
      Your job is to explain the JSON results to the user in a natural, polite, and brief manner.
      
      Rules:
      1. Do NOT hallucinate counts, names, or values. Rely ONLY on the provided JSON data.
      2. Respond in the requested language: ${language === 'kn' ? 'Kannada' : 'English'}.
      3. If the data is empty or indicates no records, clearly state that no matching crime records were found.
      4. Keep the explanation concise (2-4 sentences max), as it may be read aloud by a Text-to-Speech system.
    `;

    const userPrompt = `
      User Query: "${query}"
      Resolved Intent: ${parsed.intent}
      Data Result JSON:
      ${JSON.stringify(analyticsResult, null, 2)}
    `;

    let textResponse = '';
    try {
      textResponse = await llmService.generateText(userPrompt, systemPrompt);
    } catch (error) {
      console.error('Error compiling LLM response:', error);
      textResponse = `Deterministic analysis completed successfully. Result: ${JSON.stringify(analyticsResult)}`;
    }

    // 2. Extract Explainable AI Metadata
    const sqlQuery = SqlTracer.getQueries();
    const rowsProcessed = SqlTracer.getRowsProcessed();

    const confidencePct = `${Math.round(parsed.confidence * 100)}%`;
    const generatedUsing = parsed.pipelineStage === 'deterministic' 
      ? 'Deterministic Regex Parser -> SQL Template Engine'
      : parsed.pipelineStage === 'embedding'
      ? 'Vector Cosine Similarity Intent Classifier -> Dynamic SQL Repository'
      : 'QuickML LLM Intent Parsing -> Fallback SQL Execution';

    const metadata = {
      intent: parsed.intent,
      dataSource: sqlQuery.length > 0 ? 'SQLite Local Database' : 'In-Memory Service Engine',
      rowsProcessed,
      confidence: confidencePct,
      generatedUsing,
      executionTimeMs,
      sqlQuery: sqlQuery.length > 0 ? sqlQuery : undefined
    };

    // 3. Clear SQL Tracer for next request
    SqlTracer.clear();

    return {
      status: 'success',
      intent: parsed.intent,
      data: analyticsResult,
      textResponse: textResponse.trim(),
      metadata
    };
  }
}
export const responseBuilder = new ResponseBuilder();
