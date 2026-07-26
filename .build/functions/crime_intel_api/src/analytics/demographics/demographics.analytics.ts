import { analyticsRepository } from '../../db';

export class DemographicAnalytics {
  async getDemographicsSummary() {
    const rawData = await analyticsRepository.getDemographicsData();
    return rawData;
  }
}
