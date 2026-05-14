import React, { useState, useEffect } from 'react';
import { Users, Smartphone, MessageSquare, Activity, ShieldAlert, BarChart3, LineChart as LineIcon, CreditCard, IndianRupee } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import API from '../../api/axiosConfig';
import '../Dashboard/Dashboard.css';
import '../Dashboard/Overview.css';
import './Admin.css';

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInstances: 0,
    totalMessages: 0,
    totalRevenue: 0
  });

  // Interactions Chart State
  const [chartData, setChartData] = useState([]);
  const [totalInteractions, setTotalInteractions] = useState(0);
  const [chartType, setChartType] = useState('bar');
  const [range, setRange] = useState('weekly');
  const [chartLoading, setChartLoading] = useState(true);

  // Revenue Chart State
  const [revChartData, setRevChartData] = useState([]);
  const [totalRevPeriod, setTotalRevPeriod] = useState(0);
  const [revChartType, setRevChartType] = useState('line');
  const [revRange, setRevRange] = useState('weekly');
  const [revChartLoading, setRevChartLoading] = useState(true);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const res = await API.get('/admin/stats');
        setStats(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Stats Fetch Error:", err);
      }
    };
    fetchGlobalStats();
  }, []);

  // Fetch Interactions Analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      setChartLoading(true);
      try {
        const res = await API.get(`/admin/analytics/daily?range=${range}`);
        setChartData(res.data.dailyInteractions);
        setTotalInteractions(res.data.totalInteractions);
      } catch (err) {
        console.error("Analytics Fetch Error:", err);
      } finally {
        setChartLoading(false);
      }
    };
    fetchAnalytics();
  }, [range]);

  // Fetch Revenue Analytics
  useEffect(() => {
    const fetchRevAnalytics = async () => {
      setRevChartLoading(true);
      try {
        const res = await API.get(`/admin/analytics/revenue?range=${revRange}`);
        setRevChartData(res.data.dailyRevenue);
        setTotalRevPeriod(res.data.totalRevenue);
      } catch (err) {
        console.error("Revenue Analytics Fetch Error:", err);
      } finally {
        setRevChartLoading(false);
      }
    };
    fetchRevAnalytics();
  }, [revRange]);

  const statCards = [
    { name: 'Total Users', value: stats.totalUsers, icon: <Users />, color: 'var(--primary)' },
    { name: 'Total Instances', value: stats.totalInstances, icon: <Smartphone />, color: '#3b82f6' },
    { name: 'Total Messages', value: stats.totalMessages, icon: <MessageSquare />, color: '#10b981' },
    { name: 'Total Revenue', value: `₹${stats.totalRevenue?.toLocaleString()}`, icon: <CreditCard />, color: '#8b5cf6' },
  ];

  return (
    <div className="overview-container admin-mode animate-fade-in">
      <div className="stats-grid">
        {statCards.map((stat, i) => (
          <div key={i} className="stat-card admin-stat glass">
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <span className="stat-label">{stat.name}</span>
              <h2 className="stat-value">{loading ? '...' : stat.value.toLocaleString()}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid mt-6">
        {/* Interaction Chart */}
        <div className="dashboard-card glass">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="stat-icon-sm" style={{ color: 'var(--primary)', background: 'var(--primary)15', padding: '6px', borderRadius: '8px' }}>
                <Activity size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem' }}>System Interactions</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{chartLoading ? '...' : totalInteractions.toLocaleString()}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total this {range === 'weekly' ? 'week' : 'month'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="chart-toggles" style={{ display: 'flex', gap: '2px', background: 'var(--surface)', padding: '3px', borderRadius: '6px' }}>
                <button className={`chart-toggle-btn ${range === 'weekly' ? 'active' : ''}`} onClick={() => setRange('weekly')} style={{ padding: '4px 10px', borderRadius: '4px', background: range === 'weekly' ? 'var(--primary)' : 'transparent', color: range === 'weekly' ? '#fff' : 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>W</button>
                <button className={`chart-toggle-btn ${range === 'monthly' ? 'active' : ''}`} onClick={() => setRange('monthly')} style={{ padding: '4px 10px', borderRadius: '4px', background: range === 'monthly' ? 'var(--primary)' : 'transparent', color: range === 'monthly' ? '#fff' : 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>M</button>
              </div>
              <div className="chart-toggles" style={{ display: 'flex', gap: '2px', background: 'var(--surface)', padding: '3px', borderRadius: '6px' }}>
                <button className={`chart-toggle-btn ${chartType === 'bar' ? 'active' : ''}`} onClick={() => setChartType('bar')} style={{ padding: '4px', borderRadius: '4px', background: chartType === 'bar' ? 'var(--primary)' : 'transparent', color: chartType === 'bar' ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', display: 'flex' }} title="Bar Chart"><BarChart3 size={14} /></button>
                <button className={`chart-toggle-btn ${chartType === 'line' ? 'active' : ''}`} onClick={() => setChartType('line')} style={{ padding: '4px', borderRadius: '4px', background: chartType === 'line' ? 'var(--primary)' : 'transparent', color: chartType === 'line' ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', display: 'flex' }} title="Line Chart"><LineIcon size={14} /></button>
              </div>
            </div>
          </div>

          <div className="card-body" style={{ height: '300px', padding: '16px' }}>
            {chartLoading ? (
              <div className="flex items-center justify-center h-full"><div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Updating...</div></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} dy={10} interval={range === 'monthly' ? 6 : 0} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <Tooltip cursor={false} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.8rem' }} itemStyle={{ color: 'var(--primary)' }} />
                    <Bar dataKey="users" radius={[2, 2, 0, 0]} barSize={range === 'monthly' ? 6 : 24}>
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? 'var(--primary)' : 'var(--primary)80'} />)}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} dy={10} interval={range === 'monthly' ? 6 : 0} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <Tooltip cursor={false} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.8rem' }} itemStyle={{ color: 'var(--primary)' }} />
                    <Line type="monotone" dataKey="users" stroke="var(--primary)" strokeWidth={2} dot={range === 'weekly' ? { r: 3, fill: 'var(--primary)', strokeWidth: 1.5, stroke: 'var(--bg)' } : false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="dashboard-card glass">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="stat-icon-sm" style={{ color: '#8b5cf6', background: '#8b5cf615', padding: '6px', borderRadius: '8px' }}>
                <IndianRupee size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Revenue Growth</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{revChartLoading ? '...' : `₹${totalRevPeriod.toLocaleString()}`}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total this {revRange === 'weekly' ? 'week' : 'month'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="chart-toggles" style={{ display: 'flex', gap: '2px', background: 'var(--surface)', padding: '3px', borderRadius: '6px' }}>
                <button className={`chart-toggle-btn ${revRange === 'weekly' ? 'active' : ''}`} onClick={() => setRevRange('weekly')} style={{ padding: '4px 10px', borderRadius: '4px', background: revRange === 'weekly' ? '#8b5cf6' : 'transparent', color: revRange === 'weekly' ? '#fff' : 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>W</button>
                <button className={`chart-toggle-btn ${revRange === 'monthly' ? 'active' : ''}`} onClick={() => setRevRange('monthly')} style={{ padding: '4px 10px', borderRadius: '4px', background: revRange === 'monthly' ? '#8b5cf6' : 'transparent', color: revRange === 'monthly' ? '#fff' : 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>M</button>
              </div>
              <div className="chart-toggles" style={{ display: 'flex', gap: '2px', background: 'var(--surface)', padding: '3px', borderRadius: '6px' }}>
                <button className={`chart-toggle-btn ${revChartType === 'bar' ? 'active' : ''}`} onClick={() => setRevChartType('bar')} style={{ padding: '4px', borderRadius: '4px', background: revChartType === 'bar' ? '#8b5cf6' : 'transparent', color: revChartType === 'bar' ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', display: 'flex' }} title="Bar Chart"><BarChart3 size={14} /></button>
                <button className={`chart-toggle-btn ${revChartType === 'line' ? 'active' : ''}`} onClick={() => setRevChartType('line')} style={{ padding: '4px', borderRadius: '4px', background: revChartType === 'line' ? '#8b5cf6' : 'transparent', color: revChartType === 'line' ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', display: 'flex' }} title="Line Chart"><LineIcon size={14} /></button>
              </div>
            </div>
          </div>

          <div className="card-body" style={{ height: '300px', padding: '16px' }}>
            {revChartLoading ? (
              <div className="flex items-center justify-center h-full"><div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Updating...</div></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" >
                {revChartType === 'bar' ? (
                  <BarChart data={revChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} dy={10} interval={revRange === 'monthly' ? 6 : 0} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <Tooltip cursor={false} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.8rem' }} itemStyle={{ color: '#8b5cf6' }} />
                    <Bar dataKey="amount" radius={[2, 2, 0, 0]} barSize={revRange === 'monthly' ? 6 : 24}>
                      {revChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === revChartData.length - 1 ? '#8b5cf6' : '#8b5cf680'} />)}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={revChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} dy={10} interval={revRange === 'monthly' ? 6 : 0} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <Tooltip cursor={false} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.8rem' }} itemStyle={{ color: '#8b5cf6' }} />
                    <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} dot={revRange === 'weekly' ? { r: 3, fill: '#8b5cf6', strokeWidth: 1.5, stroke: 'var(--bg)' } : false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminOverview;