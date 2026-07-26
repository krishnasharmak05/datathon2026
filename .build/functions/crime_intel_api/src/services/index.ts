import { CatalystLLMService } from './llm.service';
import { QuickMLEmbeddingService } from './embedding.service';
import { CatalystSpeechService } from './speech.service';
import { QuickMLSemanticSearchService } from './search.service';
import { SmartBrowzReportService } from './report.service';
import { CatalystQuickMLPredictionService } from './prediction.service';
import { 
  CatalystCacheService, 
  CatalystNotificationService, 
  CatalystAuthenticationService, 
  CatalystTranslationService 
} from './other.service';

// Catalyst Native Service Instances
export const llmService = new CatalystLLMService();
export const embeddingService = new QuickMLEmbeddingService();
export const speechService = new CatalystSpeechService();
export const semanticSearchService = new QuickMLSemanticSearchService();
export const reportService = new SmartBrowzReportService();
export const predictionService = new CatalystQuickMLPredictionService();
export const cacheService = new CatalystCacheService();
export const notificationService = new CatalystNotificationService();
export const authenticationService = new CatalystAuthenticationService();
export const translationService = new CatalystTranslationService();
