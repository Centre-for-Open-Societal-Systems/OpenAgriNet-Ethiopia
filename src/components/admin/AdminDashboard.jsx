import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import './AdminDashboard.css';
import '../common/ContentArea.css';
import '../common/SectionPlaceholder.css';
import {
    Home, Users, User, MapPin, Bird, Sprout, Mountain, Shield, Download,
    Database, BarChart2, Settings, ChevronDown, Bell, Globe, HelpCircle,
    TrendingUp, Calendar, LogOut, Briefcase, Activity, Server, FileText, CloudRain, Sun, Moon, Languages, UserCircle, Landmark, Building2, LayoutDashboard
} from 'lucide-react';

// Admin-specific components
import AdminSidebar from './AdminSidebar';
import AdminStats from './AdminStats';
import ATILogo from '../ATILogo';
import TopHeader from '../common/TopHeader';
import SidebarNavLink from '../common/SidebarNavLink';
import SectionPlaceholder from '../common/SectionPlaceholder';
import WorkflowRouter from '../workflow/WorkflowRouter';

const ADMIN_SECTIONS = new Set([
  'overview',
  'farmer-registry',
  'livestock-registry',
  'crop-registry',
  'land-registry',
  'soil-registry',
  'seed-registry',
  'finance-portal',
  'crop-master',
  'location-master',
  'livestock-master',
  'reports-analytics',
  'admin-settings',
]);

const ADMIN_PLACEHOLDER = {
  'farmer-registry': {
    title: 'Farmer Registry',
    description: 'ATI admin view of national farmer registry, verification queues, and bulk actions.',
    breadcrumbs: ['Farmer Registry'],
  },
  'livestock-registry': {
    title: 'Livestock Registry',
    description: 'Oversight of livestock master data and regional completeness.',
    breadcrumbs: ['Livestock Registry'],
  },
  'crop-registry': {
    title: 'Crop Registry',
    description: 'Crop and plot registry governance and data quality dashboards.',
    breadcrumbs: ['Crop Registry'],
  },
  'finance-portal': {
    title: 'Finance Portal',
    description: 'Cross-bank finance metrics and consent audit hooks.',
    breadcrumbs: ['Finance Portal'],
  },
  'land-registry': {
    title: 'Land Registry',
    description: 'Land parcels and verification.',
    breadcrumbs: ['Land Registry'],
  },
  'soil-registry': {
    title: 'Soil Registry',
    description: 'Soil samples and lab results.',
    breadcrumbs: ['Soil Registry'],
  },
  'seed-registry': {
    title: 'Seed Registry',
    description: 'Seed lots and distribution.',
    breadcrumbs: ['Seed Registry'],
  },
  'crop-master': {
    title: 'Crop Master',
    description: 'Crop and seed master catalogue.',
    breadcrumbs: ['Master Data', 'Crop Master'],
  },
  'location-master': {
    title: 'Location Master',
    description: 'Administrative location master catalogue.',
    breadcrumbs: ['Master Data', 'Location Master'],
  },
  'livestock-master': {
    title: 'Livestock Master',
    description: 'Livestock master catalogue.',
    breadcrumbs: ['Master Data', 'Livestock Master'],
  },
  'reports-analytics': {
    title: 'Reports & Analytics',
    description: 'National KPIs, exports, and scheduled reports for ATI leadership.',
    breadcrumbs: ['Reports & Analytics'],
  },
  'admin-settings': {
    title: 'Settings',
    description: 'Portal configuration, feature flags, and integration endpoints.',
    breadcrumbs: ['Settings'],
  },
};

const AdminDashboard = ({ userRole, onRoleChange, onLogout }) => {
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
        { type: 'Registration', heading: 'New registry entry', icon: <Users size={16} />, bg: 'green-bg' },
        { type: 'System', heading: 'System update completed', icon: <Server size={16} />, bg: 'blue-bg' },
        { type: 'Alert', heading: 'High-priority alert', icon: <Bell size={16} />, bg: 'red-bg' },
        { type: 'Data', heading: 'Regional data synced', icon: <Database size={16} />, bg: 'orange-bg' },
        { type: 'Security', heading: 'Access logs reviewed', icon: <Shield size={16} />, bg: 'purple-bg' },
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
                    text: `System log entry #${8200 + i}`,
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
        if (filter !== 'Custom Date') {
            setDataVersion(prev => prev + 1);
        }
    };

    const handleFromDateChange = (e) => setFromDate(e.target.value);
    const handleToDateChange = (e) => setToDate(e.target.value);
    const handleApplyCustomDate = () => {
        if (fromDate && toDate) setDataVersion(prev => prev + 1);
    };

    if (section === 'catalogs') {
        return <Navigate to="/dashboard/crop-master" replace />;
    }

    if (!ADMIN_SECTIONS.has(section)) {
        return <Navigate to="/dashboard/overview" replace />;
    }

    return (
        <div className={`dashboard-layout theme-${theme}`}>
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <Sprout size={24} color="#f59e0b" />
                        </div>
                        <div className="logo-text">
                            <h2>OpenAgriNet</h2>
                            <span className="logo-subtext">Ethiopia</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <SidebarNavLink to="/dashboard/overview" end icon={<Home size={20} />}>
                        Dashboard
                    </SidebarNavLink>
                    <AdminSidebar />
                    <div className="sidebar-divider"></div>
                    <SidebarNavLink to="/dashboard/reports-analytics" icon={<BarChart2 size={20} />}>
                        Reports & Analytics
                    </SidebarNavLink>
                    <SidebarNavLink to="/dashboard/admin-settings" icon={<Settings size={20} />}>
                        Settings
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
                            <h1>Admin Dashboard</h1>
                            <p>Managing the <span className="highlight-text">Ethiopia OpenAgriNet</span> — National Agricultural Data Platform</p>
                        </div>
                        <div className="page-header-right">
                            <div className="page-header-actions">
                                <div className="compact-date-wrapper">
                                    <div className="compact-date-label">Select Date</div>
                                    <div className="compact-date-select-container">
                                        <Calendar size={18} className="compact-icon text-gray" />
                                        <select
                                            value={dateFilter}
                                            onChange={handleDateFilterSelect}
                                            className="compact-date-select"
                                        >
                                            <option value="Today">Today</option>
                                            <option value="Yesterday">Yesterday</option>
                                            <option value="This Week">This Week</option>
                                            <option value="This Month">This Month</option>
                                            <option value="Custom Date">Custom Date</option>
                                        </select>
                                    </div>
                                    {showCustomDatePicker && (
                                        <div className="compact-custom-date-popup">
                                            <div className="date-range-inputs">
                                                <div className="date-input-group">
                                                    <label className="date-input-label">From Date</label>
                                                    <input
                                                        type="date"
                                                        value={fromDate}
                                                        onChange={handleFromDateChange}
                                                        className="custom-date-input"
                                                    />
                                                </div>
                                                <div className="date-input-group">
                                                    <label className="date-input-label">To Date</label>
                                                    <input
                                                        type="date"
                                                        value={toDate}
                                                        onChange={handleToDateChange}
                                                        className="custom-date-input"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                className="apply-custom-date-btn"
                                                onClick={handleApplyCustomDate}
                                                disabled={!fromDate || !toDate}
                                            >
                                                Go
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="download-action-wrapper">
                                    <button
                                        className="download-action-btn"
                                        onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                                    >
                                        <Download size={18} />
                                        <span>Download</span>
                                        <ChevronDown size={16} />
                                    </button>
                                    {showDownloadOptions && (
                                        <div className="download-options-dropdown">
                                            <button className="download-option" onClick={() => setShowDownloadOptions(false)}>
                                                <FileText size={16} />
                                                <span>Export CSV</span>
                                            </button>
                                            <button className="download-option" onClick={() => setShowDownloadOptions(false)}>
                                                <FileText size={16} />
                                                <span>Export PDF</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="stats-grid">
                        <AdminStats dateFilter={dateFilter} dataVersion={dataVersion} />
                    </div>

                    <div className="dashboard-bottom">
                        <div className="recent-activities card">
                            <div className="card-header-main">
                                <h3 className="card-title">Recent Activities</h3>
                            </div>
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
                            <div className="card-header-main">
                                <h3 className="card-title">Registry Completion Status</h3>
                            </div>
                            <div className="progress-list">
                                <div className="progress-item">
                                    <div className="progress-header">
                                        <span className="progress-label">Farmer Registry</span>
                                        <span className="progress-percentage">87%</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar fill-green" style={{ width: '87%' }}></div>
                                    </div>
                                </div>
                                <div className="progress-item">
                                    <div className="progress-header">
                                        <span className="progress-label">Land Registry</span>
                                        <span className="progress-percentage">72%</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar fill-yellow" style={{ width: '72%' }}></div>
                                    </div>
                                </div>
                                <div className="progress-item">
                                    <div className="progress-header">
                                        <span className="progress-label">Livestock Registry</span>
                                        <span className="progress-percentage">65%</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar fill-red" style={{ width: '65%' }}></div>
                                    </div>
                                </div>
                                <div className="progress-item">
                                    <div className="progress-header">
                                        <span className="progress-label">Crop Registry</span>
                                        <span className="progress-percentage">91%</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar fill-orange" style={{ width: '91%' }}></div>
                                    </div>
                                </div>
                                <div className="progress-item">
                                    <div className="progress-header">
                                        <span className="progress-label">Soil Registry</span>
                                        <span className="progress-percentage">45%</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar fill-brown" style={{ width: '45%' }}></div>
                                    </div>
                                </div>
                                <div className="progress-item">
                                    <div className="progress-header">
                                        <span className="progress-label">Seed Registry</span>
                                        <span className="progress-percentage">58%</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar fill-green" style={{ width: '58%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ) : (
                <WorkflowRouter
                    portalRole="Admin"
                    section={section}
                    theme={theme}
                    fallback={
                        <SectionPlaceholder
                            title={ADMIN_PLACEHOLDER[section].title}
                            description={ADMIN_PLACEHOLDER[section].description}
                            breadcrumbs={ADMIN_PLACEHOLDER[section].breadcrumbs}
                        />
                    }
                />
                )}
            </main>

            <div className="floating-help">
                <HelpCircle size={24} />
            </div>
        </div>
    );
};

export default AdminDashboard;