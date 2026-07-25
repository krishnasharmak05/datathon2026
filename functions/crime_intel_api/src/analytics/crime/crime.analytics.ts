import { caseRepository, complainantRepository, victimRepository, accusedRepository, chargesheetRepository, actRepository } from '../../db';

export class CrimeAnalytics {
  async getCrimeCount(params: {
    districtId?: number;
    unitId?: number;
    crimeHeadId?: number;
    year?: number;
  }) {
    const count = await caseRepository.count(params);
    return { count };
  }

  async listCases(params: {
    districtId?: number;
    unitId?: number;
    crimeHeadId?: number;
    year?: number;
  }) {
    const cases = await caseRepository.list(params);
    return cases.slice(0, 50); // Cap list view for performance
  }

  async lookupCaseDetails(params: { caseNo: string }) {
    const caseObj = await caseRepository.getByCrimeNo(params.caseNo);
    if (!caseObj) {
      return { error: 'Case not found' };
    }

    const caseId = caseObj.CaseMasterID;
    
    // Fetch details in parallel
    const [complainant, victims, accuseds, chargesheet] = await Promise.all([
      complainantRepository.getByCaseId(caseId),
      victimRepository.getByCaseId(caseId),
      accusedRepository.getByCaseId(caseId),
      chargesheetRepository.getByCaseId(caseId)
    ]);

    return {
      case: caseObj,
      complainant,
      victims,
      accuseds,
      chargesheet
    };
  }
}
