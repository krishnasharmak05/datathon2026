import { SpeechService } from '../core/services';

export class CatalystSpeechService implements SpeechService {
  async speechToText(audioBase64: string, language: 'en' | 'kn'): Promise<string> {
    try {
      const projectId = process.env.CATALYST_PROJECT_ID;
      const apiDomain = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.com';
      const endpoint = `${apiDomain}/v1/project/${projectId}/zia/speech-to-text`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CATALYST_ZIA_API_KEY || ''}`
        },
        body: JSON.stringify({
          audio: audioBase64,
          language: language === 'kn' ? 'kn-IN' : 'en-US'
        })
      });

      if (!response.ok) {
        throw new Error(`Zia Speech-to-Text failed with status: ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data.text || '';
    } catch (error) {
      console.error('Error in Zia Speech-to-Text:', error);
      throw error;
    }
  }

  async textToSpeech(text: string, language: 'en' | 'kn'): Promise<string> {
    try {
      const projectId = process.env.CATALYST_PROJECT_ID;
      const apiDomain = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.com';
      const endpoint = `${apiDomain}/v1/project/${projectId}/zia/text-to-speech`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CATALYST_ZIA_API_KEY || ''}`
        },
        body: JSON.stringify({
          text,
          language: language === 'kn' ? 'kn-IN' : 'en-US'
        })
      });

      if (!response.ok) {
        throw new Error(`Zia Text-to-Speech failed with status: ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data.audio_base64 || '';
    } catch (error) {
      console.error('Error in Zia Text-to-Speech:', error);
      throw error;
    }
  }
}
