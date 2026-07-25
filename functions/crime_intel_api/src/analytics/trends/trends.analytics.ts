import { analyticsRepository } from '../../db';

export class TrendAnalytics {
  async getMonthlyTrends(params: { years: number[] }) {
    const rawTrends = await analyticsRepository.getTrendData(params.years);
    
    // Group trends by year for YoY calculations
    const yearGroups = new Map<number, { month: string; count: number }[]>();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (const row of rawTrends) {
      if (!yearGroups.has(row.year)) {
        yearGroups.set(row.year, []);
      }
      const monthIndex = parseInt(row.month, 10) - 1;
      const monthLabel = monthNames[monthIndex] || row.month;
      
      yearGroups.get(row.year)!.push({
        month: monthLabel,
        count: row.count
      });
    }

    // Compile into chart dataset
    const formattedData: any[] = [];
    const allMonths = monthNames;

    for (let mIdx = 0; mIdx < 12; mIdx++) {
      const monthLabel = allMonths[mIdx];
      const monthRow: any = { month: monthLabel };
      
      for (const year of params.years) {
        const yearData = yearGroups.get(year) || [];
        const match = yearData.find(y => y.month === monthLabel);
        monthRow[`year_${year}`] = match ? match.count : 0;
      }
      formattedData.push(monthRow);
    }

    // Calculate YoY growth rate between latest two years
    let yoyGrowth = 'N/A';
    if (params.years.length >= 2) {
      const sortedYears = [...params.years].sort();
      const prevYear = sortedYears[sortedYears.length - 2];
      const currYear = sortedYears[sortedYears.length - 1];

      const prevTotal = (yearGroups.get(prevYear) || []).reduce((acc, curr) => acc + curr.count, 0);
      const currTotal = (yearGroups.get(currYear) || []).reduce((acc, curr) => acc + curr.count, 0);

      if (prevTotal > 0) {
        const rate = ((currTotal - prevTotal) / prevTotal) * 100;
        yoyGrowth = `${rate > 0 ? '+' : ''}${rate.toFixed(1)}%`;
      }
    }

    return {
      chartData: formattedData,
      yoyGrowth,
      yearsList: params.years
    };
  }
}
