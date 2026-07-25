import React, { useState, useEffect } from 'react';
import { submitQuery } from '../api/client';
import { FileText, Download, Printer, ShieldAlert, Cpu } from 'lucide-react';

export default function Reports() {
  const [caseNo, setCaseNo] = useState('202500001');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    if (!caseNo.trim()) return;
    setLoading(true);
    setError('');
    setReport(null);

    try {
      const response = await submitQuery(`generate summary and print report for case ${caseNo}`);
      const data = response.data;
      if (data && !data.error) {
        setReport(data);
      } else {
        setError(data.error || 'Failed to compile report parameters.');
      }
    } catch (err) {
      console.error(err);
      setError('Error compiling investigation report details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const triggerPrint = () => {
    window.print();
  };

  const downloadMockPdf = () => {
    if (!report || !report.pdfData) return;
    
    // Decode base64 to download as a text/pdf mock file
    const decoded = atob(report.pdfData.pdfBase64);
    const blob = new Blob([decoded], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = report.pdfData.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto printable-area">
      
      {/* Header Panel (Hidden during print) */}
      <div className="bg-police-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="text-police-glow h-5 w-5" /> SmartBrowz Report Compiler
          </h2>
          <p className="text-xs text-slate-400">Generate high-fidelity PDF summaries and printable investigation records</p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={caseNo}
            onChange={(e) => setCaseNo(e.target.value)}
            placeholder="Enter Case No..."
            className="bg-[#0B111E] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-police-accent min-w-[150px]"
          />
          <button
            onClick={fetchReport}
            disabled={loading}
            className="px-4 py-2 bg-police-accent text-white rounded-lg hover:bg-police-accent/80 text-xs font-bold transition-all disabled:opacity-50"
          >
            {loading ? 'Compiling...' : 'Compile'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center text-red-400 text-sm print:hidden">
          {error}
        </div>
      )}

      {report && (
        <div className="space-y-4">
          
          {/* Action Row (Hidden during print) */}
          <div className="flex justify-end gap-3 print:hidden">
            <button
              onClick={downloadMockPdf}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Download size={14} /> Download PDF
            </button>
            <button
              onClick={triggerPrint}
              className="px-4 py-2 bg-police-accent hover:bg-police-accent/80 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Printer size={14} /> Print Report
            </button>
          </div>

          {/* Clean Printable Page Container */}
          <div className="bg-white text-slate-900 p-8 rounded-xl border shadow-lg space-y-8 print:border-none print:shadow-none">
            
            {/* Report Header */}
            <div className="border-b-2 border-slate-900 pb-6 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">Karnataka Police Department</h1>
                <p className="text-sm font-semibold text-slate-600">State Crime Intelligence Bureau (SCRB)</p>
                <p className="text-[10px] text-slate-500 mt-1">Official Document ID: {report.pdfData?.fileName.replace('.pdf', '')}</p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-red-100 text-red-800 border border-red-200 rounded text-xs font-bold uppercase tracking-wider">
                  Confidential
                </span>
                <p className="text-[10px] text-slate-500 mt-2">Print Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Core Fields Grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-xs border-b border-slate-200 pb-6">
              <div>
                <p className="text-slate-500 font-bold uppercase text-[9px]">Crime Number (FIR Code)</p>
                <p className="font-semibold text-slate-950 text-sm mt-0.5">{caseNo}</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold uppercase text-[9px]">Registration Date</p>
                <p className="font-semibold text-slate-950 text-sm mt-0.5">{report.summaryText.match(/on\s+([0-9-]{10})/)?.[1] || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold uppercase text-[9px]">Police Station Unit</p>
                <p className="font-semibold text-slate-950 mt-0.5">{report.summaryText.match(/at\s+([a-zA-Z0-9\s]+PS)/)?.[1] || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold uppercase text-[9px]">Investigating Officer</p>
                <p className="font-semibold text-slate-950 mt-0.5">{report.summaryText.match(/Officer:\s+([a-zA-Z\s]+)\b/)?.[1] || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold uppercase text-[9px]">Complainant Details</p>
                <p className="font-semibold text-slate-950 mt-0.5">{report.summaryText.match(/Complainant:\s+([a-zA-Z\s]+)\. Accused/)?.[1] || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold uppercase text-[9px]">Accused / Suspects</p>
                <p className="font-semibold text-slate-950 mt-0.5">{report.summaryText.match(/Accused:\s+([a-zA-Z\s,]+)\. Brief/)?.[1] || 'N/A'}</p>
              </div>
            </div>

            {/* Brief Facts */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950">Brief Facts & Modus Operandi</h3>
              <p className="text-xs leading-relaxed text-slate-700 bg-slate-50 p-4 rounded border border-slate-200">
                {report.summaryText.match(/Brief Facts:\s+([\s\S]+?)\. Current/)?.[1] || report.summaryText}
              </p>
            </div>

            {/* Signatures */}
            <div className="pt-16 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="w-48 border-t border-slate-400 mx-auto pt-2 text-slate-500">
                  Signature of Investigating Officer
                </div>
              </div>
              <div>
                <div className="w-48 border-t border-slate-400 mx-auto pt-2 text-slate-500">
                  Official Station Stamp & Date
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Helper info (Hidden during print) */}
      {!report && !loading && (
        <div className="bg-police-card p-8 rounded-xl border border-slate-800 text-center text-slate-500 text-sm print:hidden">
          Please search a valid Case Number to compile and print the summary report.
        </div>
      )}

    </div>
  );
}
