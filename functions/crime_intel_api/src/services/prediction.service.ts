import { PredictionService } from '../core/services';
import { accusedRepository, caseRepository, chargesheetRepository } from '../db';

export class LocalPredictionService implements PredictionService {
  
  // 1. Time-Series Forecasting: Simple Exponential Smoothing & Moving Average
  async forecastCrimeCount(historicalCounts: { date: string; count: number }[], periods: number): Promise<{ date: string; count: number }[]> {
    if (historicalCounts.length === 0) {
      return Array.from({ length: periods }, (_, i) => ({ date: `Forecast Day ${i+1}`, count: 5 }));
    }

    // Sort historical counts by date
    const sorted = [...historicalCounts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Moving Average (window of 3)
    const windowSize = Math.min(3, sorted.length);
    let lastValue = sorted[sorted.length - 1].count;
    
    // Simple Exponential Smoothing (alpha = 0.3)
    const alpha = 0.3;
    let sesLevel = sorted[0].count;
    for (let i = 1; i < sorted.length; i++) {
      sesLevel = alpha * sorted[i].count + (1 - alpha) * sesLevel;
    }

    const forecasted: { date: string; count: number }[] = [];
    const lastDate = new Date(sorted[sorted.length - 1].date);

    for (let p = 1; p <= periods; p++) {
      // Calculate future date
      const nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + p);
      const dateStr = nextDate.toISOString().slice(0, 7); // YYYY-MM format

      // Combine MA and SES trends
      const rollingSum = sorted.slice(-windowSize).reduce((acc, curr) => acc + curr.count, 0);
      const ma = rollingSum / windowSize;
      const predictedVal = Math.round(0.6 * sesLevel + 0.4 * ma);
      
      forecasted.push({
        date: dateStr,
        count: Math.max(0, predictedVal)
      });
      
      // Update historical stream for rolling window simulation
      sorted.push({ date: dateStr, count: predictedVal });
    }

    return forecasted;
  }

  // 2. Repeat Offender Recidivism Prediction: Rule-based Scoring
  async predictRecidivism(accusedId: string): Promise<{ score: number; riskLevel: string; factors: string[] }> {
    // Look up accused details and history
    const history = await accusedRepository.getByPersonId(accusedId);
    
    if (history.length === 0) {
      return { score: 10, riskLevel: 'Low', factors: ['No previous records in database'] };
    }

    let score = 20; // baseline
    const factors: string[] = [];

    // Factor 1: Previous offence count
    const count = history.length;
    if (count > 3) {
      score += 40;
      factors.push(`Chronic repeat offender: ${count} prior arrests/charges`);
    } else if (count > 1) {
      score += 20;
      factors.push(`Repeat offender: ${count} prior arrests/charges`);
    } else {
      factors.push('First time offender, low previous records');
    }

    // Factor 2: Gravity of previous offenses
    // Look up cases linked to these offenses
    let heinousCount = 0;
    for (const record of history) {
      const caseObj = await caseRepository.getById(record.CaseMasterID);
      if (caseObj && caseObj.GravityOffenceID === 1) {
        heinousCount++;
      }
    }

    if (heinousCount > 0) {
      score += 20;
      factors.push(`Prior involvement in ${heinousCount} heinous crime(s)`);
    }

    // Factor 3: Age risk profile (younger age correlates with higher recidivism statistically)
    const primaryAccused = history[0];
    if (primaryAccused.AgeYear && primaryAccused.AgeYear < 30) {
      score += 15;
      factors.push(`Age profile: ${primaryAccused.AgeYear} years (Youth cohort)`);
    }

    // Cap score at 99%
    const finalScore = Math.min(99, score);
    let riskLevel = 'Low';
    if (finalScore >= 75) riskLevel = 'High';
    else if (finalScore >= 40) riskLevel = 'Medium';

    return {
      score: finalScore,
      riskLevel,
      factors
    };
  }

  // 3. Case Duration Prediction (Regression Baseline)
  async predictCaseDuration(crimeSubHeadId: number, districtId: number): Promise<{ durationDays: number; confidence: number }> {
    // We compute a baseline using the average historical time between CrimeRegisteredDate and csdate for chargesheeted cases
    // grouped by crimeSubHeadId.
    const cases = await caseRepository.list({ crimeHeadId: crimeSubHeadId });
    let totalDays = 0;
    let count = 0;

    for (const c of cases) {
      if (c.CaseStatusID === 2) { // Chargesheeted
        const cs = await chargesheetRepository.getByCaseId(c.CaseMasterID);
        if (cs && cs.csdate) {
          const registered = new Date(c.CrimeRegisteredDate).getTime();
          const filed = new Date(cs.csdate).getTime();
          const diffDays = (filed - registered) / (1000 * 60 * 60 * 24);
          if (diffDays > 0) {
            totalDays += diffDays;
            count++;
          }
        }
      }
    }

    // Baseline fallback if no historical chargesheets exist
    let avgDays = count > 0 ? Math.round(totalDays / count) : 90;
    
    // Custom factor: district workload offset
    const districtCasesCount = await caseRepository.count({ districtId });
    if (districtCasesCount > 100) {
      avgDays += 15; // Higher workload police district extends case duration
    }

    const confidence = count > 5 ? 85 : 60; // Higher confidence if more samples

    return {
      durationDays: avgDays,
      confidence
    };
  }
}
