import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import './SuperUserDashboard.css';
import '../common/ContentArea.css';
import '../common/SectionPlaceholder.css';
import {
    Home, Users, User, MapPin, Bird, Sprout, Mountain, Shield, Download,
    Database, BarChart2, Settings, ChevronDown, Bell, Globe, HelpCircle,
    TrendingUp, Calendar, LogOut, Briefcase, Activity, Server, FileText, CloudRain, Sun, Moon, Languages, UserCircle, Landmark, Building2, LayoutDashboard
} from 'lucide-react';

// Super User-specific components
import SuperUserSidebar from './SuperUserSidebar';
import SuperUserStats from './SuperUserStats';
import ATILogo from '../ATILogo';
import TopHeader from '../common/TopHeader';
import SidebarNavLink from '../common/SidebarNavLink';
import SectionPlaceholder from '../common/SectionPlaceholder';
import WorkflowRouter from '../workflow/WorkflowRouter';

const SUPER_SECTIONS = new Set([
  'overview',
  'farmer-registry',
  'livestock-registry',
  'crop-registry',
  'land-registry',
  'soil-registry',
  'seed-registry',
  'finance-portal',
  'catalogs',
  'data-integration-hub',
  'administration',
  'system-health',
  'tenant-management',
  'global-insights',
  'system-config',
]);

const SUPER_PLACEHOLDER = {
  'farmer-registry': {
    title: 'Farmer Registry',
    description: 'Super-user visibility across all tenants and override workflows.',
    breadcrumbs: ['Farmer Registry'],
  },
  'livestock-registry': {
    title: 'Livestock Registry',
    description: 'National livestock pipeline and integration status.',
    breadcrumbs: ['Livestock Registry'],
  },
  'crop-registry': {
    title: 'Crop Registry',
    description: 'Crop data lineage, APIs, and bulk correction tools.',
    breadcrumbs: ['Crop Registry'],
  },
  'finance-portal': {
    title: 'Finance Portal',
    description: 'System-wide finance integrations and consent policy.',
    breadcrumbs: ['Finance Portal'],
  },
  'land-registry': {
    title: 'Land Registry',
    description: 'National land parcels.',
    breadcrumbs: ['Land Registry'],
  },
  'soil-registry': {
    title: 'Soil Registry',
    description: 'Soil analytics.',
    breadcrumbs: ['Soil Registry'],
  },
  'seed-registry': {
    title: 'Seed Registry',
    description: 'Seed traceability.',
    breadcrumbs: ['Seed Registry'],
  },
  catalogs: {
    title: 'Catalogs',
    description: 'Master data catalogues.',
    breadcrumbs: ['Catalogs'],
  },
  'data-integration-hub': {
    title: 'Data Integration Hub',
    description: 'Connectors, schedules, and ETL health for external datasets (EIAR, ePhyto, banks).',
    breadcrumbs: ['Data Integration Hub'],
  },
  administration: {
    title: 'Administration',
    description: 'Realms, roles, tenants, and security policies.',
    breadcrumbs: ['Administration'],
  },
  'system-health': {
    title: 'System Health & Logs',
    description: 'Uptime, latency, error budgets, and centralized logs.',
    breadcrumbs: ['System Health & Logs'],
  },
  'tenant-management': {
    title: 'Tenant Management',
    description: 'Onboard banks and agencies, quotas, and feature entitlements.',
    breadcrumbs: ['Tenant Management'],
  },
  'global-insights': {
    title: 'Global Insights',
    description: 'Cross-cutting analytics and executive dashboards.',
    breadcrumbs: ['Global Insights'],
  },
  'system-config': {
    title: 'System Config',
    description: 'Environment settings, maintenance windows, and version matrix.',
    breadcrumbs: ['System Config'],
  },
};

const SuperUserDashboard = ({ userRole, onRoleChange, onLogout }) => {
    const { section } = useParams();
    const [theme, setTheme] = useState('light');
    const [language, setLanguage] = useState('en');
    const [dateFilter, setDateFilter] = useState('Today');
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [dataVersion, setDataVersion] = useState(0);
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);
    const [activities, setActivities] = useState([]);

    const activityTypes = [
        { type: 'Governance', heading: 'Policy updated', icon: <Shield size={16} />, bg: 'purple-bg' },
        { type: 'Security', heading: 'Infrastructure audit', icon: <Server size={16} />, bg: 'blue-bg' },
        { type: 'Data', heading: 'National sync completed', icon: <Database size={16} />, bg: 'green-bg' },
        { type: 'Alert', heading: 'System-wide notice', icon: <Bell size={16} />, bg: 'red-bg' },
        { type: 'Metrics', heading: 'Usage threshold peaked', icon: <TrendingUp size={16} />, bg: 'orange-bg' },
    ];

    useEffect(() => {
        const generateActivities = () => {
            const generated = [];
            for (let i = 1; i <= 100; i++) {
                const type = activityTypes[i % activityTypes.length];
                const timestamp = new Date();
                let dateCategory, timeDisplay;

                if (i <= 15) {
                    dateCategory = 'Today';
                    const hour = 17 - (i % 9);
                    timestamp.setHours(hour, (i * 7) % 60, 0);
                    timeDisplay = `Today, ${hour.toString().padStart(2, '0')}:${((i * 7) % 60).toString().padStart(2, '0')}`;
                } else if (i <= 30) {
                    dateCategory = 'Yesterday';
                    timestamp.setDate(timestamp.getDate() - 1);
                    const hour = 15 - (i % 8);
                    timestamp.setHours(hour, (i * 11) % 60, 0);
                    timeDisplay = `Yesterday, ${hour.toString().padStart(2, '0')}:${((i * 11) % 60).toString().padStart(2, '0')}`;
                } else if (i <= 50) {
                    dateCategory = 'This Week';
                    const daysAgo = 2 + (i % 5);
                    timestamp.setDate(timestamp.getDate() - daysAgo);
                    timeDisplay = timestamp.toLocaleDateString('en-US', { weekday: 'short' }) + ', ' + timestamp.getHours().toString().padStart(2, '0') + ':' + timestamp.getMinutes().toString().padStart(2, '0');
                } else {
                    dateCategory = 'This Month';
                    const daysAgo = 7 + (i % 53);
                    timestamp.setDate(timestamp.getDate() - daysAgo);
                    timeDisplay = timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }

                generated.push({
                    id: i,
                    type: type.type,
                    heading: type.heading,
                    text: `Audit log ID #${9000 + i}`,
                    time: timeDisplay,
                    timestamp: timestamp.getTime(),
                    icon: type.icon,
                    bg: type.bg,
                    dateCategory
                });
            }
            return generated.sort((a, b) => b.timestamp - a.timestamp);
        };
        setActivities(generateActivities());
    }, [dateFilter]);


    const getFilteredActivities = () => {
        const now = Date.now();
        const startTs = fromDate ? new Date(fromDate).setHours(0,0,0,0) : 0;
        const endTs = toDate ? new Date(toDate).setHours(23,59,59,999) : Infinity;

        switch (dateFilter) {
            case 'Today': return activities.filter(a => a.dateCategory === 'Today');
            case 'Yesterday': return activities.filter(a => a.dateCategory === 'Yesterday');
            case 'This Week': return activities.filter(a => a.timestamp >= now - 7 * 86400000);
            case 'This Month': return activities.filter(a => a.timestamp >= now - 30 * 86400000);
            case 'Custom Date': return activities.filter(a => a.timestamp >= startTs && a.timestamp <= endTs);
            default: return activities;
        }
    };
    const filteredActivities = getFilteredActivities();

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    const handleDateFilterSelect = (e) => {
        const filter = e.target.value;
        setDateFilter(filter);
        setShowCustomDatePicker(filter === 'Custom Date');
        if (filter !== 'Custom Date') setDataVersion(prev => prev + 1);
    };

    const handleFromDateChange = (e) => setFromDate(e.target.value);
    const handleToDateChange = (e) => setToDate(e.target.value);
    const handleApplyCustomDate = () => {
        if (fromDate && toDate) setDataVersion(prev => prev + 1);
    };

    if (!SUPER_SECTIONS.has(section)) {
        return <Navigate to="/dashboard/overview" replace />;
    }

    return (
        <div className={`dashboard-layout theme-${theme}`}>
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon"><Sprout size={24} color="#f59e0b" /></div>
                        <div className="logo-text"><h2>OpenAgriNet</h2><span className="logo-subtext">Ethiopia</span></div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <SidebarNavLink to="/dashboard/overview" end icon={<Home size={20} />}>
                        Admin Control
                    </SidebarNavLink>
                    <SuperUserSidebar />
                    <div className="sidebar-divider"></div>
                    <SidebarNavLink to="/dashboard/global-insights" icon={<BarChart2 size={20} />}>
                        Global Insights
                    </SidebarNavLink>
                    <SidebarNavLink to="/dashboard/system-config" icon={<Settings size={20} />}>
                        System Config
                    </SidebarNavLink>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                <TopHeader 
                    userRole={userRole} 
                    onRoleChange={onRoleChange} 
                    theme={theme} 
                    toggleTheme={toggleTheme} 
                    language={language} 
                    setLanguage={setLanguage} 
                    onLogout={onLogout} 
                />

                {section === 'overview' ? (
                <div className="content-area">
                    <div className="page-header">
                        <div className="page-header-left">
                            <h1>Super User Terminal</h1>
                            <p>Global oversight across the <span className="highlight-text">Ethiopian Agricultural Grid</span></p>
                        </div>
                        <div className="page-header-right">
                            <div className="page-header-actions">
                                <div className="compact-date-wrapper">
                                    <div className="compact-date-label">Audit Range</div>
                                    <div className="compact-date-select-container">
                                        <Calendar size={18} className="compact-icon text-gray" />
                                        <select value={dateFilter} onChange={handleDateFilterSelect} className="compact-date-select">
                                            <option value="Today">Today</option>
                                            <option value="Yesterday">Yesterday</option>
                                            <option value="This Week">This Week</option>
                                            <option value="This Month">This Month</option>
                                            <option value="Custom Date">Custom Range</option>
                                        </select>
                                    </div>
                                    {showCustomDatePicker && (
                                        <div className="compact-custom-date-popup">
                                            <div className="date-range-inputs">
                                                <input type="date" value={fromDate} onChange={handleFromDateChange} className="custom-date-input" />
                                                <input type="date" value={toDate} onChange={handleToDateChange} className="custom-date-input" />
                                            </div>
                                            <button className="apply-custom-date-btn" onClick={handleApplyCustomDate} disabled={!fromDate || !toDate}>Run Audit</button>
                                        </div>
                                    )}
                                </div>
                                <div className="download-action-wrapper">
                                    <button className="download-action-btn" onClick={() => setShowDownloadOptions(!showDownloadOptions)}>
                                        <Download size={18} /><span>Export All</span><ChevronDown size={16} />
                                    </button>
                                    {showDownloadOptions && (
                                        <div className="download-options-dropdown">
                                            <button className="download-option" onClick={() => setShowDownloadOptions(false)}><FileText size={16} /><span>Full DB CSV</span></button>
                                            <button className="download-option" onClick={() => setShowDownloadOptions(false)}><FileText size={16} /><span>Security PDF</span></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="stats-grid">
                        <SuperUserStats dateFilter={dateFilter} dataVersion={dataVersion} />
                    </div>

                    <div className="dashboard-bottom">
                        <div className="recent-activities card">
                            <h3 className="card-title">Governance Logs</h3>
                            <div className="activity-list">
                                {filteredActivities.map(activity => (
                                    <div className="activity-item" key={activity.id}>
                                        <div className={`activity-icon ${activity.bg}`}>{activity.icon}</div>
                                        <div className="activity-content">
                                            <div className="activity-heading">{activity.heading}</div>
                                            <div className="activity-running-text">{activity.text}</div>
                                        </div>
                                        <div className="activity-time">{activity.time}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="completion-status card">
                            <h3 className="card-title">Global Progress</h3>
                            <div className="progress-list">
                                <div className="progress-item">
                                    <div className="progress-header"><span className="progress-label">National Coverage</span><span className="progress-percentage">78%</span></div>
                                    <div className="progress-bar-bg"><div className="progress-bar fill-purple" style={{ width: '78%' }}></div></div>
                                </div>
                                <div className="progress-item">
                                    <div className="progress-header"><span className="progress-label">Woreda Connectivity</span><span className="progress-percentage">92%</span></div>
                                    <div className="progress-bar-bg"><div className="progress-bar fill-green" style={{ width: '92%' }}></div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ) : (
                <WorkflowRouter
                    portalRole="Super User"
                    section={section}
                    theme={theme}
                    fallback={
                        <SectionPlaceholder
                            title={SUPER_PLACEHOLDER[section].title}
                            description={SUPER_PLACEHOLDER[section].description}
                            breadcrumbs={SUPER_PLACEHOLDER[section].breadcrumbs}
                        />
                    }
                />
                )}
            </main>
        </div>
    );
};

export default SuperUserDashboard;