import * as repos from '../core/repos';
import * as catalyst from './catalyst.repo';

export const caseRepository: repos.CaseRepository = new catalyst.CatalystCaseRepository();
export const accusedRepository: repos.AccusedRepository = new catalyst.CatalystAccusedRepository();
export const victimRepository: repos.VictimRepository = new catalyst.CatalystVictimRepository();
export const complainantRepository: repos.ComplainantRepository = new catalyst.CatalystComplainantRepository();
export const employeeRepository: repos.EmployeeRepository = new catalyst.CatalystEmployeeRepository();
export const policeStationRepository: repos.PoliceStationRepository = new catalyst.CatalystPoliceStationRepository();
export const districtRepository: repos.DistrictRepository = new catalyst.CatalystDistrictRepository();
export const courtRepository: repos.CourtRepository = new catalyst.CatalystCourtRepository();
export const crimeHeadRepository: repos.CrimeHeadRepository = new catalyst.CatalystCrimeHeadRepository();
export const crimeSubHeadRepository: repos.CrimeSubHeadRepository = new catalyst.CatalystCrimeSubHeadRepository();
export const actRepository: repos.ActRepository = new catalyst.CatalystActRepository();
export const sectionRepository: repos.SectionRepository = new catalyst.CatalystSectionRepository();
export const chargesheetRepository: repos.ChargesheetRepository = new catalyst.CatalystChargesheetRepository();
export const analyticsRepository: repos.AnalyticsRepository = new catalyst.CatalystAnalyticsRepository();
