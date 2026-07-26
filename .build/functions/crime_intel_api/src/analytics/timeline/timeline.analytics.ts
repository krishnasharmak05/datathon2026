import { analyticsRepository } from '../../db';

export class TimelineAnalytics {
  async getTimelineEvents(params: { caseNo?: string }) {
    if (!params.caseNo) {
      return { error: 'Case Number or Crime Number is required for timeline analysis' };
    }
    const events = await analyticsRepository.getTimelineEvents(params.caseNo);
    return {
      caseNo: params.caseNo,
      events
    };
  }
}
