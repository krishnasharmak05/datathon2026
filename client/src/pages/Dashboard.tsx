import React, { useEffect, useState } from 'react';
import { fetchStats, fetchDemographics } from '../api/client';
import type { StatsResponse, DemographicsResponse } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Shield, Users, MapPin, Activity, FileText } from 'lucide-react';

const COLORS = ['#00F0FF', '#FF2A54', '#FFD700', '#10B981', '#8B5CF6', '#F59E0B'];

export default function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [demo, setDemo] = useState<DemographicsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchStats(), fetchDemographics()])
      .then(([statsData, demoData]) => {
        setStats(statsData);
        setDemo(demoData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading dashboard data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-police-glow"></div>
      </div>
    );
  }

  // Calculate some KPIs
  const totalCrimes = stats?.data.districts.reduce((acc, curr) => acc + curr.caseCount, 0) || 0;
  const totalArrests = stats?.data.districts.reduce((acc, curr) => acc + curr.arrestCount, 0) || 0;
  const arrestRate = totalCrimes > 0 ? ((totalArrests / totalCrimes) * 100).toFixed(1) + '%' : '0%';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Shield className="text-police-glow h-8 w-8 animate-pulse" />
          Karnataka Police Crime Intelligence Terminal
        </h1>
        <p className="text-sm text-slate-400">Deterministic Crime Analytics & Socio-Demographic Intelligence</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-police-card p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Total Cases Filed</p>
            <h3 className="text-2xl font-bold text-white mt-1">{totalCrimes}</h3>
          </div>
          <Shield className="text-police-glow h-10 w-10 opacity-70" />
        </div>

        <div className="bg-police-card p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Total Arrests</p>
            <h3 className="text-2xl font-bold text-police-glow mt-1">{totalArrests}</h3>
          </div>
          <Users className="text-police-accent h-10 w-10 opacity-70" />
        </div>

        <div className="bg-police-card p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Arrest Rate</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{arrestRate}</h3>
          </div>
          <Activity className="text-emerald-500 h-10 w-10 opacity-70" />
        </div>

        <div className="bg-police-card p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Monitored Stations</p>
            <h3 className="text-2xl font-bold text-police-gold mt-1">{stats?.data.stations.length || 0}</h3>
          </div>
          <MapPin className="text-police-gold h-10 w-10 opacity-70" />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Crime Type Distribution */}
        <div className="bg-police-card p-4 rounded-xl border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="text-police-glow h-5 w-5" /> Crime Categories
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.data.distribution}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#161F30', borderColor: '#1E293B', color: '#FFF' }} />
                <Bar dataKey="count" fill="#2A75D3" radius={[4, 4, 0, 0]}>
                  {stats?.data.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District Crime Volume */}
        <div className="bg-police-card p-4 rounded-xl border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <MapPin className="text-police-glow h-5 w-5" /> District Crime Volume & Arrests
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.data.districts.slice(0, 5)}>
                <XAxis dataKey="DistrictName" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#161F30', borderColor: '#1E293B', color: '#FFF' }} />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="caseCount" name="Cases Filed" fill="#2A75D3" radius={[4, 4, 0, 0]} />
                <Bar dataKey="arrestCount" name="Arrests" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographics: Age Distribution */}
        <div className="bg-police-card p-4 rounded-xl border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="text-police-glow h-5 w-5" /> Suspect Age Demographics
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demo?.data.ageGroups}>
                <XAxis dataKey="group" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#161F30', borderColor: '#1E293B', color: '#FFF' }} />
                <Bar dataKey="count" name="Count" fill="#FF2A54" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographics: Complainant Religion/Caste Breakdown */}
        <div className="bg-police-card p-4 rounded-xl border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="text-police-glow h-5 w-5" /> Caste representation (Complainants)
          </h2>
          <div className="h-64 flex items-center justify-around">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demo?.data.casteGroups}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="caste"
                  >
                    {demo?.data.casteGroups.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#161F30', borderColor: '#1E293B', color: '#FFF' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 text-left space-y-2">
              {demo?.data.casteGroups.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="text-slate-300 font-semibold">{entry.caste}:</span>
                  <span className="text-white font-bold">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
