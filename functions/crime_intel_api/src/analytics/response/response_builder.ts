import { ApiResponse, ParsedQuery } from '../../core/pipeline';
import { llmService } from '../../services';
import { SqlTracer } from '../../db/sqlite.repo';

export class ResponseBuilder {
  async buildResponse(
    query: string,
    parsed: ParsedQuery,
    analyticsResult: any,
    executionTimeMs: number,
    language: 'en' | 'kn' = 'en',
    isTerminal?: boolean
  ): Promise<ApiResponse> {
    // Extract SQL queries and trace details before prompt building / clearing
    const sqlQuery = SqlTracer.getQueries();
    const rowsProcessed = SqlTracer.getRowsProcessed();

    // 1. Build prompt for the LLM to format the response
    const systemPrompt = `
      You are the conversational interface for the Karnataka Police Crime Intelligence Platform.
      You are given a user query, a resolved intent, the SQL query executed (if any), and the JSON analytical output of deterministic SQL/ML processing.
      Your job is to explain the JSON results to the user in a natural, polite, and brief manner.
      
      Rules:
      1. Do NOT hallucinate counts, names, or values. Rely ONLY on the provided JSON data and the SQL queries/parameters executed.
      2. Respond in the requested language: ${language === 'kn' ? 'Kannada' : 'English'}.
      3. If the data is empty or indicates no records, clearly state that no matching crime records were found.
      4. Keep the explanation concise (2-4 sentences max), as it may be read aloud by a Text-to-Speech system. For offender profiles (PROFILE intent), you may write a slightly longer, structured summary containing the key profile metrics (e.g., offences, active years, location, and brief history).
      5. Use parameters from the SQL queries (like date limits, e.g. '2024-01-01') to make the explanation precise (e.g. mention specific dates or time periods).
    `;

    const userPrompt = `
      User Query: "${query}"
      Resolved Intent: ${parsed.intent}
      SQL Queries Executed:
      ${sqlQuery.length > 0 ? sqlQuery.join('\n') : 'None'}
      Data Result JSON:
      ${JSON.stringify(analyticsResult, null, 2)}
    `;

    let textResponse = '';
    if (analyticsResult && analyticsResult.status === 'conflict') {
      const optionsLines = analyticsResult.options.map((opt: any) => 
        `- ${opt.accusedName} (Person ID: ${opt.personId})`
      ).join('\n');
      textResponse = language === 'kn'
        ? `ಹೆಸರಿಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಬಹು ಆರೋಪಿಗಳು ಪತ್ತೆಯಾಗಿದ್ದಾರೆ. ದಯವಿಟ್ಟು ಸೂಕ್ತವಾದ ವ್ಯಕ್ತಿ ಐಡಿಯನ್ನು (Person ID) ಆಯ್ಕೆಮಾಡಿ:\n${optionsLines}`
        : `Multiple suspects match this name. Please specify the Person ID:\n${optionsLines}`;
    } else if (parsed.intent === 'TIMELINE') {
      const caseNo = parsed.entities.caseNo || 'unknown';
      if (!analyticsResult || !analyticsResult.events || analyticsResult.events.length === 0) {
        textResponse = language === 'kn'
          ? `ಪ್ರಕರಣ ${caseNo} ಗಾಗಿ ಯಾವುದೇ ಪ್ರಗತಿಯ ವಿವರಗಳು ಕಂಡುಬಂದಿಲ್ಲ.`
          : `No timeline events or milestones found for case ${caseNo}.`;
      } else {
        const eventLines = analyticsResult.events.map((ev: any) => 
          `• [${ev.date}] ${ev.stage}: ${ev.details} (Officer: ${ev.officer || 'N/A'})`
        ).join('\n');
        textResponse = language === 'kn'
          ? `ಪ್ರಕರಣ ${caseNo} ಪ್ರಗತಿ ವಿವರಗಳು ಯಶಸ್ವಿಯಾಗಿ ಪಡೆಯಲಾಗಿದೆ:\n${eventLines}`
          : `Timeline progression for case ${caseNo} retrieved successfully:\n${eventLines}`;
      }
    } else if (parsed.intent === 'NETWORK') {
      const name = parsed.entities.name || 'unknown';
      textResponse = language === 'kn'
        ? `ಆರೋಪಿ ${name} ರವರ ಕ್ರಿಮಿನಲ್ ನೆಟ್‌ವರ್ಕ್ ಸಂಬಂಧಗಳ ಮ್ಯಾಟ್ರಿಕ್ಸ್ ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ.`
        : `Criminal relationship network for accused ${name} computed successfully.`;
    } else if (parsed.intent === 'PROFILE') {
      if (isTerminal) {
        try {
          textResponse = await llmService.generateText(userPrompt, systemPrompt);
        } catch (error) {
          console.error('Error compiling LLM response:', error);
          textResponse = `Deterministic analysis completed successfully. Result: ${JSON.stringify(analyticsResult)}`;
        }
      } else {
        const name = parsed.entities.name || 'unknown';
        textResponse = language === 'kn'
          ? `ಆರೋಪಿ ${name} ರವರ ನಡವಳಿಕೆಯ ವಿವರಗಳು ಮತ್ತು ಕ್ರಿಮಿನಲ್ ಹಿಸ್ಟರಿ ಯಶಸ್ವಿಯಾಗಿ ಪಡೆಯಲಾಗಿದೆ.`
          : `Offender behavioral profile for accused ${name} generated successfully.`;
      }
    } else if (parsed.intent === 'HOTSPOT') {
      textResponse = language === 'kn'
        ? `ಡೆನ್ಸಿಟಿ-ಬೇಸ್ಡ್ ಕ್ಲಸ್ಟರಿಂಗ್ (DBSCAN) ಬಳಸಿ ಜಿಯೋಸ್ಪೇಷಿಯಲ್ ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಪತ್ತೆಹಚ್ಚಲಾಗಿದೆ.`
        : `Geospatial hotspot cluster detection using DBSCAN completed successfully.`;
    } else {
      try {
        textResponse = await llmService.generateText(userPrompt, systemPrompt);
      } catch (error) {
        console.error('Error compiling LLM response:', error);
        textResponse = `Deterministic analysis completed successfully. Result: ${JSON.stringify(analyticsResult)}`;
      }
    }

    // 2. Extract Explainable AI Metadata (already extracted above)

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
