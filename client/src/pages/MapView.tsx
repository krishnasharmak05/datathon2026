import React, { useEffect, useRef, useState } from 'react';
import { fetchHotspots } from '../api/client';
import { MapPin, ShieldAlert, Sliders } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fixed icon markers path issue in Vite/Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CRIME_CATEGORIES = [
  { id: 1, name: 'Crimes Against Body' },
  { id: 2, name: 'Crimes Against Property' },
  { id: 3, name: 'Cybercrime' },
  { id: 4, name: 'Narcotics' },
  { id: 5, name: 'White Collar Crime' },
  { id: 6, name: 'Public Peace' }
];

export default function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [crimeHeadId, setCrimeHeadId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [hotspotCount, setHotspotCount] = useState(0);

  // Initialize Map
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      // Coordinates centered on Karnataka
      const map = L.map(mapContainerRef.current).setView([13.97, 76.64], 7);
      
      // Add Dark Matter Tile Layer for cyber theme
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB &copy; OpenStreetMap contributors',
        maxZoom: 20
      }).addTo(map);

      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch and Load Hotspots
  const loadHotspotData = async () => {
    if (!layerGroupRef.current || !mapInstanceRef.current) return;
    
    setLoading(true);
    layerGroupRef.current.clearLayers();

    try {
      const response = await fetchHotspots(crimeHeadId);
      const data = response.data;

      if (data && data.hotspots) {
        setHotspotCount(data.hotspots.length);
        
        // Add DBSCAN cluster hot circles
        data.hotspots.forEach((h: any) => {
          // Draw red heat ring
          const circle = L.circle(h.centroid, {
            color: '#FF2A54',
            fillColor: '#FF2A54',
            fillOpacity: 0.15,
            radius: h.radius * 111320, // conversion degrees to meters roughly
            weight: 1
          });

          // Draw center core pin
          const coreMarker = L.circleMarker(h.centroid, {
            color: '#FF2A54',
            fillColor: '#FFFFFF',
            fillOpacity: 0.8,
            radius: 6,
            weight: 2
          });

          // Bind details popup
          const popupContent = `
            <div style="background-color: #161F30; color: #FFF; font-family: sans-serif; padding: 4px; font-size: 11px;">
              <h4 style="margin: 0 0 5px 0; color: #FF2A54; font-weight: bold;">DBSCAN DENSE HOTSPOT</h4>
              <p style="margin: 3px 0;"><b>Cases:</b> ${h.pointsCount}</p>
              <p style="margin: 3px 0;"><b>Confidence:</b> ${h.confidence}</p>
              <p style="margin: 3px 0;"><b>Categories:</b> ${h.crimeTypes.join(', ')}</p>
            </div>
          `;
          circle.bindPopup(popupContent);
          coreMarker.bindPopup(popupContent);

          layerGroupRef.current?.addLayer(circle);
          layerGroupRef.current?.addLayer(coreMarker);
        });

        // Add pins for raw points
        if (data.points) {
          data.points.forEach((p: any) => {
            const pointMarker = L.circleMarker([p.lat, p.lng], {
              color: '#00F0FF',
              fillColor: '#00F0FF',
              fillOpacity: 0.5,
              radius: 2,
              weight: 0
            });
            layerGroupRef.current?.addLayer(pointMarker);
          });
        }

        // Fit map bounds to hotspots if available
        if (data.hotspots.length > 0) {
          const bounds = L.latLngBounds(data.hotspots.map((h: any) => h.centroid));
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    } catch (err) {
      console.error('Error loading geospatial hotspots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotspotData();
  }, [crimeHeadId]);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      
      {/* Map Control Sidebar */}
      <div className="w-80 bg-police-card rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="text-police-glow h-5 w-5" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Map Control Console</h2>
          </div>

          {/* Crime Category Filter */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold uppercase">Filter by Crime Head</label>
            <select
              value={crimeHeadId || ''}
              onChange={(e) => setCrimeHeadId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              className="w-full bg-[#0B111E] border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-police-accent"
            >
              <option value="">All Crime Categories</option>
              {CRIME_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-[#0B111E] p-3 rounded-lg border border-slate-800 text-xs space-y-2">
            <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
              <ShieldAlert className="text-police-crimson" size={12} /> Hotspot Indicators
            </p>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-3.5 h-3.5 rounded-full bg-[#FF2A54] opacity-40"></span>
              <span>DBSCAN High Density Clusters ({hotspotCount})</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#00F0FF]"></span>
              <span>Individual Crimes Recorded</span>
            </div>
          </div>
        </div>

        <button
          onClick={loadHotspotData}
          disabled={loading}
          className="w-full py-2.5 bg-police-accent hover:bg-police-accent/80 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all"
        >
          {loading ? 'Re-calculating Clusters...' : 'Refresh Density Map'}
        </button>
      </div>

      {/* Map Canvas */}
      <div className="flex-1 bg-police-card rounded-xl border border-slate-800 overflow-hidden relative">
        <div ref={mapContainerRef} className="w-full h-full min-h-[500px]" />
        {loading && (
          <div className="absolute inset-0 bg-[#0B111E]/70 flex items-center justify-center z-[1000]">
            <div className="bg-[#161F30] p-4 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-police-glow"></div>
              <span className="text-xs text-slate-200">Recomputing DBSCAN spatial matrices...</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
