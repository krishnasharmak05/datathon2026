import { caseRepository, complainantRepository, victimRepository, accusedRepository, chargesheetRepository, employeeRepository, policeStationRepository } from '../../db';
import { reportService } from '../../services';

export class ReportingAnalytics {
  async getCaseSummaryText(params: { caseNo?: string }) {
    if (!params.caseNo) {
      return { error: 'Case Number or Crime Number is required for summary generation.' };
    }

    const caseObj = await caseRepository.getByCrimeNo(params.caseNo);
    if (!caseObj) {
      return { error: `Case not found matching: "${params.caseNo}"` };
    }

    // Load full details for investigation report printout
    const caseId = caseObj.CaseMasterID;
    const [complainant, victims, accuseds, chargesheet, officer, station] = await Promise.all([
      complainantRepository.getByCaseId(caseId),
      victimRepository.getByCaseId(caseId),
      accusedRepository.getByCaseId(caseId),
      chargesheetRepository.getByCaseId(caseId),
      employeeRepository.getById(caseObj.PolicePersonID),
      policeStationRepository.getById(caseObj.PoliceStationID)
    ]);

    const reportData = {
      crimeNo: caseObj.CrimeNo,
      caseNo: caseObj.CaseNo,
      date: caseObj.CrimeRegisteredDate,
      stationName: station ? station.UnitName : 'N/A',
      officerName: officer ? officer.FirstName : 'N/A',
      facts: caseObj.BriefFacts,
      complainant: complainant ? complainant.ComplainantName : 'N/A',
      victims: victims.map(v => v.VictimName).join(', ') || 'N/A',
      accused: accuseds.map(a => a.AccusedName).join(', ') || 'N/A',
      chargesheeted: chargesheet ? `Yes, on ${chargesheet.csdate}` : 'Under Investigation'
    };

    // Trigger PDF Base64 generation
    const pdf = await reportService.generatePDF('Investigation_Summary', reportData);

    return {
      summaryText: `Investigation Summary for Crime No ${reportData.crimeNo}. Registered on ${reportData.date} at ${reportData.stationName}. Investigating Officer: ${reportData.officerName}. Complainant: ${reportData.complainant}. Accused: ${reportData.accused}. Brief Facts: ${reportData.facts}. Current status: ${reportData.chargesheeted}.`,
      pdfData: pdf
    };
  }
}
