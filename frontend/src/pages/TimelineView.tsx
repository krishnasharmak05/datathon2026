import React, { useState, useEffect } from 'react';
import { fetchCaseTimeline } from '../api/client';
import { Search, Calendar, FileText, User, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

export default function TimelineView() {
  const [caseNo, setCaseNo] = useState('202500001');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTimeline = async () => {
    if (!caseNo.trim()) return;
    setLoading(true);
    setError('');
    setEvents([]);

    try {
      const response = await fetchCaseTimeline(caseNo);
      if (response.data && response.data.events) {
        setEvents(response.data.events);
      } else {
        setError('No case record or milestones found for this Case Number.');
      }
    } catch (err) {
      console.error(err);
      setError('Error fetching case timeline details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header & Search */}
      <div className="bg-police-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="text-police-glow h-5 w-5" /> Case Progression Tracker
          </h2>
          <p className="text-xs text-slate-400">Vertical timeline tracking milestone status of FIR cases</p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={caseNo}
            onChange={(e) => setCaseNo(e.target.value)}
            placeholder="Enter Case No or Crime No..."
            className="bg-[#0B111E] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-police-accent min-w-[200px]"
            onKeyDown={(e) => e.key === 'Enter' && fetchTimeline()}
          />
          <button
            onClick={fetchTimeline}
            disabled={loading}
            className="px-4 py-2 bg-police-accent text-white rounded-lg hover:bg-police-accent/80 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <Search size={13} /> {loading ? 'Loading...' : 'Track'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Vertical Timeline Progress */}
      {events.length > 0 ? (
        <div className="relative border-l-2 border-slate-800 ml-4 md:ml-32 space-y-8 pb-10">
          
          {events.map((ev, idx) => (
            <div key={idx} className="relative pl-6 md:pl-8">
              
              {/* Timeline dot */}
              <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-police-dark border-2 border-police-glow flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-police-glow"></span>
              </div>

              {/* Date Column (Desktop layout) */}
              <div className="md:absolute md:-left-32 md:top-1 text-right w-24 hidden md:block text-slate-400 text-xs font-semibold">
                {ev.date}
              </div>

              {/* Event Card */}
              <div className="bg-police-card p-4 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition-all max-w-xl">
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 bg-police-accent/15 text-police-glow border border-police-accent/30 rounded text-[10px] font-bold uppercase tracking-wider">
                    {ev.stage}
                  </span>
                  <span className="text-[10px] text-slate-500 md:hidden flex items-center gap-1">
                    <Calendar size={10} /> {ev.date}
                  </span>
                </div>

                <h3 className="text-slate-100 text-sm font-semibold leading-relaxed">
                  {ev.details}
                </h3>

                <div className="flex items-center gap-1 text-[10px] text-slate-400 border-t border-slate-850 pt-2 mt-2">
                  <User size={12} className="text-police-gold" />
                  <span>Assigned Officer: <b>{ev.officer}</b></span>
                </div>
              </div>

            </div>
          ))}

        </div>
      ) : (
        !loading && !error && (
          <div className="bg-police-card p-8 rounded-xl border border-slate-800 text-center text-slate-500 text-sm">
            Please query a valid Case Number to view case progression.
          </div>
        )
      )}

    </div>
  );
}
