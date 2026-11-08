import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Wind, Calendar, RefreshCw, SkipForward, AlertTriangle, Activity, Zap 
} from 'lucide-react';

export default function BorsseleDigitalTwin() {
  const [selectedTimestamp, setSelectedTimestamp] = useState('2026-03-07 00:00:00');
  const [forecastData, setForecastData] = useState([]);
  const [currentActual, setCurrentActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredTurbine, setHoveredTurbine] = useState(null);

  // 5 Siemens Gamesa 8MW Turbines (Borssele I & II Standard)
  const [turbines] = useState([
    { id: 'WTG-01', name: 'Borssele Alpha-01', status: 'RUNNING', efficiency: 0.96, ratingMW: 8.0, x: '15%' },
    { id: 'WTG-02', name: 'Borssele Alpha-02', status: 'RUNNING', efficiency: 0.98, ratingMW: 8.0, x: '32%' },
    { id: 'WTG-03', name: 'Borssele Alpha-03', status: 'STOPPED', efficiency: 0.00, ratingMW: 8.0, x: '50%' }, // Maintenance
    { id: 'WTG-04', name: 'Borssele Beta-01',  status: 'RUNNING', efficiency: 0.94, ratingMW: 8.0, x: '68%' },
    { id: 'WTG-05', name: 'Borssele Beta-02',  status: 'RUNNING', efficiency: 0.97, ratingMW: 8.0, x: '85%' },
  ]);

  const fetchForecast = async (timestampStr) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: timestampStr }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setForecastData(data.forecast);
      setCurrentActual(data.current_actual);
    } catch (err) {
      console.error(err);
      setError('Backend connection offline. Ensure FastAPI is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(selectedTimestamp);
  }, []);

  const handleNextHour = () => {
    const current = new Date(selectedTimestamp);
    current.setHours(current.getHours() + 1);
    const nextStr = current.toISOString().replace('T', ' ').substring(0, 19);
    setSelectedTimestamp(nextStr);
    fetchForecast(nextStr);
  };

  const computeTurbinePower = (windSpeed, efficiency, status, ratingMW) => {
    if (status === 'STOPPED' || windSpeed < 3.0) return 0.0;
    if (windSpeed >= 25.0) return 0.0;
    const rawPower = (0.5 * 1.225 * 18626 * Math.pow(windSpeed, 3)) / 1e6;
    return parseFloat(Math.min(ratingMW, rawPower * efficiency).toFixed(2));
  };

  const activeWindSpeed = currentActual !== null ? currentActual : 11.4;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/80 backdrop-blur p-6 rounded-2xl border border-slate-800 shadow-xl gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs tracking-wider uppercase">
              <Wind className="w-4 h-4 animate-spin" />
              <span>North Sea Offshore Asset</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1 tracking-tight">
              Borssele Digital Twin Telemetry
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-950 rounded-xl px-3 py-2 border border-slate-800">
              <Calendar className="w-4 h-4 text-cyan-400 mr-2" />
              <input 
                type="text" 
                value={selectedTimestamp}
                onChange={(e) => setSelectedTimestamp(e.target.value)}
                className="bg-transparent text-sm font-mono font-medium focus:outline-none text-slate-200 w-44"
              />
            </div>

            <button 
              onClick={() => fetchForecast(selectedTimestamp)}
              disabled={loading}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Update
            </button>

            <button 
              onClick={handleNextHour}
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
            >
              <SkipForward className="w-4 h-4" />
              +1h
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-950/50 border border-red-800/80 text-red-300 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* OPEN OCEAN SCENE WITH ANIMATED TURBINES */}
        <div className="relative w-full h-[380px] bg-gradient-to-b from-[#081226] via-[#0e223f] to-[#15345a] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between p-6">
          
          {/* Top Status Overlay */}
          <div className="flex justify-between items-center z-10">
            <div className="flex items-center gap-2 bg-slate-950/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60 text-xs font-mono text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Simulation Field: Borssele I & II
            </div>
            <div className="bg-slate-950/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60 text-xs font-mono text-white">
              Hub Wind Velocity: <span className="text-cyan-400 font-bold">{activeWindSpeed} m/s</span>
            </div>
          </div>

          {/* Sea Horizon & Water Base Graphic */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-end">
            <div className="w-full h-24 bg-gradient-to-t from-[#040b16] to-transparent opacity-80" />
            <div className="w-full h-12 bg-[#040b16] border-t border-cyan-900/30 flex items-center justify-around px-8">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="text-[10px] font-mono text-cyan-800 tracking-widest uppercase">North Sea Sector</div>
              ))}
            </div>
          </div>

          {/* SVG Turbines Placed in the Sea */}
          <div className="absolute inset-x-0 bottom-12 flex justify-around items-end px-12 z-10">
            {turbines.map((t) => {
              const livePower = computeTurbinePower(activeWindSpeed, t.efficiency, t.status, t.ratingMW);
              const isRunning = t.status === 'RUNNING';
              const isHovered = hoveredTurbine?.id === t.id;
              // Dynamic spin duration based on wind speed (faster wind = faster rotation)
              const spinDuration = isRunning ? Math.max(0.8, 4 - (activeWindSpeed / 4)) + 's' : 'none';

              return (
                <div 
                  key={t.id}
                  className="relative flex flex-col items-center group cursor-pointer"
                  onMouseEnter={() => setHoveredTurbine({ ...t, livePower })}
                  onMouseLeave={() => setHoveredTurbine(null)}
                >
                  {/* Hover Floating Telemetry Card */}
                  {isHovered && (
                    <div className="absolute bottom-36 z-30 w-52 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/80 rounded-2xl p-4 shadow-2xl text-left pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                      <div className="text-xs font-bold text-cyan-400 border-b border-slate-800 pb-1.5 mb-2 flex justify-between items-center">
                        <span>{t.name}</span>
                        <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400' : 'bg-red-500'}`} />
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Status:</span>
                          <span className={isRunning ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{t.status}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Power Output:</span>
                          <span className="font-mono text-white font-bold">{livePower} MW</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Efficiency:</span>
                          <span className="font-mono text-cyan-300">{(t.efficiency * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Rotor RPM:</span>
                          <span className="font-mono text-slate-200">{isRunning ? (activeWindSpeed * 0.9).toFixed(1) : '0.0'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SVG Turbine Illustration */}
                  <div className="relative flex flex-col items-center transition-transform duration-300 group-hover:scale-110">
                    {/* Rotating Blades */}
                    <div 
                      className="absolute -top-16 w-20 h-20 flex items-center justify-center origin-center"
                      style={{ animation: isRunning ? `spin ${spinDuration} linear infinite` : 'none' }}
                    >
                      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                        <path d="M50 50 L47 10 Q50 2 53 10 Z" fill="#94a3b8" />
                        <path d="M50 50 L90 53 Q98 50 90 47 Z" fill="#94a3b8" />
                        <path d="M50 50 L53 90 Q50 98 47 90 Z" fill="#94a3b8" />
                        <circle cx="50" cy="50" r="5" fill="#334155" />
                      </svg>
                    </div>

                    {/* Nacelle & Tower */}
                    <div className="w-3 h-20 bg-gradient-to-r from-slate-600 via-slate-400 to-slate-700 rounded-t-sm shadow-2xl" />
                    <div className="w-8 h-2 bg-slate-700 rounded-sm" />
                  </div>

                  {/* Base Label */}
                  <div className="mt-3 text-center">
                    <span className="text-[11px] font-mono font-bold text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                      {t.id}
                    </span>
                    <div className="text-[10px] font-mono text-cyan-400 mt-0.5">{livePower} MW</div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* TELEMETRY GRAPHS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Actual vs Predicted Graph */}
          <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur p-6 rounded-2xl border border-slate-800 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Actual vs. Predicted 24-Hour Wind Speed Curve
              </h2>
              <span className="text-xs bg-cyan-950 text-cyan-300 font-mono font-semibold px-2.5 py-1 rounded-lg border border-cyan-800/60">
                LightGBM Models
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="horizon" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} unit=" m/s" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                  <Legend />
                  <Line type="monotone" dataKey="predicted" name="Predicted Horizon (m/s)" stroke="#06b6d4" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="actual" name="Actual Ground Truth (m/s)" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Power Yield Forecast Graph */}
          <div className="bg-slate-900/80 backdrop-blur p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              Forecasted Power Yield (MW)
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="horizon" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} unit="MW" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                  <Line type="monotone" dataKey="powerMW" name="Power Output (MW)" stroke="#a855f7" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}