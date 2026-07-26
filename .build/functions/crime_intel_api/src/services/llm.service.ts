import { LLMService } from '../core/services';

export class CatalystLLMService implements LLMService {
  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    const url = process.env.CATALYST_LLM_ENDPOINT || 'https://quickml.zoho.com/api/v1/llm';
    const apiKey = process.env.CATALYST_LLM_API_KEY || '';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          prompt: prompt,
          system_instruction: systemInstruction,
          temperature: 0.2,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`Catalyst LLM API failed with status: ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data.text || data.response || data.generated_text || '';
    } catch (error) {
      console.error('Error in Catalyst LLM REST API:', error);
      throw error;
    }
  }
}
