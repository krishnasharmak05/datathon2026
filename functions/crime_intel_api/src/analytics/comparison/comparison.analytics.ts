import { caseRepository, districtRepository, policeStationRepository } from '../../db';

export class ComparisonAnalytics {
  async compareCrimeRates(params: {
    districtId: number;
    compareWithId: number;
    year?: number;
  }) {
    const [distA, distB] = await Promise.all([
      districtRepository.getById(params.districtId),
      districtRepository.getById(params.compareWithId)
    ]);

    const nameA = distA ? distA.DistrictName : `District ${params.districtId}`;
    const nameB = distB ? distB.DistrictName : `District ${params.compareWithId}`;

    const [totalA, totalB, bodyA, bodyB, theftA, theftB] = await Promise.all([
      caseRepository.count({ districtId: params.districtId, year: params.year }),
      caseRepository.count({ districtId: params.compareWithId, year: params.year }),
      caseRepository.count({ districtId: params.districtId, crimeHeadId: 1, year: params.year }),
      caseRepository.count({ districtId: params.compareWithId, crimeHeadId: 1, year: params.year }),
      caseRepository.count({ districtId: params.districtId, crimeHeadId: 2, year: params.year }),
      caseRepository.count({ districtId: params.compareWithId, crimeHeadId: 2, year: params.year })
    ]);

    const difference = Math.abs(totalA - totalB);
    const percentageDiff = totalA > 0 ? ((difference / totalA) * 100).toFixed(1) + '%' : 'N/A';

    return {
      comparison: [
        { metric: 'Total Cases', [nameA]: totalA, [nameB]: totalB },
        { metric: 'Crimes Against Body', [nameA]: bodyA, [nameB]: bodyB },
        { metric: 'Property Crimes', [nameA]: theftA, [nameB]: theftB },
      ],
      insights: {
        higherDistrict: totalA > totalB ? nameA : nameB,
        difference,
        percentageDiff,
        yearAnalyzed: params.year || 'All Years'
      }
    };
  }
}
