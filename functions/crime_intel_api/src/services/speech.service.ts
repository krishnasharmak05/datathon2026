import { SpeechService } from '../core/services';

export class BrowserSpeechService implements SpeechService {
  async textToSpeech(text: string, language: 'en' | 'kn'): Promise<string> {
    // Return the text back as a confirmation signal. 
    // Client-side can directly use the browser's speechSynthesis API (window.speechSynthesis)
    // using the textResponse returned in the API payload.
    return `BROWSER_TTS_OK: [lang=${language}] ${text.substring(0, 30)}...`;
  }

  async speechToText(audioBase64: string, language: 'en' | 'kn'): Promise<string> {
    // Client-side will capture audio via browser speechRecognition API (WebkitSpeechRecognition) 
    // and send text directly. If audioBase64 is sent, we return a mock transcript.
    return "Transcribed query text from Browser Speech capture.";
  }
}

export class ZiaSpeechService implements SpeechService {
  async textToSpeech(text: string, language: 'en' | 'kn'): Promise<string> {
    throw new Error('Zia Speech Service is only supported in Zoho Cloud Environment.');
  }

  async speechToText(audioBase64: string, language: 'en' | 'kn'): Promise<string> {
    throw new Error('Zia Speech Service is only supported in Zoho Cloud Environment.');
  }
}
