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

export async function submitQuery(query: string, language: 'en' | 'kn' = 'en', isTerminal?: boolean): Promise<QueryResponse> {
  const res = await fetch(`${BASE_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, language, isTerminal }),
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

export interface TimelineResponse {
  status: 'success' | 'error';
  data: {
    caseNo: string;
    events: {
      stage: string;
      date: string;
      details: string;
      officer: string;
    }[];
  };
}

export async function fetchCaseTimeline(caseNo: string): Promise<TimelineResponse> {
  const res = await fetch(`${BASE_URL}/timeline/${caseNo}`);
  if (!res.ok) {
    throw new Error('Failed to fetch case timeline');
  }
  return res.json();
}

export async function fetchAccusedNetwork(q: string, personId?: string): Promise<any> {
  const url = personId 
    ? `${BASE_URL}/network?personId=${encodeURIComponent(personId)}`
    : `${BASE_URL}/network?q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok && res.status !== 409) {
    throw new Error('Failed to fetch accused network');
  }
  return res.json();
}

export async function fetchAccusedProfile(q: string, personId?: string): Promise<any> {
  const url = personId 
    ? `${BASE_URL}/profile?personId=${encodeURIComponent(personId)}`
    : `${BASE_URL}/profile?q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok && res.status !== 409) {
    throw new Error('Failed to fetch accused profile');
  }
  return res.json();
}

export async function fetchHotspots(crimeHeadId?: number): Promise<any> {
  const url = crimeHeadId ? `${BASE_URL}/hotspots?crimeHeadId=${crimeHeadId}` : `${BASE_URL}/hotspots`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch hotspots');
  }
  return res.json();
}


