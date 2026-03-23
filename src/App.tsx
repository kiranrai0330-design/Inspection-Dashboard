/**
 * @license
 * Descartes Compliance Suite
 * 
 * Main application component for the Geotab Inspection Dashboard.
 * Handles data fetching, group filtering, and KPI visualization.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Download, 
  RefreshCw, 
  Users, 
  Calendar,
  ChevronRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { mockGeotabApi } from './mockGeotab';
import { DriverData, KPIStats, GeotabGroup } from './types';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [dateStart, setDateStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [masterData, setMasterData] = useState<Record<string, DriverData>>({});
  const [currentDates, setCurrentDates] = useState<string[]>([]);
  
  // Simulation: Global Group Filter
  const [availableGroups, setAvailableGroups] = useState<GeotabGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<GeotabGroup[]>([]);

  const handleDateStartChange = (newStart: string) => {
    const start = new Date(newStart + 'T00:00:00');
    const end = new Date(dateEnd + 'T00:00:00');
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 6 || diffDays < 0) {
      const adjustedEnd = new Date(start);
      adjustedEnd.setDate(start.getDate() + 6);
      setDateEnd(adjustedEnd.toISOString().split('T')[0]);
    }
    setDateStart(newStart);
  };

  const handleDateEndChange = (newEnd: string) => {
    const end = new Date(newEnd + 'T00:00:00');
    const start = new Date(dateStart + 'T00:00:00');
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 6 || diffDays < 0) {
      const adjustedStart = new Date(end);
      adjustedStart.setDate(end.getDate() - 6);
      setDateStart(adjustedStart.toISOString().split('T')[0]);
    }
    setDateEnd(newEnd);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const fromDate = new Date(dateStart + 'T00:00:00').toISOString();
      const toDate = new Date(dateEnd + 'T23:59:59').toISOString();

      // Use the real Geotab API if available, otherwise fall back to mock
      const api = (window as any).geotabApi || mockGeotabApi;

      // 1. Fetch Groups first if we don't have them
      let groups = availableGroups;
      if (groups.length === 0) {
        groups = await api.call("Get", { typeName: "Group" });
        setAvailableGroups(groups);
      }

      // 2. Fetch main data with group filtering
      // Note: In production, we pass selectedGroups to the search objects
      const [trips, dvirs, users, devices] = await Promise.all([
        api.call("Get", { 
          typeName: "Trip", 
          search: { 
            fromDate, 
            toDate,
            deviceSearch: selectedGroups.length > 0 ? { groups: selectedGroups } : undefined
          } 
        }),
        api.call("Get", { 
          typeName: "DVIRLog", 
          search: { 
            fromDate, 
            toDate,
            // DVIRLog filtering by group usually requires filtering by device or user first
          } 
        }),
        api.call("Get", { 
          typeName: "User",
          search: selectedGroups.length > 0 ? { groups: selectedGroups } : undefined
        }),
        api.call("Get", { 
          typeName: "Device",
          search: selectedGroups.length > 0 ? { groups: selectedGroups } : undefined
        })
      ]);

      const groupMap = groups.reduce((acc: any, g: any) => ({ ...acc, [g.id]: g.name }), {});
      const userMap = users.reduce((acc: any, u: any) => ({ ...acc, [u.id]: u }), {});
      const deviceMap = devices.reduce((acc: any, v: any) => ({ ...acc, [v.id]: v.name }), {});

      const newMasterData: Record<string, DriverData> = {};
      
      // Build date range
      const dates: string[] = [];
      let tempDate = new Date(dateStart + 'T00:00:00');
      const stopDate = new Date(dateEnd + 'T00:00:00');
      while (tempDate <= stopDate) {
        dates.push(tempDate.toISOString().split('T')[0]);
        tempDate.setDate(tempDate.getDate() + 1);
      }
      setCurrentDates(dates);

      // Process Trips
      trips.forEach((t: any) => {
        if (!t.driver?.id) return;
        const dId = t.driver.id;
        const date = t.start.split('T')[0];

        // Only include drivers that were returned in the filtered User list
        if (!userMap[dId]) return;

        if (!newMasterData[dId]) {
          const u = userMap[dId] || {};
          newMasterData[dId] = {
            id: dId,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || dId,
            email: u.name || "N/A",
            groups: (u.companyGroups || []).map((g: any) => groupMap[g.id] || g.id).join(', ') || 'General',
            days: {}
          };
        }

        if (!newMasterData[dId].days[date]) {
          newMasterData[dId].days[date] = { miles: 0, vehicles: new Set(), inspections: 0 };
        }

        newMasterData[dId].days[date].miles += t.distance / 1609.34;
        newMasterData[dId].days[date].vehicles.add(deviceMap[t.device.id] || t.device.id);
      });

      // Process DVIRs
      dvirs.forEach((log: any) => {
        if (!log.driver?.id) return;
        const dId = log.driver.id;
        const date = log.dateTime.split('T')[0];

        // Only include if driver exists in our filtered list
        if (!newMasterData[dId]) return;

        if (!newMasterData[dId].days[date]) {
          newMasterData[dId].days[date] = { miles: 0, vehicles: new Set(), inspections: 0 };
        }

        newMasterData[dId].days[date].inspections++;
      });

      setMasterData(newMasterData);
    } catch (err) {
      console.error("Failed to fetch Geotab data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for Geotab focus event to refresh data
    const handleFocus = () => fetchData();
    window.addEventListener('geotab-focus', handleFocus);
    return () => window.removeEventListener('geotab-focus', handleFocus);
  }, [selectedGroups]); // Re-fetch when group filter changes

  const stats = useMemo<KPIStats>(() => {
    let red = 0, yellow = 0, green = 0;
    (Object.values(masterData) as DriverData[]).forEach(driver => {
      currentDates.forEach(date => {
        const day = driver.days[date];
        if (!day || day.miles === 0) return;
        
        if (day.inspections === 0) red++;
        else if (day.inspections < day.vehicles.size) yellow++;
        else green++;
      });
    });
    const total = red + yellow + green;
    return {
      missing: red,
      partial: yellow,
      compliant: green,
      score: total ? Math.round((green / total) * 100) : 0
    };
  }, [masterData, currentDates]);

  const exportToCSV = () => {
    let csv = 'Driver,Email,Groups,' + currentDates.join(',') + '\n';
    (Object.values(masterData) as DriverData[]).forEach(d => {
      let row = `"${d.name}","${d.email}","${d.groups}"`;
      currentDates.forEach(date => {
        const day = d.days[date];
        row += day ? `,"Insp: ${day.inspections} Miles: ${Math.round(day.miles)}"` : ',"-"';
      });
      csv += row + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'Geotab_Inspection_Report.csv');
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-[#1e293b] text-white px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-blue-500 p-2 rounded-lg relative">
            <ShieldCheck className="w-6 h-6 text-white" />
            {!(window as any).geotabApi && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 border-2 border-[#1e293b] rounded-full" title="Using Mock Data" />
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Inspection Dashboard</h1>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Descartes Compliance Suite</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Simulation: Group Filter Selector */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
            <Users className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-transparent text-xs text-slate-200 outline-none border-none cursor-pointer"
              onChange={(e) => {
                const val = e.target.value;
                if (val === "all") setSelectedGroups([]);
                else {
                  const group = availableGroups.find(g => g.id === val);
                  if (group) setSelectedGroups([group]);
                }
              }}
            >
              <option value="all" className="bg-slate-800">All Groups</option>
              {availableGroups.map(g => (
                <option key={g.id} value={g.id} className="bg-slate-800">{g.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <input 
                type="date" 
                value={dateStart} 
                onChange={(e) => handleDateStartChange(e.target.value)}
                className="bg-transparent text-sm px-2 py-1 outline-none border-none text-slate-200"
              />
              <ChevronRight className="w-4 h-4 text-slate-500" />
              <input 
                type="date" 
                value={dateEnd} 
                onChange={(e) => handleDateEndChange(e.target.value)}
                className="bg-transparent text-sm px-2 py-1 outline-none border-none text-slate-200"
              />
            </div>
            <span className="text-[9px] text-slate-500 font-medium uppercase text-center">Max 7 days range</span>
          </div>
          <button 
            onClick={fetchData}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Update
          </button>
          <button 
            onClick={exportToCSV}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </header>

      <main className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* KPI Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            label="Non-Compliant" 
            value={stats.missing} 
            subtext="Drove with 0 inspections" 
            color="red" 
            icon={<AlertCircle className="w-5 h-5" />}
          />
          <KPICard 
            label="Partial Compliance" 
            value={stats.partial} 
            subtext="Missed secondary vehicles" 
            color="amber" 
            icon={<Clock className="w-5 h-5" />}
          />
          <KPICard 
            label="Fully Compliant" 
            value={stats.compliant} 
            subtext="All vehicles inspected" 
            color="emerald" 
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <KPICard 
            label="Fleet Score" 
            value={`${stats.score}%`} 
            subtext="Overall compliance rate" 
            color="blue" 
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </section>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-bottom border-slate-200">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    Driver Details
                  </th>
                  {currentDates.map(date => (
                    <th key={date} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[160px] text-center">
                      {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan={currentDates.length + 1} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                          <p className="text-slate-400 font-medium">Analyzing fleet compliance...</p>
                        </div>
                      </td>
                    </motion.tr>
                  ) : (Object.values(masterData) as DriverData[]).length === 0 ? (
                    <tr>
                      <td colSpan={currentDates.length + 1} className="p-20 text-center text-slate-400">
                        No driver activity found for this period.
                      </td>
                    </tr>
                  ) : (
                    (Object.values(masterData) as DriverData[]).sort((a, b) => a.name.localeCompare(b.name)).map((driver, idx) => (
                      <motion.tr 
                        key={driver.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="p-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                              {driver.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">{driver.name}</div>
                              <div className="text-[10px] text-slate-400 font-medium uppercase truncate max-w-[180px]">{driver.groups}</div>
                            </div>
                          </div>
                        </td>
                        {currentDates.map(date => {
                          const day = driver.days[date];
                          if (!day || day.miles === 0) {
                            return <td key={date} className="p-4 text-center text-slate-300 italic text-xs">No Activity</td>;
                          }

                          const vCount = day.vehicles.size;
                          let status = 'green';
                          if (day.inspections === 0) status = 'red';
                          else if (day.inspections < vCount) status = 'amber';

                          return (
                            <td key={date} className="p-2">
                              <div className={`
                                rounded-lg p-3 text-center border-l-4 transition-all
                                ${status === 'red' ? 'bg-red-50 border-red-500 text-red-700' : ''}
                                ${status === 'amber' ? 'bg-amber-50 border-amber-500 text-amber-700' : ''}
                                ${status === 'green' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : ''}
                              `}>
                                <div className="text-sm font-bold">{day.inspections} / {vCount}</div>
                                <div className="text-[10px] opacity-70 font-medium uppercase">{Math.round(day.miles)} Miles</div>
                              </div>
                            </td>
                          );
                        })}
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function KPICard({ label, value, subtext, color, icon }: { label: string, value: string | number, subtext: string, color: string, icon: React.ReactNode }) {
  const colors: Record<string, string> = {
    red: "border-red-500 text-red-600 bg-red-50/50",
    amber: "border-amber-500 text-amber-600 bg-amber-50/50",
    emerald: "border-emerald-500 text-emerald-600 bg-emerald-50/50",
    blue: "border-blue-500 text-blue-600 bg-blue-50/50"
  };

  return (
    <div className={`bg-white p-5 rounded-xl border-t-4 shadow-sm ${colors[color]} transition-transform hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</span>
        <div className="opacity-40">{icon}</div>
      </div>
      <div className="text-3xl font-black mb-1">{value}</div>
      <p className="text-xs text-slate-400 font-medium">{subtext}</p>
    </div>
  );
}

