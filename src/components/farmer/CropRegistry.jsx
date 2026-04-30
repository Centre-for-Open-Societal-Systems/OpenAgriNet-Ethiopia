import React, { useEffect, useState } from 'react';
import { Search, Download, Sprout, Menu, Home, Plus } from 'lucide-react';
import './FarmerDashboard.css';
import '../common/ContentArea.css';
import './FarmerRegistry.css';
import FarmerSidebar from './FarmerSidebar';
import TopHeader from '../common/TopHeader';
import SidebarNavLink from '../common/SidebarNavLink';
import { fetchCropRegistry } from '../../api/cropRegistry';

const CropRegistry = ({ userRole, onRoleChange, onLogout }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const toggleSidebar = () => setIsSidebarOpen(open => !open);

  useEffect(() => {
    fetchCropRegistry()
      .then(data => { setRecords(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (r.zone_name && r.zone_name.toLowerCase().includes(q)) ||
      (r.owner_name && r.owner_name.toLowerCase().includes(q)) ||
      (r.crop_name && r.crop_name.toLowerCase().includes(q));
    const matchSeason = !seasonFilter || r.crop_season === seasonFilter;
    return matchSearch && matchSeason;
  });

  return (
    <div className={`dashboard-layout theme-${theme} ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon"><Sprout size={24} color="#f59e0b" /></div>
            <div className="logo-text">
              <h2>OpenAgriNet</h2>
              <span className="logo-subtext">Ethiopia</span>
            </div>
          </div>
          <button type="button" className="sidebar-embedded-toggler" onClick={toggleSidebar}>
            <Menu size={20} color="white" />
          </button>
        </div>
        <nav className="sidebar-nav">
          <SidebarNavLink to="/dashboard/overview" end icon={<Home size={20} />}>Dashboard</SidebarNavLink>
          <FarmerSidebar />
        </nav>
      </aside>

      <main className="dashboard-main">
        <TopHeader
          userRole={userRole}
          onRoleChange={onRoleChange}
          theme={theme}
          toggleTheme={toggleTheme}
          language={language}
          setLanguage={setLanguage}
          onLogout={onLogout}
          toggleSidebar={toggleSidebar}
        />

        <div className="content-area">
          <nav className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
            <a href="/dashboard/overview" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</a>
            <span>›</span>
            <span style={{ color: '#111827' }}>Crop Registry</span>
          </nav>

          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>Crop Registry</h1>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e5e7eb', marginBottom: '20px' }}>
            <button
              onClick={() => setActiveTab('list')}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'list' ? '600' : '400',
                color: activeTab === 'list' ? '#f59e0b' : '#6b7280',
                borderBottom: activeTab === 'list' ? '2px solid #f59e0b' : '2px solid transparent',
                marginBottom: '-2px'
              }}
            >
              Production List
            </button>
            <button
              onClick={() => setActiveTab('new')}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === 'new' ? '600' : '400',
                color: activeTab === 'new' ? '#f59e0b' : '#6b7280',
                borderBottom: activeTab === 'new' ? '2px solid #f59e0b' : '2px solid transparent',
                marginBottom: '-2px'
              }}
            >
              New Registration
            </button>
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 12px', gap: '8px', flex: 1, maxWidth: '360px', background: '#fff' }}>
              <Search size={16} color="#9ca3af" />
              <input
                type="search"
                placeholder="Search by Zone, Owner, or Crop"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: '14px', width: '100%', background: 'transparent' }}
              />
            </div>
            <select
              value={seasonFilter}
              onChange={e => setSeasonFilter(e.target.value)}
              style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 12px', fontSize: '14px', background: '#fff', color: '#374151' }}
            >
              <option value="">All Seasons</option>
              {[...new Set(records.map(r => r.crop_season).filter(Boolean))].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 12px', fontSize: '14px', background: '#fff', color: '#374151' }}>
              <option value="">All Regions</option>
            </select>
            <button style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', background: '#fff', cursor: 'pointer', color: '#374151' }}>
              Export
            </button>
            <button style={{ border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', background: '#f59e0b', cursor: 'pointer', color: '#fff', fontWeight: '600', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> New Production Record
            </button>
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {loading ? (
              <p style={{ padding: '24px', color: '#9ca3af' }}>Loading...</p>
            ) : error ? (
              <p style={{ padding: '24px', color: '#ef4444' }}>Error: {error}</p>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}><input type="checkbox" /></th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Zone Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Land ID</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Crop Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Season / Year</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Land Area</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Owner Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Woreda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>No records found</td>
                      </tr>
                    ) : (
                      filtered.map((r, i) => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                        >
                          <td style={{ padding: '12px 16px' }}><input type="checkbox" /></td>
                          <td style={{ padding: '12px 16px', color: '#111827' }}>{r.zone_name || '—'}</td>
                          <td style={{ padding: '12px 16px', color: '#111827' }}>{r.land_id || '—'}</td>
                          <td style={{ padding: '12px 16px', color: '#111827' }}>{r.crop_name || '—'}</td>
                          <td style={{ padding: '12px 16px', color: '#111827' }}>{r.crop_season || '—'}</td>
                          <td style={{ padding: '12px 16px', color: '#111827' }}>{r.land_area || '—'}</td>
                          <td style={{ padding: '12px 16px', color: '#111827' }}>{r.owner_name || '—'}</td>
                          <td style={{ padding: '12px 16px', color: '#111827' }}>{r.woreda_name || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Showing 1–{filtered.length} of {filtered.length} records</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button disabled style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'not-allowed', color: '#9ca3af', fontSize: '13px' }}>Previous</button>
                    <button style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>Next</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CropRegistry;
