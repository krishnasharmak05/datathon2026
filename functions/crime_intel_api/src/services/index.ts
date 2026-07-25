import { GeminiLLMService } from './llm.service';
import { GeminiEmbeddingService } from './embedding.service';
import { BrowserSpeechService } from './speech.service';
import { LocalSemanticSearchService } from './search.service';
import { LocalPDFGenerator } from './report.service';
import { LocalPredictionService } from './prediction.service';
import { 
  LocalCacheService, 
  LocalNotificationService, 
  LocalAuthenticationService, 
  LocalTranslationService 
} from './other.service';

// Service Instances
export const llmService = new GeminiLLMService();
export const embeddingService = new GeminiEmbeddingService();
export const speechService = new BrowserSpeechService();
export const semanticSearchService = new LocalSemanticSearchService(embeddingService);
export const reportService = new LocalPDFGenerator();
export const predictionService = new LocalPredictionService();
export const cacheService = new LocalCacheService();
export const notificationService = new LocalNotificationService();
export const authenticationService = new LocalAuthenticationService();
export const translationService = new LocalTranslationService();
