import React, { useState, useRef, useEffect } from 'react';
import { submitQuery } from '../api/client';
import type { QueryResponse } from '../api/client';
import { 
  Send, Mic, MicOff, Volume2, VolumeX, ShieldAlert, Cpu, 
  Terminal, Database, Clock, Zap, HelpCircle, CornerDownLeft
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Message {
  sender: 'user' | 'system';
  text: string;
  data?: any;
  metadata?: QueryResponse['metadata'];
}

interface ChatProps {
  onSwitchTab: (tab: string, params?: any) => void;
}

export default function Chat({ onSwitchTab }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'system',
      text: "Karnataka Police Cyber Command Intelligence Bot initialized. Enter a command or query. (English & Kannada supported)"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'kn'>('en');
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedMeta, setSelectedMeta] = useState<QueryResponse['metadata'] | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => {
        setIsListening(true);
      };
      
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript);
      };
      
      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      rec.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = rec;
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
        recognitionRef.current.start();
      } else {
        alert("Speech Recognition API not supported in this browser.");
      }
    }
  };

  // Text to Speech
  const speakText = (text: string) => {
    if (!voiceEnabled) return;
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim()) return;

    setLoading(true);
    setInput('');

    // Append User Message
    setMessages(prev => [...prev, { sender: 'user', text: queryText }]);

    try {
      const response = await submitQuery(queryText, language);
      
      const newMsg: Message = {
        sender: 'system',
        text: response.textResponse,
        data: response.data,
        metadata: response.metadata
      };

      setMessages(prev => [...prev, newMsg]);
      setSelectedMeta(response.metadata); // Load to debugger panel immediately

      // Speak response out loud if enabled
      speakText(response.textResponse);

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { 
        sender: 'system', 
        text: "Error connecting to the intelligence server. Ensure SQLite database is seeded and backend port 5000 is listening." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      
      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col bg-police-card rounded-xl border border-slate-800 overflow-hidden">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800 bg-[#111A2E] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Cpu className="text-police-glow h-5 w-5 animate-pulse" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Conversational Query Console</h2>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Language Switch */}
            <div className="flex bg-[#0B111E] rounded-lg p-0.5 border border-slate-800">
              <button 
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${language === 'en' ? 'bg-police-accent text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                English
              </button>
              <button 
                onClick={() => setLanguage('kn')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${language === 'kn' ? 'bg-police-accent text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                ಕನ್ನಡ (Kannada)
              </button>
            </div>

            {/* Voice Toggle */}
            <button
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                if (voiceEnabled) window.speechSynthesis.cancel();
              }}
              title="Toggle Text-to-Speech Output"
              className={`p-2 rounded-lg border transition-all ${voiceEnabled ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
              {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>

        {/* Messages list */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl p-4 border ${
                msg.sender === 'user' 
                  ? 'bg-police-accent/10 border-police-accent/40 text-slate-100' 
                  : 'bg-[#0B111E] border-slate-800 text-slate-200'
              }`}>
                {/* Text Content */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                
                {/* Embed widgets based on intent outputs */}
                {msg.data && msg.metadata && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
                    
                    {/* Render mini line trend chart if TREND */}
                    {msg.metadata.intent === 'TREND' && msg.data.chartData && (
                      <div className="h-44 w-full bg-[#111A2E] p-2 rounded-lg border border-slate-800">
                        <p className="text-[10px] text-slate-400 mb-1">Interactive Monthly Distribution Trend</p>
                        <ResponsiveContainer width="100%" height="90%">
                          <LineChart data={msg.data.chartData}>
                            <XAxis dataKey="month" stroke="#94A3B8" fontSize={9} />
                            <YAxis stroke="#94A3B8" fontSize={9} />
                            <Tooltip contentStyle={{ backgroundColor: '#161F30', fontSize: 10 }} />
                            {msg.data.yearsList.map((yr: number, idx: number) => (
                              <Line 
                                key={yr} 
                                type="monotone" 
                                dataKey={`year_${yr}`} 
                                name={`Year ${yr}`} 
                                stroke={idx === 0 ? '#00F0FF' : '#FF2A54'} 
                                strokeWidth={2}
                                dot={false}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Navigation Buttons for Graphs and Maps */}
                    {msg.metadata.intent === 'HOTSPOT' && (
                      <button 
                        onClick={() => onSwitchTab('map')} 
                        className="px-3 py-1.5 bg-police-accent hover:bg-police-accent/80 text-white rounded-lg text-xs font-semibold transition-all"
                      >
                        Inspect Hotspots on Full Map View
                      </button>
                    )}

                    {msg.metadata.intent === 'NETWORK' && (
                      <button 
                        onClick={() => onSwitchTab('network', { accusedName: msg.metadata.intent })} 
                        className="px-3 py-1.5 bg-police-accent hover:bg-police-accent/80 text-white rounded-lg text-xs font-semibold transition-all"
                      >
                        Inspect Relationship Canvas
                      </button>
                    )}

                    {msg.metadata.intent === 'TIMELINE' && (
                      <button 
                        onClick={() => onSwitchTab('timeline', { caseNo: msg.data.caseNo })} 
                        className="px-3 py-1.5 bg-police-accent hover:bg-police-accent/80 text-white rounded-lg text-xs font-semibold transition-all"
                      >
                        Open Case Timeline Detail
                      </button>
                    )}

                    {/* Recidivism prediction display */}
                    {msg.metadata.intent === 'PREDICTION' && msg.data.riskLevel && (
                      <div className="bg-[#111A2E] p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-300">Recidivism Score:</span>
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            msg.data.riskLevel === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>{msg.data.score}% ({msg.data.riskLevel} Risk)</span>
                        </div>
                        <ul className="list-disc pl-4 text-slate-400 space-y-1">
                          {msg.data.factors.map((f: string, i: number) => <li key={i}>{f}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Explanatory Prompt debugger toggle */}
                    <button 
                      onClick={() => setSelectedMeta(msg.metadata)}
                      className="text-[10px] text-police-glow hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Cpu size={10} /> Inspect Explainable AI trace
                    </button>

                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#0B111E] border border-slate-800 rounded-xl p-4 text-slate-400 text-sm flex items-center gap-2">
                <span className="animate-ping rounded-full h-2 w-2 bg-police-glow"></span>
                Processing deterministic pipeline steps...
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-slate-800 bg-[#111A2E] flex gap-3">
          <button
            onClick={toggleListening}
            className={`p-3 rounded-xl border transition-all ${
              isListening 
                ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Speech-to-Text Input"
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={language === 'kn' ? 'ಅಪರಾಧದ ವಿವರ ಅಥವಾ ಆಜ್ಞೆಯನ್ನು ಇಲ್ಲಿ ನಮೂದಿಸಿ...' : "Search district cases, compare, look up a case no, or check recidivism..."}
              className="w-full bg-[#0B111E] border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-police-accent focus:ring-1 focus:ring-police-accent"
            />
            <span className="absolute right-3 top-3.5 text-xs text-slate-500 flex items-center gap-1">
              Enter <CornerDownLeft size={10} />
            </span>
          </div>

          <button
            onClick={() => handleSend()}
            disabled={loading}
            className="p-3 bg-police-accent hover:bg-police-accent/80 text-white rounded-xl transition-all flex items-center justify-center disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>

      </div>

      {/* Explainable AI Right Sidebar */}
      <div className="w-80 bg-police-card rounded-xl border border-slate-800 p-4 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
          <Terminal className="text-police-glow h-5 w-5" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Explainable AI Audit Trail</h2>
        </div>

        {selectedMeta ? (
          <div className="flex-1 overflow-y-auto space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0B111E] p-2 rounded border border-slate-800">
                <p className="text-slate-400 text-[10px]">INTENT</p>
                <p className="font-bold text-white mt-0.5">{selectedMeta.intent}</p>
              </div>
              <div className="bg-[#0B111E] p-2 rounded border border-slate-800">
                <p className="text-slate-400 text-[10px]">CONFIDENCE</p>
                <p className="font-bold text-emerald-400 mt-0.5">{selectedMeta.confidence}</p>
              </div>
              <div className="bg-[#0B111E] p-2 rounded border border-slate-800">
                <p className="text-slate-400 text-[10px]">ROWS PROCESSED</p>
                <p className="font-bold text-white mt-0.5">{selectedMeta.rowsProcessed}</p>
              </div>
              <div className="bg-[#0B111E] p-2 rounded border border-slate-800">
                <p className="text-slate-400 text-[10px]">LATENCY</p>
                <p className="font-bold text-police-gold mt-0.5">{selectedMeta.executionTimeMs} ms</p>
              </div>
            </div>

            <div className="bg-[#0B111E] p-3 rounded border border-slate-800 space-y-1">
              <p className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Cpu size={11} className="text-police-accent" /> Resolution Engine
              </p>
              <p className="text-slate-200 leading-relaxed font-semibold">{selectedMeta.generatedUsing}</p>
            </div>

            <div className="bg-[#0B111E] p-3 rounded border border-slate-800 space-y-1">
              <p className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <Database size={11} className="text-police-glow" /> Data Source
              </p>
              <p className="text-slate-200 font-semibold">{selectedMeta.dataSource}</p>
            </div>

            {selectedMeta.sqlQuery && selectedMeta.sqlQuery.length > 0 && (
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                  <Database size={11} className="text-police-glow" /> Executed SQL Query
                </p>
                <div className="bg-[#0B111E] p-2 rounded border border-slate-850 overflow-x-auto font-mono text-[9px] text-slate-300 leading-normal max-h-48 whitespace-pre">
                  {selectedMeta.sqlQuery.join('\n\n')}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <HelpCircle size={36} className="text-slate-700 mb-2 animate-bounce" />
            <p className="text-xs">No active queries analyzed. Type a query to inspect the database execution trace.</p>
          </div>
        )}
      </div>

    </div>
  );
}
