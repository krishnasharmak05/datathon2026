import React, { useEffect, useRef, useState } from 'react';
import { fetchAccusedNetwork, fetchAccusedProfile } from '../api/client';
import cytoscape from 'cytoscape';
import { Search, Network, User, ShieldAlert, Cpu } from 'lucide-react';

export default function NetworkView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const [accusedName, setAccusedName] = useState('ACC-R-1');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [conflictOptions, setConflictOptions] = useState<any[]>([]);

  const fetchAndRenderNetwork = async (personIdOverride?: string) => {
    if (!containerRef.current) return;
    
    setLoading(true);
    setProfile(null);
    setConflictOptions([]);

    try {
      // 1. Fetch graph node-link data from api orchestrator
      const response = personIdOverride 
        ? await fetchAccusedNetwork('', personIdOverride)
        : await fetchAccusedNetwork(accusedName);

      if (response.status === 'conflict') {
        setConflictOptions(response.options);
        if (cyRef.current) {
          cyRef.current.destroy();
          cyRef.current = null;
        }
        setLoading(false);
        return;
      }
      
      const data = response.data;

      // 2. Fetch the corresponding offender behavioral profile in parallel
      const profileResponse = personIdOverride 
        ? await fetchAccusedProfile('', personIdOverride)
        : await fetchAccusedProfile(accusedName);

      if (profileResponse.status === 'success' && !profileResponse.data.error) {
        setProfile(profileResponse.data);
      }

      if (!data || !data.nodes || data.nodes.length === 0) {
        // Fallback: Clear cytoscape if no records
        if (cyRef.current) {
          cyRef.current.destroy();
          cyRef.current = null;
        }
        setLoading(false);
        return;
      }

      // Convert format to Cytoscape elements
      const cyElements: cytoscape.ElementDefinition[] = [];

      data.nodes.forEach((n: any) => {
        cyElements.push({
          data: {
            id: n.id,
            label: n.label,
            type: n.type
          }
        });
      });

      data.edges.forEach((e: any) => {
        cyElements.push({
          data: {
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label
          }
        });
      });

      // 3. Render Cytoscape Graph
      const cy = cytoscape({
        container: containerRef.current,
        elements: cyElements,
        style: [
          {
            selector: 'node',
            style: {
              'label': 'data(label)',
              'color': '#E2E8F0',
              'font-size': '10px',
              'text-valign': 'bottom',
              'text-margin-y': 4,
              'background-color': '#475569',
              'width': '24px',
              'height': '24px',
              'transition-property': 'background-color, line-color',
              'transition-duration': 0.3
            }
          },
          {
            selector: 'node[type="accused"]',
            style: {
              'background-color': '#FF2A54',
              'shape': 'ellipse',
              'width': '28px',
              'height': '28px'
            }
          },
          {
            selector: 'node[type="case"]',
            style: {
              'background-color': '#FFD700',
              'shape': 'rectangle'
            }
          },
          {
            selector: 'node[type="officer"]',
            style: {
              'background-color': '#2A75D3',
              'shape': 'triangle',
              'width': '26px',
              'height': '26px'
            }
          },
          {
            selector: 'node[type="victim"]',
            style: {
              'background-color': '#10B981',
              'shape': 'diamond',
              'width': '22px',
              'height': '22px'
            }
          },
          {
            selector: 'node[type="victim-overlap"]',
            style: {
              'background-color': '#EC4899',
              'shape': 'diamond',
              'width': '26px',
              'height': '26px',
              'border-color': '#FFF',
              'border-width': '2px'
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 1.5,
              'line-color': '#334155',
              'target-arrow-color': '#334155',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'label': 'data(label)',
              'font-size': '8px',
              'color': '#94A3B8',
              'text-rotation': 'autorotate',
              'text-margin-y': -8
            }
          }
        ],
        layout: {
          name: 'cose',
          animate: true,
          nodeRepulsion: () => 4500,
          idealEdgeLength: () => 60,
        } as any
      });

      cyRef.current = cy;

    } catch (err) {
      console.error('Error rendering Cytoscape network graph:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndRenderNetwork();
  }, []);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      
      {/* Search and Profile Sidebar */}
      <div className="w-80 bg-police-card rounded-xl border border-slate-800 p-4 flex flex-col justify-between overflow-hidden">
        <div className="space-y-4 overflow-y-auto flex-1">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Network className="text-police-glow h-5 w-5" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Network Profiler</h2>
          </div>

          {/* Search Box */}
          <div className="flex gap-2">
            <input
              type="text"
              value={accusedName}
              onChange={(e) => setAccusedName(e.target.value)}
              placeholder="Enter Name, ID, Crime or Case No..."
              className="flex-1 bg-[#0B111E] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-police-accent"
              onKeyDown={(e) => e.key === 'Enter' && fetchAndRenderNetwork()}
            />
            <button
              onClick={() => fetchAndRenderNetwork()}
              className="p-2 bg-police-accent text-white rounded-lg hover:bg-police-accent/80 transition-all"
            >
              <Search size={14} />
            </button>
          </div>

          {/* Profile Overview (if loaded) */}
          {conflictOptions.length > 0 ? (
            <div className="space-y-3 text-xs">
              <div className="bg-[#0B111E] p-3 rounded-lg border border-yellow-500/20 space-y-2">
                <p className="text-[10px] text-yellow-500 uppercase font-bold flex items-center gap-1">
                  <ShieldAlert className="text-yellow-500" size={12} /> Multiple Suspects Found
                </p>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Multiple suspects match this name. Please select the correct Person ID:
                </p>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {conflictOptions.map((opt: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAccusedName(opt.personId);
                        fetchAndRenderNetwork(opt.personId);
                      }}
                      className="w-full text-left p-2 rounded bg-[#161F30] border border-slate-800 hover:border-police-glow hover:bg-police-accent/10 transition-all text-white text-[10px] flex justify-between items-center"
                    >
                      <span className="font-semibold">{opt.accusedName}</span>
                      <span className="text-slate-500 font-mono text-[9px]">{opt.personId}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : profile ? (
            <div className="space-y-3 text-xs">
              <div className="bg-[#0B111E] p-3 rounded-lg border border-slate-800 space-y-2">
                <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                  <User className="text-police-glow" size={12} /> Behavioral Profile
                </p>
                <div className="space-y-1">
                  <p className="text-slate-200"><b>Name:</b> {profile.accusedName}</p>
                  <p className="text-slate-200"><b>Suspect ID:</b> {profile.personId}</p>
                  <p className="text-slate-200"><b>Total Offences:</b> {profile.totalOffences}</p>
                  <p className="text-slate-200"><b>Preferred Crime:</b> {profile.preferredCrime}</p>
                  <p className="text-slate-200"><b>Preferred spot:</b> {profile.preferredLocation}</p>
                  <p className="text-slate-200"><b>Active Span:</b> {profile.activeYearsSpan}</p>
                  {profile.victimOverlap && profile.victimOverlap.length > 0 && (
                    <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-800 text-[10px]">
                      <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wide">Victim Overlap Details</p>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {profile.victimOverlap.map((overlap: any, idx: number) => (
                          <div key={idx} className="bg-[#1C1420] border border-rose-500/20 p-2 rounded text-[10px] space-y-1 text-slate-300">
                            <p className="text-rose-400 font-bold">{overlap.victimName}</p>
                            <div className="pl-2 border-l border-rose-500/20 space-y-0.5 text-[9px] text-slate-400 font-mono">
                              {overlap.cases.map((c: any, cIdx: number) => (
                                <div key={cIdx} className="truncate">
                                  • <span className="font-semibold text-slate-200">{c.stationName}</span> ({c.date})
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Case History list */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Offence History</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {profile.offenceHistory && profile.offenceHistory.map((off: any, idx: number) => (
                    <div key={idx} className="bg-[#0B111E] p-2 rounded border border-slate-850 text-[10px] space-y-1">
                      <p className="text-white font-bold">{off.crimeNo} ({off.date})</p>
                      <p className="text-slate-400 text-[9px]">{off.briefFacts}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            !loading && (
              <div className="bg-[#0B111E] p-4 rounded-lg border border-slate-800 text-center text-slate-500 text-xs">
                No active offender profile loaded. Search a name, ID, or Case/Crime No to compute metrics.
              </div>
            )
          )}
        </div>

        <div className="bg-[#0B111E] p-3 rounded-lg border border-slate-800 text-xs mt-3 space-y-1">
          <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
            <Cpu size={12} className="text-police-gold" /> Color Legend
          </p>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF2A54]"></span>
            <span>Accused / Suspects</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 bg-[#FFD700]"></span>
            <span>Registered Cases</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#2A75D3]"></span>
            <span>Investigating Officers</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 bg-[#10B981] transform rotate-45 inline-block"></span>
            <span>Victims</span>
          </div>
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <span className="w-2.5 h-2.5 bg-[#EC4899] border border-white transform rotate-45 inline-block"></span>
            <span>Victim Overlap</span>
          </div>
        </div>
      </div>

      {/* Cytoscape Canvas Container */}
      <div className="flex-1 bg-police-card rounded-xl border border-slate-800 overflow-hidden relative">
        <div ref={containerRef} className="w-full h-full min-h-[500px] cytoscape-container" />
        {loading && (
          <div className="absolute inset-0 bg-[#0B111E]/70 flex items-center justify-center z-[1000]">
            <div className="bg-[#161F30] p-4 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-police-glow"></div>
              <span className="text-xs text-slate-200">Recomputing relationship matrix and centrality...</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
