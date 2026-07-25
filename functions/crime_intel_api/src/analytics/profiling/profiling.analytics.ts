import { accusedRepository, caseRepository, employeeRepository, victimRepository, policeStationRepository } from '../../db';

export class ProfilingAnalytics {
  async getAccusedProfile(params: { name: string }) {
    // 1. Search matching accused records
    const matches = await accusedRepository.searchByName(params.name);
    if (matches.length === 0) {
      return { error: `No offender profile found matching: "${params.name}"` };
    }

    const uniquePids = Array.from(new Set(matches.map(m => m.PersonID)));
    const targetPid = uniquePids[0]; // Take the primary matching suspect
    
    // 2. Fetch full history for this suspect ID
    const history = await accusedRepository.getByPersonId(targetPid);
    const totalOffences = history.length;
    
    // Fetch cases, stations, officers, victims in parallel
    const casesDetails = await Promise.all(
      history.map(async (h) => {
        const cObj = await caseRepository.getById(h.CaseMasterID);
        if (!cObj) return null;

        const [officer, station, victims] = await Promise.all([
          employeeRepository.getById(cObj.PolicePersonID),
          policeStationRepository.getById(cObj.PoliceStationID),
          victimRepository.getByCaseId(cObj.CaseMasterID)
        ]);

        return {
          case: cObj,
          officerName: officer ? officer.FirstName : 'Unknown Officer',
          stationName: station ? station.UnitName : 'Unknown PS',
          victims: victims.map(v => v.VictimName)
        };
      })
    );

    const activeCases = casesDetails.filter(c => c !== null) as any[];

    // 3. Perform behavioral pattern calculations
    // Preferred crime type
    const crimeHeadCounts = new Map<number, { name: string; count: number }>();
    const locationsMap = new Map<string, number>();
    const officersSet = new Set<string>();
    const victimsMap = new Map<string, number>();
    const yearsList: number[] = [];

    for (const ac of activeCases) {
      const chId = ac.case.CrimeMajorHeadID;
      const chName = chId === 1 ? 'Body Offence' : chId === 2 ? 'Property Offence' : chId === 3 ? 'Cybercrime' : chId === 4 ? 'Narcotics' : chId === 5 ? 'White Collar' : 'Public Peace';
      
      // Crime head
      if (!crimeHeadCounts.has(chId)) {
        crimeHeadCounts.set(chId, { name: chName, count: 0 });
      }
      crimeHeadCounts.get(chId)!.count++;

      // Locations
      locationsMap.set(ac.stationName, (locationsMap.get(ac.stationName) || 0) + 1);

      // Officers
      officersSet.add(ac.officerName);

      // Victims
      for (const vName of ac.victims) {
        victimsMap.set(vName, (victimsMap.get(vName) || 0) + 1);
      }

      // Years
      const year = new Date(ac.case.CrimeRegisteredDate).getFullYear();
      if (!isNaN(year)) yearsList.push(year);
    }

    // Sort maps to find "preferred" habits
    const preferredCrime = Array.from(crimeHeadCounts.values()).sort((a, b) => b.count - a.count)[0]?.name || 'N/A';
    const preferredLocation = Array.from(locationsMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const victimOverlap = Array.from(victimsMap.entries()).filter(v => v[1] > 1).map(v => v[0]);
    
    // Sort years to calculate span
    yearsList.sort();
    const activeYearsSpan = yearsList.length ? `${yearsList[0]} - ${yearsList[yearsList.length - 1]}` : 'N/A';

    return {
      accusedName: matches[0].AccusedName,
      personId: targetPid,
      totalOffences,
      preferredCrime,
      preferredLocation,
      activeYearsSpan,
      officersInvolvedCount: officersSet.size,
      victimOverlap,
      offenceHistory: activeCases.map(ac => ({
        crimeNo: ac.case.CrimeNo,
        date: ac.case.CrimeRegisteredDate,
        station: ac.stationName,
        officer: ac.officerName,
        briefFacts: ac.case.BriefFacts
      }))
    };
  }
}
