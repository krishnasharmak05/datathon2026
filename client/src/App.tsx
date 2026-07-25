import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import MapView from './pages/MapView';
import NetworkView from './pages/NetworkView';
import TimelineView from './pages/TimelineView';
import Reports from './pages/Reports';
import { 
  Shield, BarChart3, MessageSquare, Map, Network, Clock, FileSpreadsheet, Lock
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tabParams, setTabParams] = useState<any>(null);

  const handleSwitchTab = (tab: string, params?: any) => {
    setActiveTab(tab);
    if (params) {
      setTabParams(params);
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'chat':
        return <Chat onSwitchTab={handleSwitchTab} />;
      case 'map':
        return <MapView />;
      case 'network':
        return <NetworkView />;
      case 'timeline':
        return <TimelineView />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Intelligence Board', icon: BarChart3 },
    { id: 'chat', label: 'Query Terminal', icon: MessageSquare },
    { id: 'map', label: 'Geospatial Hotspots', icon: Map },
    { id: 'network', label: 'Relationship Canvas', icon: Network },
    { id: 'timeline', label: 'Milestone Progress', icon: Clock },
    { id: 'reports', label: 'SmartBrowz Reports', icon: FileSpreadsheet },
  ];

  return (
    <div className="flex h-screen bg-police-dark text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-police-card border-r border-slate-800 flex flex-col justify-between select-none">
        <div>
          {/* Logo Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-police-accent/20 p-2 rounded-lg border border-police-accent/40 shadow-glow">
              <Shield className="text-police-glow h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider uppercase text-white">Karnataka Police</h1>
              <p className="text-[10px] text-police-glow font-bold tracking-widest uppercase">CIB Command</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSwitchTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all duration-200 border ${
                    isActive 
                      ? 'bg-police-accent/15 border-police-accent/40 text-white shadow-glow' 
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#111A2E]'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-police-glow' : 'text-slate-400'} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Security badge at bottom */}
        <div className="p-4 border-t border-slate-800 bg-[#0B111E] flex items-center gap-2">
          <Lock className="text-emerald-500 h-4.5 w-4.5" />
          <div className="text-[9px]">
            <p className="font-bold text-white uppercase">RBAC Encrypted</p>
            <p className="text-slate-500">Security Clearance Level: 3</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 bg-police-card flex items-center justify-between px-6">
          <div className="text-xs text-slate-400">
            Current Operator Node: <b className="text-slate-200">BLR-OFFICE-03</b>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs text-slate-200 font-bold uppercase tracking-wider">Catalyst Node Active</span>
          </div>
        </header>

        {/* Dynamic page render container */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0B111E]">
          {renderActiveTab()}
        </div>
      </main>

    </div>
  );
}
