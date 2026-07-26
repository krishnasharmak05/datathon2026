export interface ParsedQuery {
  intent: string; // COUNT | LIST | TREND | HOTSPOT | COMPARE | TIMELINE | NETWORK | PREDICTION | SUMMARY | PROFILE | LOOKUP
  entities: {
    district?: string;
    districtId?: number;
    unit?: string;
    unitId?: number;
    crimeHead?: string;
    crimeHeadId?: number;
    crimeSubHead?: string;
    crimeSubHeadId?: number;
    year?: number;
    startDate?: string;
    endDate?: string;
    name?: string; // Accused/Victim Name
    caseNo?: string; // CrimeNo or CaseNo
    accusedId?: string;
    compareWith?: string; // Other district/station
    compareWithId?: number;

    // Additional ERD schema entities:
    act?: string;               // e.g. IPC, NDPS
    section?: string;           // e.g. 302, 379
    caseCategory?: string;      // e.g. FIR, UDR, Zero FIR, PAR
    caseCategoryId?: number;    // e.g. 1, 2, 3, 4
    gravity?: string;           // e.g. Heinous, Non-Heinous
    gravityId?: number;         // e.g. 1, 2
    caseStatus?: string;        // e.g. Under Investigation, Charge Sheeted, Closed
    caseStatusId?: number;      // e.g. 1, 2, 3
    caste?: string;             // e.g. General, OBC, SC, ST
    casteId?: number;           // e.g. 1, 2, 3, 4
    religion?: string;          // e.g. Hindu, Muslim, Christian, Sikh, Jain
    religionId?: number;        // e.g. 1, 2, 3, 4, 5
    occupation?: string;        // e.g. Farmer, Business Owner, etc.
    occupationId?: number;      // e.g. 1, 2, 3, 4, 5, 6
    complainantGender?: string; // e.g. Male, Female, Transgender
    complainantGenderId?: number;
    victimGender?: string;      // e.g. Male, Female, Transgender
    victimGenderId?: number;
    accusedGender?: string;     // e.g. Male, Female, Transgender
    accusedGenderId?: number;
    officerKgid?: string;       // e.g. KG-20001
    officerName?: string;       // e.g. Amit
    officerId?: number;         // e.g. 1 (EmployeeID)
    victimPolice?: number;      // 0 or 1
    csType?: string;            // A, B, or C
    courtId?: number;
    invalidQuery?: boolean;
    contradiction?: boolean;
    noChargesheet?: boolean;
    noAccused?: boolean;
    noVictim?: boolean;
    noArrest?: boolean;
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
