export interface ParsedQuery {
  intent: string; // COUNT | LIST | TREND | HOTSPOT | COMPARE | TIMELINE | NETWORK | PREDICTION | SUMMARY | PROFILE | LOOKUP
  entities: {
    district?: string;
    districtId?: number;
    unit?: string;
    unitId?: number;
    crimeHead?: string;
    crimeHeadId?: number;
    year?: number;
    startDate?: string;
    endDate?: string;
    name?: string; // Accused/Victim Name
    caseNo?: string; // CrimeNo or CaseNo
    accusedId?: string;
    compareWith?: string; // Other district/station
    compareWithId?: number;
  };
  confidence: number;
  pipelineStage: 'deterministic' | 'embedding' | 'llm';
}

export interface ExecutionStep {
  id: string;
  module: 'crime' | 'trends' | 'hotspot' | 'demographics' | 'comparison' | 'timeline' | 'profiling' | 'prediction' | 'network' | 'reporting';
  action: string;
  params: any;
  dependsOn?: string[];
}

export interface ExecutionPlan {
  steps: ExecutionStep[];
}

export interface ExplainableAI {
  intent: string;
  dataSource: string;
  rowsProcessed: number;
  confidence: string; // e.g. "98%"
  generatedUsing: string; // e.g. "Deterministic Parser -> SQL Template"
  executionTimeMs: number;
  sqlQuery?: string[];
}

export interface ApiResponse {
  status: 'success' | 'error';
  intent: string;
  data: any; // Raw JSON analytics result
  textResponse: string; // Conversational response (English or Kannada)
  voiceResponse?: string; // Base64 audio if requested
  metadata: ExplainableAI;
}
