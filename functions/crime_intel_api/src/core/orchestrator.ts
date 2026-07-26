import { IntentResolutionPipeline } from '../parser/pipeline';
import { ExecutionPlanner } from '../parser/planner';
import { responseBuilder } from '../analytics/response/response_builder';
import { llmService, embeddingService, translationService, speechService } from '../services';
import { ApiResponse } from './pipeline';
import { SqlTracer } from '../db/sql_tracer';

import { analyticsRepository } from '../db';

// Import analytics modules
import { CrimeAnalytics } from '../analytics/crime/crime.analytics';
import { TrendAnalytics } from '../analytics/trends/trends.analytics';
import { HotspotAnalytics } from '../analytics/hotspot/hotspot.analytics';
import { DemographicAnalytics } from '../analytics/demographics/demographics.analytics';
import { ComparisonAnalytics } from '../analytics/comparison/comparison.analytics';
import { TimelineAnalytics } from '../analytics/timeline/timeline.analytics';
import { ProfilingAnalytics } from '../analytics/profiling/profiling.analytics';
import { PredictionAnalytics } from '../analytics/prediction/prediction.analytics';
import { ReportingAnalytics } from '../analytics/reporting/reporting.analytics';

export class ConversationOrchestrator {
  private pipeline = new IntentResolutionPipeline(llmService, embeddingService);
  private planner = new ExecutionPlanner();

  // Instantiate analytics services
  private crime = new CrimeAnalytics();
  private trends = new TrendAnalytics();
  public hotspot = new HotspotAnalytics();
  private demographics = new DemographicAnalytics();
  private comparison = new ComparisonAnalytics();
  private timeline = new TimelineAnalytics();
  public profiling = new ProfilingAnalytics();
  private prediction = new PredictionAnalytics();
  private reporting = new ReportingAnalytics();

  async processQuery(query: string, language: 'en' | 'kn' = 'en', isTerminal?: boolean): Promise<ApiResponse> {
    const startTime = Date.now();
    SqlTracer.clear();

    try {
      // 1. Kannada input: Translate text query to English before parser
      let englishQuery = query;
      if (language === 'kn') {
        englishQuery = await translationService.translate(query, 'kn', 'en');
        console.log(`[Orchestrator] Translated query from Kannada to English: "${englishQuery}"`);
      }

      // 2. Resolve Intent and Entities
      const parsedQuery = await this.pipeline.resolve(englishQuery);

      // 3. Draft Execution Plan
      const plan = this.planner.plan(parsedQuery);
      
      // 4. Composed execution of analytics steps
      let finalData: any = null;

      for (const step of plan.steps) {
        console.log(`[Orchestrator] Executing step: ${step.id} (${step.module}.${step.action})`);
        
        switch (step.module) {
          case 'crime':
            if (step.action === 'getCrimeCount') {
              finalData = await this.crime.getCrimeCount(step.params);
            } else if (step.action === 'listCases') {
              finalData = await this.crime.listCases(step.params);
            } else if (step.action === 'lookupCaseDetails') {
              finalData = await this.crime.lookupCaseDetails(step.params);
            }
            break;

          case 'trends':
            if (step.action === 'getMonthlyTrends') {
              finalData = await this.trends.getMonthlyTrends(step.params);
            }
            break;

          case 'hotspot':
            if (step.action === 'detectHotspots') {
              finalData = await this.hotspot.detectHotspots(step.params);
            }
            break;

          case 'demographics':
            if (step.action === 'getDemographicsSummary') {
              finalData = await this.demographics.getDemographicsSummary();
            }
            break;

          case 'comparison':
            if (step.action === 'compareCrimeRates') {
              finalData = await this.comparison.compareCrimeRates(step.params);
            }
            break;

          case 'timeline':
            if (step.action === 'getTimelineEvents') {
              finalData = await this.timeline.getTimelineEvents(step.params);
            }
            break;

          case 'network':
            if (step.action === 'getAccusedNetwork') {
              finalData = await analyticsRepository.getNetworkData(step.params.name);
            }
            break;

          case 'profiling':
            if (step.action === 'getAccusedProfile') {
              finalData = await this.profiling.getAccusedProfile(step.params);
            }
            break;

          case 'prediction':
            if (step.action === 'predictRecidivism') {
              finalData = await this.prediction.predictRecidivism(step.params);
            } else if (step.action === 'predictCaseDuration') {
              finalData = await this.prediction.predictCaseDuration(step.params);
            } else if (step.action === 'forecastVolume') {
              finalData = await this.prediction.forecastVolume(step.params);
            }
            break;

          case 'reporting':
            if (step.action === 'getCaseSummaryText') {
              finalData = await this.reporting.getCaseSummaryText(step.params);
            }
            break;

          default:
            console.warn(`Unknown module ${step.module} for step ${step.id}`);
        }
      }

      const executionTime = Date.now() - startTime;

      // 5. Formulate response via ResponseBuilder (relying on English generation)
      const response = await responseBuilder.buildResponse(
        englishQuery,
        parsedQuery,
        finalData || { message: 'Query completed with no additional details.' },
        executionTime,
        'en',
        isTerminal
      );

      // 6. Translate Response back to Kannada if required
      if (language === 'kn') {
        const translatedText = await translationService.translate(response.textResponse, 'en', 'kn');
        response.textResponse = translatedText;
        console.log(`[Orchestrator] Translated response from English to Kannada.`);
      }

      // 7. Add Voice Response (base64 audio) if requested
      if (language === 'kn' || isTerminal) {
        try {
          const audioBase64 = await speechService.textToSpeech(response.textResponse, language);
          response.voiceResponse = audioBase64;
          console.log(`[Orchestrator] Generated Zia text-to-speech audio base64 payload.`);
        } catch (ttsErr) {
          console.error('[Orchestrator] TTS generation failed:', ttsErr);
        }
      }

      return response;

    } catch (error: any) {
      console.error('[Orchestrator] Execution Error:', error);
      const executionTime = Date.now() - startTime;
      SqlTracer.clear();
      
      return {
        status: 'error',
        intent: 'UNKNOWN',
        data: { error: error.message },
        textResponse: language === 'kn' 
          ? 'ದಿನಚರಿಯನ್ನು ವಿಶ್ಲೇಷಿಸುವಾಗ ದೋಷ ಕಂಡುಬಂದಿದೆ.' 
          : 'An error occurred during query execution pipeline.',
        metadata: {
          intent: 'UNKNOWN',
          dataSource: 'Error Handler',
          rowsProcessed: 0,
          confidence: '0%',
          generatedUsing: 'Error Fallback',
          executionTimeMs: executionTime
        }
      };
    }
  }
}

export const orchestrator = new ConversationOrchestrator();
