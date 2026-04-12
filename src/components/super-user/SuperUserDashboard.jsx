import React, { useState, useEffect, useRef } from 'react';
import './SuperUserDashboard.css';
import '../common/ContentArea.css';
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
import PageHeader from '../common/PageHeader';

const SuperUserDashboard = ({ userRole, onRoleChange, onLogout }) => {
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
                    <div className="nav-item active"><Home size={20} /><span>Admin Control</span></div>
                    <SuperUserSidebar />
                    <div className="sidebar-divider"></div>
                    <div className="nav-item"><BarChart2 size={20} /><span>Global Insights</span></div>
                    <div className="nav-item"><Settings size={20} /><span>System Config</span></div>
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

                <div className="content-area">
                    <PageHeader 
                        title="Super User Terminal"
                        subtitle={<>Global oversight across the <span className="highlight-text">Ethiopian Agricultural Grid</span></>}
                        dateFilter={dateFilter}
                        onDateFilterChange={handleDateFilterSelect}
                        showCustomDatePicker={showCustomDatePicker}
                        setShowCustomDatePicker={setShowCustomDatePicker}
                        fromDate={fromDate}
                        toDate={toDate}
                        onFromDateChange={handleFromDateChange}
                        onToDateChange={handleToDateChange}
                        onApplyCustomDate={handleApplyCustomDate}
                        showDownloadOptions={showDownloadOptions}
                        setShowDownloadOptions={setShowDownloadOptions}
                        onExportCSV={() => console.log('Export CSV')}
                        onExportPDF={() => console.log('Export PDF')}
                        customDateLabel="Audit Range"
                    />

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
            </main>
        </div>
    );
};

export default SuperUserDashboard;