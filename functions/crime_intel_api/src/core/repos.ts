export interface Case {
  CaseMasterID: number;
  CrimeNo: string;
  CaseNo: string;
  CrimeRegisteredDate: string;
  PolicePersonID: number;
  PoliceStationID: number;
  CaseCategoryID: number;
  GravityOffenceID: number;
  CrimeMajorHeadID: number;
  CrimeMinorHeadID: number;
  CaseStatusID: number;
  CourtID: number;
  IncidentFromDate?: string;
  IncidentToDate?: string;
  InfoReceivedPSDate?: string;
  latitude: number;
  longitude: number;
  BriefFacts: string;
}

export interface Accused {
  AccusedMasterID: number;
  CaseMasterID: number;
  AccusedName: string;
  AgeYear?: number;
  GenderID?: number;
  PersonID: string;
}

export interface Victim {
  VictimMasterID: number;
  CaseMasterID: number;
  VictimName: string;
  AgeYear?: number;
  GenderID?: number;
  VictimPolice?: string;
}

export interface Complainant {
  ComplainantID: number;
  CaseMasterID: number;
  ComplainantName: string;
  AgeYear?: number;
  OccupationID?: number;
  ReligionID?: number;
  CasteID?: number;
  GenderID?: number;
}

export interface Employee {
  EmployeeID: number;
  DistrictID: number;
  UnitID: number;
  RankID: number;
  DesignationID: number;
  KGID: string;
  FirstName: string;
  EmployeeDOB?: string;
  GenderID?: number;
  BloodGroupID?: number;
  PhysicallyChallenged?: number;
  AppointmentDate?: string;
}

export interface Unit {
  UnitID: number;
  UnitName: string;
  TypeID?: number;
  ParentUnit?: number;
  NationalityID?: number;
  StateID?: number;
  DistrictID: number;
  Active?: number;
}

export interface District {
  DistrictID: number;
  DistrictName: string;
  StateID: number;
  Active?: number;
}

export interface Court {
  CourtID: number;
  CourtName: string;
  DistrictID: number;
  StateID: number;
  Active?: number;
}

export interface CrimeHead {
  CrimeHeadID: number;
  CrimeGroupName: string;
  Active?: number;
}

export interface CrimeSubHead {
  CrimeSubHeadID: number;
  CrimeHeadID: number;
  CrimeHeadName: string;
  SeqID?: number;
}

export interface Act {
  ActCode: string;
  ActDescription?: string;
  ShortName?: string;
  Active?: number;
}

export interface Section {
  ActCode: string;
  SectionCode: string;
  SectionDescription?: string;
  Active?: number;
}

export interface Chargesheet {
  CSID: number;
  CaseMasterID: number;
  csdate: string;
  cstype?: string;
  PolicePersonID?: number;
}

// Repository Interfaces
export interface CaseRepository {
  getById(id: number): Promise<Case | null>;
  getByCrimeNo(crimeNo: string): Promise<Case | null>;
  list(filter?: {
    districtId?: number;
    unitId?: number;
    crimeHeadId?: number;
    crimeSubHeadId?: number;
    year?: number;
    startDate?: string;
    endDate?: string;
    [key: string]: any;
  }): Promise<Case[]>;
  count(filter?: {
    districtId?: number;
    unitId?: number;
    crimeHeadId?: number;
    crimeSubHeadId?: number;
    year?: number;
    startDate?: string;
    endDate?: string;
    [key: string]: any;
  }): Promise<number>;
}

export interface AccusedRepository {
  getById(id: number): Promise<Accused | null>;
  getByCaseId(caseId: number): Promise<Accused[]>;
  getByPersonId(personId: string): Promise<Accused[]>;
  listRepeatOffenders(): Promise<{ AccusedName: string; PersonID: string; offenceCount: number }[]>;
  searchByName(name: string): Promise<Accused[]>;
}

export interface VictimRepository {
  getByCaseId(caseId: number): Promise<Victim[]>;
}

export interface ComplainantRepository {
  getByCaseId(caseId: number): Promise<Complainant | null>;
}

export interface EmployeeRepository {
  getById(id: number): Promise<Employee | null>;
  list(): Promise<Employee[]>;
  listWorkload(): Promise<{ OfficerName: string; activeCases: number; chargesheetsFiled: number }[]>;
}

export interface PoliceStationRepository {
  getById(id: number): Promise<Unit | null>;
  list(): Promise<Unit[]>;
}

export interface DistrictRepository {
  getById(id: number): Promise<District | null>;
  list(): Promise<District[]>;
}

export interface CourtRepository {
  getById(id: number): Promise<Court | null>;
  list(): Promise<Court[]>;
}

export interface CrimeHeadRepository {
  list(): Promise<CrimeHead[]>;
}

export interface CrimeSubHeadRepository {
  list(): Promise<CrimeSubHead[]>;
}

export interface ActRepository {
  list(): Promise<Act[]>;
}

export interface SectionRepository {
  listByAct(actCode: string): Promise<Section[]>;
}

export interface ChargesheetRepository {
  getByCaseId(caseId: number): Promise<Chargesheet | null>;
}

export interface AnalyticsRepository {
  getCrimeDistribution(): Promise<{ name: string; count: number }[]>;
  getDistrictStats(): Promise<{ DistrictName: string; caseCount: number; arrestCount: number }[]>;
  getStationStats(): Promise<{ UnitName: string; caseCount: number; chargesheetCount: number }[]>;
  getTimelineEvents(caseNoOrCrimeNo: string): Promise<{
    stage: string;
    date: string;
    details: string;
    officer: string;
  }[]>;
  getDemographicsData(): Promise<{
    ageGroups: { group: string; count: number }[];
    genderGroups: { gender: string; count: number }[];
    religionGroups: { religion: string; count: number }[];
    casteGroups: { caste: string; count: number }[];
  }>;
  getTrendData(years?: number[]): Promise<{ year: number; month: string; count: number }[]>;
  getNetworkData(accusedName: string): Promise<{
    nodes: { id: string; label: string; type: string }[];
    edges: { id: string; source: string; target: string; label: string }[];
  }>;
  getGeospatialPoints(filter?: { districtId?: number; crimeHeadId?: number }): Promise<{ latitude: number; longitude: number; crimeGroup: string; id: number }[]>;
}
