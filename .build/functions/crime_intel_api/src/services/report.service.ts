import { ReportService } from '../core/services';
import { CatalystContext } from '../core/context';

export class SmartBrowzReportService implements ReportService {
  async generatePDF(reportType: string, data: any): Promise<{ pdfBase64: string; fileName: string }> {
    try {
      const fileTitle = `${reportType}_Report_${Date.now()}`;
      
      // Build modern styled HTML content for premium report generation
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; background: #fafafa; }
              .header { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
              .header h1 { font-size: 24px; color: #1e3a8a; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
              .header h2 { font-size: 14px; color: #475569; margin: 5px 0 0 0; }
              .details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
              .detail-item { font-size: 14px; }
              .detail-label { font-weight: bold; color: #475569; }
              .facts-box { background: #fff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 30px; line-height: 1.6; }
              .footer { text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 50px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Karnataka State Police Department</h1>
              <h2>OFFICIAL CRIME INTELLIGENCE REPORT</h2>
            </div>
            <div class="details">
              <div class="detail-item"><span class="detail-label">Report Type:</span> ${reportType}</div>
              <div class="detail-item"><span class="detail-label">Generated On:</span> ${new Date().toLocaleString()}</div>
              <div class="detail-item"><span class="detail-label">Crime Number:</span> ${data.crimeNo || 'N/A'}</div>
              <div class="detail-item"><span class="detail-label">Case Number:</span> ${data.caseNo || 'N/A'}</div>
              <div class="detail-item"><span class="detail-label">Investigating Officer:</span> ${data.officerName || 'N/A'}</div>
              <div class="detail-item"><span class="detail-label">Police Station:</span> ${data.stationName || 'N/A'}</div>
              <div class="detail-item"><span class="detail-label">Complainant:</span> ${data.complainant || 'N/A'}</div>
              <div class="detail-item"><span class="detail-label">Accused:</span> ${data.accused || 'N/A'}</div>
            </div>
            <div class="facts-box">
              <h3 style="margin-top: 0; color: #1e3a8a;">Brief Facts of the Case</h3>
              <p>${data.facts || 'No facts recorded.'}</p>
            </div>
            <div class="footer">
              CONFIDENTIAL - FOR OFFICIAL USE ONLY - ZOHO CATALYST MANAGEMENT PROTOCOL
            </div>
          </body>
        </html>
      `;

      const app = CatalystContext.current();
      const smartbrowz = app.smartbrowz();
      
      const pdfBuffer = await smartbrowz.convertToPdf(htmlContent, {
        pdf_options: {
          format: 'A4',
          margin: { top: '10', bottom: '10', left: '10', right: '10' }
        }
      });

      const base64 = Buffer.from(pdfBuffer as any).toString('base64');

      return {
        pdfBase64: base64,
        fileName: `${fileTitle}.pdf`
      };
    } catch (error) {
      console.error('Error generating PDF with Catalyst SmartBrowz:', error);
      throw error;
    }
  }
}
