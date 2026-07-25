import * as repos from '../core/repos';
import * as sqlite from './sqlite.repo';
import * as catalyst from './catalyst.repo';

const provider = process.env.DATABASE_PROVIDER || 'sqlite';

export const caseRepository: repos.CaseRepository = 
  provider === 'catalyst' ? new catalyst.CatalystCaseRepository() : new sqlite.SQLiteCaseRepository();

export const accusedRepository: repos.AccusedRepository =
  provider === 'catalyst' ? new catalyst.CatalystAccusedRepository() : new sqlite.SQLiteAccusedRepository();

export const victimRepository: repos.VictimRepository =
  provider === 'catalyst' ? new catalyst.CatalystVictimRepository() : new sqlite.SQLiteVictimRepository();

export const complainantRepository: repos.ComplainantRepository =
  provider === 'catalyst' ? new catalyst.CatalystComplainantRepository() : new sqlite.SQLiteComplainantRepository();

export const employeeRepository: repos.EmployeeRepository =
  provider === 'catalyst' ? new catalyst.CatalystEmployeeRepository() : new sqlite.SQLiteEmployeeRepository();

export const policeStationRepository: repos.PoliceStationRepository =
  provider === 'catalyst' ? new catalyst.CatalystPoliceStationRepository() : new sqlite.SQLitePoliceStationRepository();

export const districtRepository: repos.DistrictRepository =
  provider === 'catalyst' ? new catalyst.CatalystDistrictRepository() : new sqlite.SQLiteDistrictRepository();

export const courtRepository: repos.CourtRepository =
  provider === 'catalyst' ? new catalyst.CatalystCourtRepository() : new sqlite.SQLiteCourtRepository();

export const crimeHeadRepository: repos.CrimeHeadRepository =
  provider === 'catalyst' ? new catalyst.CatalystCrimeHeadRepository() : new sqlite.SQLiteCrimeHeadRepository();

export const crimeSubHeadRepository: repos.CrimeSubHeadRepository =
  provider === 'catalyst' ? new catalyst.CatalystCrimeSubHeadRepository() : new sqlite.SQLiteCrimeSubHeadRepository();

export const actRepository: repos.ActRepository =
  provider === 'catalyst' ? new catalyst.CatalystActRepository() : new sqlite.SQLiteActRepository();

export const sectionRepository: repos.SectionRepository =
  provider === 'catalyst' ? new catalyst.CatalystSectionRepository() : new sqlite.SQLiteSectionRepository();

export const chargesheetRepository: repos.ChargesheetRepository =
  provider === 'catalyst' ? new catalyst.CatalystChargesheetRepository() : new sqlite.SQLiteChargesheetRepository();

export const analyticsRepository: repos.AnalyticsRepository =
  provider === 'catalyst' ? new catalyst.CatalystAnalyticsRepository() : new sqlite.SQLiteAnalyticsRepository();
