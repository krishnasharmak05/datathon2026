const BASE_URL = 'http://localhost:5000/api';

export interface QueryResponse {
  status: 'success' | 'error';
  intent: string;
  data: any;
  textResponse: string;
  metadata: {
    intent: string;
    dataSource: string;
    rowsProcessed: number;
    confidence: string;
    generatedUsing: string;
    executionTimeMs: number;
    sqlQuery?: string[];
  };
}

export interface DemographicsResponse {
  status: 'success';
  data: {
    ageGroups: { group: string; count: number }[];
    genderGroups: { gender: string; count: number }[];
    religionGroups: { religion: string; count: number }[];
    casteGroups: { caste: string; count: number }[];
  };
}

export interface StatsResponse {
  status: 'success';
  data: {
    distribution: { name: string; count: number }[];
    districts: { DistrictName: string; caseCount: number; arrestCount: number }[];
    stations: { UnitName: string; caseCount: number; chargesheetCount: number }[];
  };
}

export async function submitQuery(query: string, language: 'en' | 'kn' = 'en'): Promise<QueryResponse> {
  const res = await fetch(`${BASE_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, language }),
  });
  if (!res.ok) {
    throw new Error('API server returned an error');
  }
  return res.json();
}

export async function fetchDemographics(): Promise<DemographicsResponse> {
  const res = await fetch(`${BASE_URL}/demographics`);
  if (!res.ok) {
    throw new Error('Failed to fetch demographic metrics');
  }
  return res.json();
}

export async function fetchStats(): Promise<StatsResponse> {
  const res = await fetch(`${BASE_URL}/stats`);
  if (!res.ok) {
    throw new Error('Failed to fetch stats');
  }
  return res.json();
}
