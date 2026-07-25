import { predictionService } from '../../services';
import { accusedRepository, analyticsRepository } from '../../db';

export class PredictionAnalytics {
  
  async predictRecidivism(params: { name: string }) {
    let matches = await accusedRepository.getByPersonId(params.name);
    if (!matches || matches.length === 0) {
      matches = await accusedRepository.searchByName(params.name);
    }
    if (matches.length === 0) {
      return { error: `No accused record found matching: "${params.name}"` };
    }
    const pid = matches[0].PersonID;
    const prediction = await predictionService.predictRecidivism(pid);
    return {
      accusedName: matches[0].AccusedName,
      personId: pid,
      ...prediction
    };
  }

  async predictCaseDuration(params: { crimeSubHeadId: number, districtId: number }) {
    const prediction = await predictionService.predictCaseDuration(params.crimeSubHeadId, params.districtId);
    return prediction;
  }

  async forecastVolume(params: { periods: number }) {
    // 1. Get historical counts from database
    const history = await analyticsRepository.getTrendData([2023, 2024, 2025]);
    
    // Group monthly
    const formattedHistory = history.map(h => ({
      date: `${h.year}-${h.month}`,
      count: h.count
    }));

    // 2. Run forecast model
    const forecast = await predictionService.forecastCrimeCount(formattedHistory, params.periods);
    
    return {
      historical: formattedHistory.slice(-12), // return last 12 months for chart comparisons
      forecast
    };
  }
}
