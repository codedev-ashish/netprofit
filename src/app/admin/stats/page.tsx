"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Activity, Globe, MapPin, Users, Loader2 } from "lucide-react";

type StatData = {
  totalVisits: number;
  graphData: { name: string; visits: number }[];
  countryData: { name: string; visits: number }[];
  indiaData: { name: string; visits: number }[];
};

export default function StatsPage() {
  const [range, setRange] = useState("24h");
  const [data, setData] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);

  const ranges = [
    { label: "Realtime (5m)", value: "realtime" },
    { label: "Last 1 Hour", value: "1h" },
    { label: "Last 24 Hours", value: "24h" },
    { label: "Last 7 Days", value: "7d" },
    { label: "Last 30 Days", value: "30d" },
    { label: "Last 3 Months", value: "3m" },
    { label: "Last 6 Months", value: "6m" },
    { label: "Last 1 Year", value: "1y" },
    { label: "All Time", value: "all" },
  ];

  const fetchStats = async (selectedRange: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?range=${selectedRange}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(range);
  }, [range]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="md:flex-row md:justify-between md:items-center">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '0.25rem' }}>Traffic Analytics</h1>
          <p style={{ color: 'var(--text-muted)' }}>Monitor your website visitors and geographical distribution.</p>
        </div>
        
        <div style={{ 
          background: 'var(--card-bg)', 
          padding: '0.25rem', 
          borderRadius: 'var(--radius)', 
          border: '1px solid var(--border-color)', 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '0.25rem' 
        }}>
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: range === r.value ? 'var(--primary-color)' : 'transparent',
                color: range === r.value ? '#ffffff' : 'var(--text-color)',
                boxShadow: range === r.value ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '16rem', color: 'var(--text-muted)', gap: '1rem' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--icon-color)' }} />
          <p className="animate-pulse">Loading analytics data...</p>
        </div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div className="premium-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: '-1rem', top: '-1rem', width: '6rem', height: '6rem', background: 'var(--primary-color)', opacity: 0.1, borderRadius: '50%' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--icon-color)', borderRadius: '8px' }}>
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Total Visits ({ranges.find(r => r.value === range)?.label})</h3>
              <p style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-color)', marginTop: '0.5rem' }}>{data?.totalVisits.toLocaleString()}</p>
            </div>
          </div>

          {/* Chart Section */}
          <div className="premium-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-color)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
              <Activity className="w-5 h-5 mr-2" style={{ color: 'var(--icon-color)', marginRight: '0.5rem' }} />
              Traffic Overview
            </h3>
            <div style={{ height: '400px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.graphData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', boxShadow: 'var(--shadow)' }}
                    itemStyle={{ color: 'var(--text-color)', fontWeight: 600 }}
                    labelStyle={{ color: 'var(--text-muted)' }}
                  />
                  <Area type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Demographics Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Country Data */}
            <div className="premium-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
                <Globe className="w-5 h-5" style={{ color: 'var(--icon-color)', marginRight: '0.5rem' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-color)' }}>Traffic by Country</h3>
              </div>
              <div style={{ flex: 1, overflow: 'auto', maxHeight: '400px' }}>
                <table style={{ width: '100%', textAlign: 'left', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                    <tr>
                      <th style={{ padding: '0.75rem 1.5rem', fontWeight: 500 }}>Country Code</th>
                      <th style={{ padding: '0.75rem 1.5rem', fontWeight: 500, textAlign: 'right' }}>Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.countryData.length === 0 && (
                      <tr><td colSpan={2} style={{ padding: '1rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data available</td></tr>
                    )}
                    {data?.countryData.map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-color)' }}>{c.name}</td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>{c.visits.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* India Locations Data */}
            <div className="premium-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
                <MapPin className="w-5 h-5" style={{ color: 'var(--icon-color)', marginRight: '0.5rem' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-color)' }}>India: Top Locations</h3>
              </div>
              <div style={{ flex: 1, overflow: 'auto', maxHeight: '400px' }}>
                <table style={{ width: '100%', textAlign: 'left', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                    <tr>
                      <th style={{ padding: '0.75rem 1.5rem', fontWeight: 500 }}>City, Region</th>
                      <th style={{ padding: '0.75rem 1.5rem', fontWeight: 500, textAlign: 'right' }}>Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.indiaData.length === 0 && (
                      <tr><td colSpan={2} style={{ padding: '1rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data available for India</td></tr>
                    )}
                    {data?.indiaData.map((loc, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-color)' }}>{loc.name}</td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>{loc.visits.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
