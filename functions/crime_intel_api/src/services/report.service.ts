import { ReportService } from '../core/services';

export class LocalPDFGenerator implements ReportService {
  async generatePDF(reportType: string, data: any): Promise<{ pdfBase64: string; fileName: string }> {
    // Generate a simple text-based summary representing a PDF.
    // Client-side will catch this and render a clean, printable PDF report view.
    const fileTitle = `${reportType}_Report_${Date.now()}`;
    const mockPdfContent = `
=========================================
      KARNATAKA POLICE DEPARTMENT
=========================================
REPORT TYPE: ${reportType.toUpperCase()}
GENERATED ON: ${new Date().toLocaleString()}
DATA SUMMARY:
${JSON.stringify(data, null, 2)}
=========================================
    CONFIDENTIAL - OFFICIAL USE ONLY
=========================================
    `;
    const base64 = Buffer.from(mockPdfContent).toString('base64');

    return {
      pdfBase64: base64,
      fileName: `${fileTitle}.pdf`
    };
  }
}

export class SmartBrowzReportService implements ReportService {
  async generatePDF(reportType: string, data: any): Promise<any> {
    throw new Error('SmartBrowz Report Service is only supported in Zoho Cloud Environment.');
  }
}
