import { ParsedQuery, ExecutionPlan, ExecutionStep } from '../core/pipeline';

export class ExecutionPlanner {
  plan(parsed: ParsedQuery): ExecutionPlan {
    const steps: ExecutionStep[] = [];
    const { intent, entities } = parsed;

    console.log(`[Planner] Drafting execution plan for Intent: ${intent}`);

    switch (intent) {
      case 'COUNT':
        steps.push({
          id: 'step_count_cases',
          module: 'crime',
          action: 'getCrimeCount',
          params: {
            districtId: entities.districtId,
            unitId: entities.unitId,
            crimeHeadId: entities.crimeHeadId,
            year: entities.year
          }
        });
        break;

      case 'LIST':
        steps.push({
          id: 'step_list_cases',
          module: 'crime',
          action: 'listCases',
          params: {
            districtId: entities.districtId,
            unitId: entities.unitId,
            crimeHeadId: entities.crimeHeadId,
            year: entities.year
          }
        });
        break;

      case 'LOOKUP':
        steps.push({
          id: 'step_lookup_case',
          module: 'crime',
          action: 'lookupCaseDetails',
          params: {
            caseNo: entities.caseNo
          }
        });
        break;

      case 'TREND':
        steps.push({
          id: 'step_trend_analysis',
          module: 'trends',
          action: 'getMonthlyTrends',
          params: {
            years: entities.year ? [entities.year] : [2022, 2023, 2024, 2025, 2026]
          }
        });
        break;

      case 'HOTSPOT':
        steps.push({
          id: 'step_hotspot_coords',
          module: 'hotspot',
          action: 'detectHotspots',
          params: {
            districtId: entities.districtId,
            crimeHeadId: entities.crimeHeadId
          }
        });
        break;

      case 'NETWORK':
        steps.push({
          id: 'step_network_graph',
          module: 'network',
          action: 'getAccusedNetwork',
          params: {
            name: entities.name || 'Rajesh'
          }
        });
        break;

      case 'TIMELINE':
        steps.push({
          id: 'step_timeline_progression',
          module: 'timeline',
          action: 'getTimelineEvents',
          params: {
            caseNo: entities.caseNo
          }
        });
        break;

      case 'PROFILE':
        steps.push({
          id: 'step_offender_profiling',
          module: 'profiling',
          action: 'getAccusedProfile',
          params: {
            name: entities.name || 'Rajesh'
          }
        });
        break;

      case 'PREDICTION':
        // Determine whether forecasting volume, recidivism, or duration
        const textParams = JSON.stringify(entities).toLowerCase();
        if (entities.name) {
          // Recidivism risk prediction
          steps.push({
            id: 'step_predict_recidivism',
            module: 'prediction',
            action: 'predictRecidivism',
            params: {
              name: entities.name
            }
          });
        } else if (entities.crimeHeadId || entities.districtId) {
          // Case duration prediction
          steps.push({
            id: 'step_predict_duration',
            module: 'prediction',
            action: 'predictCaseDuration',
            params: {
              crimeSubHeadId: entities.crimeHeadId || 1,
              districtId: entities.districtId || 1
            }
          });
        } else {
          // Default: Time-series forecasting
          steps.push({
            id: 'step_forecast_volume',
            module: 'prediction',
            action: 'forecastVolume',
            params: {
              periods: 6
            }
          });
        }
        break;

      case 'COMPARE':
        // Generate comparative data steps for districts/stations
        steps.push({
          id: 'step_compare_locations',
          module: 'comparison',
          action: 'compareCrimeRates',
          params: {
            districtId: entities.districtId || 1,
            compareWithId: entities.compareWithId || 2,
            year: entities.year
          }
        });
        break;

      case 'SUMMARY':
      default:
        steps.push({
          id: 'step_case_summary',
          module: 'reporting',
          action: 'getCaseSummaryText',
          params: {
            caseNo: entities.caseNo
          }
        });
        break;
    }

    return { steps };
  }
}
