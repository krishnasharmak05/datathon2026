import * as repos from '../core/repos';

// For production deployment, Catalyst Data Store uses Search SQL / Query API.
// We import and initialize Zoho Catalyst Node SDK here (stubbed).
// const catalyst = require('zcatalyst-sdk-node');

export class CatalystCaseRepository implements repos.CaseRepository {
  async getById(id: number): Promise<repos.Case | null> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment. Currently running in SQLite local dev mode.');
  }

  async getByCrimeNo(crimeNo: string): Promise<repos.Case | null> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }

  async list(filter?: any): Promise<repos.Case[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }

  async count(filter?: any): Promise<number> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
}

export class CatalystAccusedRepository implements repos.AccusedRepository {
  async getById(id: number): Promise<repos.Accused | null> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
  async getByCaseId(caseId: number): Promise<repos.Accused[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
  async getByPersonId(personId: string): Promise<repos.Accused[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
  async listRepeatOffenders(): Promise<any[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
  async searchByName(name: string): Promise<repos.Accused[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
}

export class CatalystVictimRepository implements repos.VictimRepository {
  async getByCaseId(caseId: number): Promise<repos.Victim[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
}

export class CatalystComplainantRepository implements repos.ComplainantRepository {
  async getByCaseId(caseId: number): Promise<repos.Complainant | null> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
}

export class CatalystEmployeeRepository implements repos.EmployeeRepository {
  async getById(id: number): Promise<repos.Employee | null> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
  async list(): Promise<repos.Employee[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
  async listWorkload(): Promise<any[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
}

export class CatalystPoliceStationRepository implements repos.PoliceStationRepository {
  async getById(id: number): Promise<repos.Unit | null> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
  async list(): Promise<repos.Unit[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
}

export class CatalystDistrictRepository implements repos.DistrictRepository {
  async getById(id: number): Promise<repos.District | null> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
  async list(): Promise<repos.District[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
}

export class CatalystCourtRepository implements repos.CourtRepository {
  async getById(id: number): Promise<repos.Court | null> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
  async list(): Promise<repos.Court[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
}

export class CatalystCrimeHeadRepository implements repos.CrimeHeadRepository {
  async list(): Promise<repos.CrimeHead[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
}

export class CatalystCrimeSubHeadRepository implements repos.CrimeSubHeadRepository {
  async list(): Promise<repos.CrimeSubHead[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
}

export class CatalystActRepository implements repos.ActRepository {
  async list(): Promise<repos.Act[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
}

export class CatalystSectionRepository implements repos.SectionRepository {
  async listByAct(actCode: string): Promise<repos.Section[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
}

export class CatalystChargesheetRepository implements repos.ChargesheetRepository {
  async getByCaseId(caseId: number): Promise<repos.Chargesheet | null> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
}

export class CatalystAnalyticsRepository implements repos.AnalyticsRepository {
  async getCrimeDistribution(): Promise<any[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
  async getDistrictStats(): Promise<any[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
  async getStationStats(): Promise<any[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
  async getTimelineEvents(caseNoOrCrimeNo: string): Promise<any[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
  async getDemographicsData(): Promise<any> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
  async getTrendData(years?: number[]): Promise<any[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
  async getNetworkData(accusedName: string): Promise<any> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
  async getGeospatialPoints(filter?: any): Promise<any[]> {
    throw new Error('Catalyst Repository is only supported in Zoho Cloud Environment.');
  }
}
