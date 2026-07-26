import { PredictionService } from '../core/services';
import { accusedRepository, caseRepository, chargesheetRepository } from '../db';

export class CatalystQuickMLPredictionService implements PredictionService {
  
  async forecastCrimeCount(historicalCounts: { date: string; count: number }[], periods: number): Promise<{ date: string; count: number }[]> {
    try {
      const projectId = process.env.CATALYST_PROJECT_ID;
      const apiDomain = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.com';
      const endpoint = `${apiDomain}/v1/project/${projectId}/quickml/prediction/forecast`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CATALYST_QUICKML_API_KEY || ''}`
        },
        body: JSON.stringify({ historicalCounts, periods })
      });

      if (!response.ok) {
        throw new Error(`QuickML forecast failed: ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data.forecast || [];
    } catch (error) {
      console.warn('Falling back to local exponential smoothing forecast:', error);
      return this.localForecast(historicalCounts, periods);
    }
  }

  async predictRecidivism(accusedId: string): Promise<{ score: number; riskLevel: string; factors: string[] }> {
    try {
      const projectId = process.env.CATALYST_PROJECT_ID;
      const apiDomain = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.com';
      const endpoint = `${apiDomain}/v1/project/${projectId}/quickml/prediction/recidivism`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CATALYST_QUICKML_API_KEY || ''}`
        },
        body: JSON.stringify({ accusedId })
      });

      if (!response.ok) {
        throw new Error(`QuickML recidivism prediction failed: ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data.prediction || { score: 10, riskLevel: 'Low', factors: [] };
    } catch (error) {
      console.warn('Falling back to local recidivism heuristic:', error);
      return this.localRecidivism(accusedId);
    }
  }

  async predictCaseDuration(crimeSubHeadId: number, districtId: number): Promise<{ durationDays: number; confidence: number }> {
    try {
      const projectId = process.env.CATALYST_PROJECT_ID;
      const apiDomain = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.com';
      const endpoint = `${apiDomain}/v1/project/${projectId}/quickml/prediction/duration`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CATALYST_QUICKML_API_KEY || ''}`
        },
        body: JSON.stringify({ crimeSubHeadId, districtId })
      });

      if (!response.ok) {
        throw new Error(`QuickML duration prediction failed: ${response.status}`);
      }

      const data = (await response.json()) as any;
      return data.prediction || { durationDays: 90, confidence: 60 };
    } catch (error) {
      console.warn('Falling back to local case duration baseline:', error);
      return this.localCaseDuration(crimeSubHeadId, districtId);
    }
  }

  private async localForecast(historicalCounts: { date: string; count: number }[], periods: number): Promise<{ date: string; count: number }[]> {
    if (historicalCounts.length === 0) {
      return Array.from({ length: periods }, (_, i) => ({ date: `Forecast Day ${i+1}`, count: 5 }));
    }

    const sorted = [...historicalCounts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const windowSize = Math.min(3, sorted.length);
    const alpha = 0.3;
    let sesLevel = sorted[0].count;

    for (let i = 1; i < sorted.length; i++) {
      sesLevel = alpha * sorted[i].count + (1 - alpha) * sesLevel;
    }

    const forecasted: { date: string; count: number }[] = [];
    const lastDate = new Date(sorted[sorted.length - 1].date);

    for (let p = 1; p <= periods; p++) {
      const nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + p);
      const dateStr = nextDate.toISOString().slice(0, 7);

      const rollingSum = sorted.slice(-windowSize).reduce((acc, curr) => acc + curr.count, 0);
      const ma = rollingSum / windowSize;
      const predictedVal = Math.round(0.6 * sesLevel + 0.4 * ma);
      
      forecasted.push({
        date: dateStr,
        count: Math.max(0, predictedVal)
      });
      sorted.push({ date: dateStr, count: predictedVal });
    }

    return forecasted;
  }

  private async localRecidivism(accusedId: string): Promise<{ score: number; riskLevel: string; factors: string[] }> {
    const history = await accusedRepository.getByPersonId(accusedId);
    if (history.length === 0) {
      return { score: 10, riskLevel: 'Low', factors: ['No previous records in database'] };
    }

    let score = 20;
    const factors: string[] = [];

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

    const primaryAccused = history[0];
    if (primaryAccused.AgeYear && primaryAccused.AgeYear < 30) {
      score += 15;
      factors.push(`Age profile: ${primaryAccused.AgeYear} years (Youth cohort)`);
    }

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

  private async localCaseDuration(crimeSubHeadId: number, districtId: number): Promise<{ durationDays: number; confidence: number }> {
    const cases = await caseRepository.list({ crimeHeadId: crimeSubHeadId });
    let totalDays = 0;
    let count = 0;

    for (const c of cases) {
      if (c.CaseStatusID === 2) {
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

    let avgDays = count > 0 ? Math.round(totalDays / count) : 90;
    const districtCasesCount = await caseRepository.count({ districtId });
    if (districtCasesCount > 100) {
      avgDays += 15;
    }

    const confidence = count > 5 ? 85 : 60;

    return {
      durationDays: avgDays,
      confidence
    };
  }
}
