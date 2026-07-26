export interface LLMService {
  generateText(prompt: string, systemInstruction?: string): Promise<string>;
}

export interface EmbeddingService {
  getEmbedding(text: string): Promise<number[]>;
  computeCosineSimilarity(vecA: number[], vecB: number[]): number;
}

export interface SpeechService {
  textToSpeech(text: string, language: 'en' | 'kn'): Promise<string>; // Returns audio base64 or status
  speechToText(audioBase64: string, language: 'en' | 'kn'): Promise<string>; // Returns transcribed text
}

export interface SemanticSearchService {
  indexCase(caseId: number, briefFacts: string): Promise<void>;
  search(query: string, limit?: number): Promise<{
    caseId: number;
    crimeNo: string;
    briefFacts: string;
    score: number;
  }[]>;
}

export interface ReportService {
  generatePDF(reportType: string, data: any): Promise<{ pdfBase64: string; fileName: string }>;
}

export interface PredictionService {
  forecastCrimeCount(historicalCounts: { date: string; count: number }[], periods: number): Promise<{ date: string; count: number }[]>;
  predictRecidivism(accusedId: string): Promise<{ score: number; riskLevel: string; factors: string[] }>;
  predictCaseDuration(crimeSubHeadId: number, districtId: number): Promise<{ durationDays: number; confidence: number }>;
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface NotificationService {
  sendPushNotification(userId: string, title: string, body: string): Promise<void>;
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

export interface AuthenticationService {
  verifyToken(token: string): Promise<{ userId: string; username: string; role: string } | null>;
}

export interface TranslationService {
  translate(text: string, sourceLang: 'en' | 'kn', targetLang: 'en' | 'kn'): Promise<string>;
}
