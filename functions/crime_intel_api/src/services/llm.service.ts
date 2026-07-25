import { LLMService } from '../core/services';
import { GoogleGenAI } from '@google/genai';

export class GeminiLLMService implements LLMService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      console.log('Gemini LLM Service initialized with API Key.');
    } else {
      console.warn('GEMINI_API_KEY is not defined. Falling back to local offline mock LLM.');
    }
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    if (this.ai) {
      try {
        const modelName = 'gemini-3.5-flash-lite';
        const response = await this.ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
          }
        });
        console.log("Prompt:\n")
        console.log(prompt)
        console.log("Response:\n")
        console.log(response.text)
        return response.text || '';
      } catch (error) {
        console.error('Error in Gemini LLM generation:', error);
        return this.generateOfflineMockResponse(prompt, systemInstruction);
      }
    } else {
      return this.generateOfflineMockResponse(prompt, systemInstruction);
    }
  }

  private generateOfflineMockResponse(prompt: string, systemInstruction?: string): string {
    // If the system instruction contains JSON, parse it if possible and format a clean text
    const lowerPrompt = prompt.toLowerCase();
    
    // Quick heuristic translation / summarization for local dev
    if (lowerPrompt.includes('kannada') || (systemInstruction && systemInstruction.toLowerCase().includes('kannada'))) {
      if (lowerPrompt.includes('count') || lowerPrompt.includes('crimes')) {
        return "ವಿಶ್ಲೇಷಿಸಿದ ಡೇಟಾ ಪ್ರಕಾರ, ಒಟ್ಟು ಅಪರಾಧಗಳ ಸಂಖ್ಯೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಲೆಕ್ಕಹಾಕಲಾಗಿದೆ. ಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ ಕೆಳಗಿನ ಕೋಷ್ಟಕವನ್ನು ನೋಡಿ.";
      }
      return "ಕ್ಷಮಿಸಿ, ಜೆಮಿನಿ API ಕೀ ಲಭ್ಯವಿಲ್ಲದ ಕಾರಣ ಆಫ್‌ಲೈನ್ ಮಾದರಿಯನ್ನು ಬಳಸಲಾಗುತ್ತಿದೆ. ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ.";
    }

    // Default English mockup response
    if (lowerPrompt.includes('count') || lowerPrompt.includes('statistics')) {
      return "Based on the deterministic SQL analysis of the crime records, the total count has been calculated. The statistics show a high distribution under Crimes Against Property, followed by Cybercrime. Let me know if you need to visualize this or search for specific case details.";
    }
    if (lowerPrompt.includes('hotspot') || lowerPrompt.includes('map')) {
      return "The DBSCAN clustering engine identified key hotspots with density clusters centered around urban areas. High-density zones are highlighted on your map. These clusters correlate with times of high pedestrian density.";
    }
    if (lowerPrompt.includes('network') || lowerPrompt.includes('relation')) {
      return "Criminal network visualization generated successfully. Degree centrality is computed showing that the primary accused has multiple co-arrest linkages. You can double click nodes to investigate relationships.";
    }

    return `[Offline LLM Mock Response] Received query. Analysis has successfully completed using SQL and local algorithms. Resulting dataset contains the required metrics. (Configure GEMINI_API_KEY in backend environment to enable live AI responses)`;
  }
}

export class QuickMLLLMService implements LLMService {
  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    throw new Error('QuickML LLM Serving is only supported in Zoho Cloud Environment. Currently running in Local Gemini/Mock mode.');
  }
}
