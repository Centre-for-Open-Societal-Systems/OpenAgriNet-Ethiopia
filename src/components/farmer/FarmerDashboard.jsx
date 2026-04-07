import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import './FarmerDashboard.css';
import '../common/ContentArea.css';
import {
    Home, Users, User, MapPin, Bird, Sprout, Mountain, Shield, Download,
    Database, BarChart2, Settings, ChevronDown, Bell, Globe, HelpCircle, Info, Menu,
    TrendingUp, TrendingDown, Calendar, LogOut, Briefcase, Activity, Server, FileText, CloudRain, Sun, Moon, Languages, UserCircle, Landmark, Building2, LayoutDashboard, FileSpreadsheet, Beef, Wheat, X, History, ClipboardCheck, UserPlus, Search, Eye, Printer, Check
} from 'lucide-react';

// Farmer-specific components
import FarmerSidebar from './FarmerSidebar';
import FarmerStats from './FarmerStats';
import ATILogo from '../ATILogo';
import TopHeader from '../common/TopHeader';
import PageHeader from '../common/PageHeader';

const FarmerDashboard = ({ userRole, onRoleChange, onLogout }) => {
    const [theme, setTheme] = useState('light');
    const [language, setLanguage] = useState('en');
    const [dateFilter, setDateFilter] = useState('Today');
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [toDate, setToDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [dataVersion, setDataVersion] = useState(0);
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);
    const [activityPage, setActivityPage] = useState(1);
    const [registryFilter, setRegistryFilter] = useState('All');
    const [showRegistryDropdown, setShowRegistryDropdown] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [exportMessage, setExportMessage] = useState(null);
    const activitiesPerPage = 5;

    const datePickerRef = useRef(null);
    const downloadMenuRef = useRef(null);
    const registryDropdownRef = useRef(null);
    const helpWindowRef = useRef(null);

    // Get today's date in YYYY-MM-DD format for max date restriction
    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getThirtyDaysAgoDate = () => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayDate = getTodayDate();

    // Click outside handler for custom date picker and role switcher
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setShowCustomDatePicker(false);
            }
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
                setShowDownloadOptions(false);
            }
            if (registryDropdownRef.current && !registryDropdownRef.current.contains(event.target)) {
                setShowRegistryDropdown(false);
            }
            if (helpWindowRef.current && !helpWindowRef.current.contains(event.target)) {
                setIsHelpOpen(false);
            }
            if (registryDropdownRef.current && !registryDropdownRef.current.contains(event.target)) {
                setShowRegistryDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Real-time data simulation removed per user request for stationary UI.

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    const handleDateFilterSelect = (e) => {
        const filter = e.target.value;
        setDateFilter(filter);
        if (filter === 'Custom Date') {
            setShowCustomDatePicker(true);
            e.target.blur(); // Blur immediately so clicking the select again fires onFocus or click properly
        } else {
            setShowCustomDatePicker(false);
        }
        // Trigger data update for predefined filters
        if (filter !== 'Custom Date') {
            setDataVersion(prev => prev + 1);
        }
        setActivityPage(1); // Reset pagination on filter change
    };

    const handleFromDateChange = (e) => {
        const selectedDate = e.target.value;
        // Prevent selecting future dates
        if (selectedDate > todayDate) {
            setFromDate(todayDate);
            // If fromDate is set to today, ensure toDate is not before it
            if (toDate && todayDate > toDate) {
                setToDate(todayDate);
            }
        } else {
            setFromDate(selectedDate);
            // If fromDate is after toDate, adjust toDate to match fromDate
            if (toDate && selectedDate > toDate) {
                setToDate(selectedDate);
            }
        }
    };

    const handleToDateChange = (e) => {
        const selectedDate = e.target.value;
        // Prevent selecting future dates
        if (selectedDate > todayDate) {
            setToDate(todayDate);
        } else if (fromDate && selectedDate < fromDate) {
            // If toDate is before fromDate, set it equal to fromDate
            setToDate(fromDate);
        } else {
            setToDate(selectedDate);
        }
    };

    const handleApplyCustomDate = () => {
        if (fromDate && toDate) {
            setDataVersion(prev => prev + 1);
        }
    };

    const getRegistryPercentages = () => {
        const base = { farmer: 87, land: 72, livestock: 65, crop: 91, soil: 45, seed: 58 };
        if (dateFilter === 'Today' && dataVersion === 0) return base;

        const delta = Math.sin(dataVersion) * 5;
        return {
            farmer: Math.min(100, Math.max(0, Math.round(base.farmer + delta))),
            land: Math.min(100, Math.max(0, Math.round(base.land - delta))),
            livestock: Math.min(100, Math.max(0, Math.round(base.livestock + delta * 0.5))),
            crop: Math.min(100, Math.max(0, Math.round(base.crop + delta * 0.8))),
            soil: Math.min(100, Math.max(0, Math.round(base.soil - delta * 1.2))),
            seed: Math.min(100, Math.max(0, Math.round(base.seed + delta * 1.5)))
        };
    };

    const getRecentActivities = () => {
        // Helper function to format time with date
        const formatTimeWithDate = (timeStr, filter) => {
            if (timeStr.includes('Today') || timeStr.includes('Yesterday') || timeStr.includes('days ago') ||
                timeStr.includes('Last week') || /[A-Z][a-z]{2} \d{1,2}/.test(timeStr)) {
                return timeStr; // Already has date
            }

            // If it's just time like "14:32", add date based on filter
            if (filter === 'Today') {
                return `Today, ${timeStr}`;
            } else if (filter === 'Yesterday') {
                return `Yesterday, ${timeStr}`;
            } else if (filter === 'This Week') {
                return `This week, ${timeStr}`;
            } else {
                // For other filters or no filter, use a generic date
                const today = new Date();
                const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return `${dateStr}, ${timeStr}`;
            }
        };

        const getDisplayTime = (ts, formatType) => {
            const d = new Date(ts);
            const hour = d.getHours().toString().padStart(2, '0');
            const min = d.getMinutes().toString().padStart(2, '0');
            if (formatType === 'today') return `Today, ${hour}:${min}`;
            if (formatType === 'yesterday') return `Yesterday, ${hour}:${min}`;
            return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${hour}:${min}`;
        }

        const today1Ts = new Date().setHours(9, 12, 0, 0);
        const today2Ts = new Date().setHours(8, 8, 0, 0);
        const yest1Ts = new Date(Date.now() - 86400000).setHours(16, 45, 0, 0);
        const yest2Ts = new Date(Date.now() - 86400000).setHours(9, 20, 0, 0);
        const monthTs = new Date(Date.now() - 15 * 86400000).setHours(10, 15, 0, 0);

        // Base activities with specific text and proper date-time format
        const baseActivities = [
            {
                id: 1,
                type: 'registration',
                heading: 'New farmer registration',
                text: <><strong>Abebe Kebede (OAN-FR-1042)</strong> — Oromia, Bishoftu. Pending verification.</>,
                time: getDisplayTime(today1Ts, 'today'),
                icon: <Users size={20} className="green-text" />,
                bg: 'green-bg',
                timestamp: today1Ts,
                dateCategory: 'today'
            },
            {
                id: 2,
                type: 'livestock',
                heading: 'Livestock batch registered',
                text: <>12 cattle tagged in <strong>Debre Birhan</strong> woreda (Amhara).</>,
                time: getDisplayTime(today2Ts, 'today'),
                icon: <Beef size={20} className="yellow-text" />,
                bg: 'yellow-bg',
                timestamp: today2Ts,
                dateCategory: 'today'
            },
            {
                id: 3,
                type: 'crop',
                heading: 'Crop production record submitted',
                text: <><strong>Teff</strong> — Plot PL-0892, 2024 Meher, 0.75 ha. Harvested.</>,
                time: getDisplayTime(yest1Ts, 'yesterday'),
                icon: <Wheat size={20} className="orange-text" />,
                bg: 'orange-bg',
                timestamp: yest1Ts,
                dateCategory: 'yesterday'
            },
            {
                id: 4,
                type: 'loan',
                heading: 'Loan application AFP-2024-018 approved',
                text: <><strong>Tigist Hailu</strong>, Abay Bank, 75,000 ETB.</>,
                time: getDisplayTime(yest2Ts, 'yesterday'),
                icon: <Landmark size={20} className="red-text" />,
                bg: 'red-bg',
                timestamp: yest2Ts,
                dateCategory: 'yesterday'
            },
            {
                id: 5,
                type: 'sync',
                heading: 'Data sync completed',
                text: <>ePhyto (plant health), EIAR (soil samples). 234 records updated.</>,
                time: getDisplayTime(monthTs, 'month'),
                icon: <Database size={20} className="green-text" />,
                bg: 'green-bg',
                timestamp: monthTs, // Spread across the month
                dateCategory: 'older'
            },
        ];


        // Start with base activities
        const allActivities = [...baseActivities];

        // Generate 100 activities total
        const activityTypesExtended = [
            { type: 'registration', heading: 'New farmer registration', icon: <Users size={20} className="green-text" />, bg: 'green-bg' },
            { type: 'livestock', heading: 'Livestock registered', icon: <Beef size={20} className="yellow-text" />, bg: 'yellow-bg' },
            { type: 'crop', heading: 'Crop record', icon: <Wheat size={20} className="orange-text" />, bg: 'orange-bg' },
            { type: 'loan', heading: 'Loan approved', icon: <Landmark size={20} className="red-text" />, bg: 'red-bg' },
            { type: 'sync', heading: 'Data sync', icon: <Database size={20} className="green-text" />, bg: 'green-bg' },
            { type: 'soil', heading: 'Soil test', icon: <Activity size={20} className="blue-text" />, bg: 'blue-bg' },
            { type: 'seed', heading: 'Seed distribution', icon: <Sprout size={20} className="purple-text" />, bg: 'purple-bg' },
            { type: 'training', heading: 'Farmer training', icon: <FileText size={20} className="yellow-text" />, bg: 'yellow-bg' }
        ];

        const locations = ['Oromia', 'Amhara', 'Tigray', 'SNNPR', 'Somali', 'Afar', 'Benishangul'];
        const namesList = ['Kebede', 'Hailu', 'Tesfaye', 'Mulu', 'Abebe', 'Tigist', 'Selam', 'Yohannes'];

        for (let i = 6; i <= 100; i++) {
            const type = activityTypesExtended[i % activityTypesExtended.length];
            const location = locations[i % locations.length];
            const name = namesList[i % namesList.length];

            const amount = 50000 + (i * 250);

            let text;
            if (type.type === 'registration') {
                text = <><strong>{name} {namesList[(i + 1) % namesList.length]}</strong> — {location}</>;
            } else if (type.type === 'loan') {
                text = <><strong>AFP-2024-{String(i).padStart(3, '0')}</strong> — {amount.toLocaleString()} ETB</>;
            } else if (type.type === 'livestock') {
                const count = 5 + (i % 15);
                text = <>{count} animals in <strong>{location}</strong></>;
            } else {
                text = <>{100 + (i * 3)} records in <strong>{location}</strong></>;
            }

            let timestamp = new Date();
            let timeDisplay;
            let dateCategory;

            if (i <= 15) { // Today
                dateCategory = 'today';
                const hour = 8 - (i % 6);
                const minute = (i * 7) % 60;
                timestamp.setHours(hour, minute, 0);
                timeDisplay = `Today, ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            } else if (i <= 35) { // Yesterday
                dateCategory = 'yesterday';
                const hour = 15 - (i % 8);
                const minute = (i * 11) % 60;
                timestamp.setDate(timestamp.getDate() - 1);
                timestamp.setHours(hour, minute, 0);
                timeDisplay = `Yesterday, ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            } else if (i <= 60) { // This Week (Excluding Today/Yesterday)
                dateCategory = 'thisWeek';
                const daysAgo = 2 + (i % 5);
                const hour = 10 + (i % 7);
                const minute = (i * 13) % 60;
                timestamp.setDate(timestamp.getDate() - daysAgo);
                timestamp.setHours(hour, minute, 0);
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const dayName = dayNames[timestamp.getDay()];
                timeDisplay = `${dayName}, ${timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            } else { // This Month / Older (Including day names for clarity)
                dateCategory = 'older';
                const daysAgo = 8 + (i % 50);
                const hour = 8 + (i % 9);
                const minute = (i * 17) % 60;
                timestamp.setDate(timestamp.getDate() - daysAgo);
                timestamp.setHours(hour, minute, 0);
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const dayName = dayNames[timestamp.getDay()];
                timeDisplay = `${dayName}, ${timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            }

            allActivities.push({
                id: i,
                type: type.type,
                heading: type.heading,
                text: text,
                time: timeDisplay,
                icon: type.icon,
                bg: type.bg,
                timestamp: timestamp.getTime(),
                dateCategory: dateCategory
            });
        }

        const activities = allActivities.map(a => ({ ...a })).sort((a, b) => b.timestamp - a.timestamp);
        const currentMs = Date.now();

        // Determine result based on filter (Pure Filtering)
        switch (dateFilter) {
            case 'Today':
                return activities.filter(a => a.dateCategory === 'today')
                    .map(a => {
                        // time is stored as "Today, HH:MM" — split for dual-line display
                        const timePart = a.time.replace('Today, ', '');
                        return {
                            ...a,
                            time: timePart,     // HH:MM shown on top
                            dayNameLabel: 'Today' // shown below
                        };
                    });
            case 'Yesterday':
                return activities.filter(a => a.dateCategory === 'yesterday')
                    .map(a => {
                        // time is stored as "Yesterday, HH:MM" — split it for dual-line display
                        const timePart = a.time.replace('Yesterday, ', '');
                        return {
                            ...a,
                            time: timePart,        // HH:MM shown on top
                            dayNameLabel: 'Yesterday' // shown below
                        };
                    });
            case 'This Week':
                return activities.filter(a => a.dateCategory === 'thisWeek')
                    .map(a => {
                        const d = new Date(a.timestamp);
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const dayName = dayNames[d.getDay()];
                        const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                        return {
                            ...a,
                            dateCategory: 'thisWeek',
                            time: dateStr,
                            dayNameLabel: dayName
                        };
                    });
            case 'This Month':
                // Including older data as "This Month"
                return activities.filter(a => a.dateCategory === 'older')
                    .map(a => {
                        const d = new Date(a.timestamp);
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const dayName = dayNames[d.getDay()];
                        const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                        return {
                            ...a,
                            dateCategory: 'older',
                            time: dateStr,
                            dayNameLabel: dayName
                        };
                    });
            case 'Custom Date':
                if (fromDate && toDate) {
                    const fromTs = new Date(fromDate).setHours(0, 0, 0, 0);
                    const toTs = new Date(toDate).setHours(23, 59, 59, 999);
                    return activities.filter(a => a.timestamp >= fromTs && a.timestamp <= toTs)
                        .map(a => {
                            const d = new Date(a.timestamp);
                            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                            const dayName = dayNames[d.getDay()];
                            const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                            return {
                                ...a,
                                dateCategory: 'custom',
                                time: dateStr,
                                dayNameLabel: dayName
                            };
                        });
                }
                return [];
            default:
                return activities;
        }
    };

    // Calculate end/start date strings dynamically
    const getStatusDateText = () => {
        if (dateFilter === 'Today') return 'Status as of Today';
        if (dateFilter === 'Yesterday') return 'Status as of Yesterday';

        const today = new Date();

        if (dateFilter === 'This Week') {
            const startOfWeek = new Date(today.getTime() - 7 * 86400000);
            return `Status as of ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        }
        if (dateFilter === 'This Month') {
            const startOfMonth = new Date(today.getTime() - 30 * 86400000);
            return `Status as of ${startOfMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        }
        if (dateFilter === 'This Quarter') {
            const startOfQuarter = new Date(today.getTime() - 90 * 86400000);
            return `Status as of ${startOfQuarter.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        }
        if (dateFilter === 'Custom Date' && fromDate && toDate) {
            const fromD = new Date(fromDate);
            const toD = new Date(toDate);
            return `Status as of ${fromD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${toD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        }

        return `Status as of ${dateFilter}`;
    };

    const getRecentActivitiesGrowth = () => {
        switch (dateFilter) {
            case 'Today': return { value: '+9.5%', isPositive: true };
            case 'Yesterday': return { value: '+7.2%', isPositive: true };
            case 'This Week': return { value: '+12.5%', isPositive: true };
            case 'This Month': return { value: '+24.5%', isPositive: true };
            case 'This Quarter': return { value: '+45.2%', isPositive: true };
            default: return { value: '+1.5%', isPositive: true };
        }
    };

    const recentActivityGrowth = getRecentActivitiesGrowth();
    const regStatus = getRegistryPercentages();
    const rawActivities = getRecentActivities();
    const activeRecentActivities = rawActivities;


    // Pagination logic
    const totalPages = Math.ceil(activeRecentActivities.length / activitiesPerPage);
    const paginatedActivities = activeRecentActivities.slice(
        (activityPage - 1) * activitiesPerPage,
        activityPage * activitiesPerPage
    );

    // Calculate which page numbers to show (max 10)
    const getVisiblePages = () => {
        let startPage = Math.max(1, activityPage - 4);
        let endPage = startPage + 4;
        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - 4);
        }
        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleExportCSV = () => {
        setExportMessage({ type: 'info', text: 'Preparing CSV export...' });

        setTimeout(() => {
            try {
                const activities = getRecentActivities();
                const headers = ["Time", "Activity", "Category", "Details"];
                const csvData = activities.map(a => {
                    // Stripping React components from text
                    const plainText = a.text?.props?.children ?
                        a.text.props.children.map(child => typeof child === 'string' ? child : child.props?.children || '').join('') :
                        String(a.text);

                    return [
                        `"${a.time}"`,
                        `"${a.heading}"`,
                        `"${a.type}"`,
                        `"${plainText.replace(/"/g, '""')}"`
                    ].join(",");
                });

                const csvContent = [headers.join(","), ...csvData].join("\n");
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);

                link.setAttribute("href", url);
                link.setAttribute("download", `OAN_Farmer_Report_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setExportMessage({ type: 'success', text: 'CSV Exported Successfully!' });
                setShowDownloadOptions(false);
                setTimeout(() => setExportMessage(null), 3000);
            } catch (err) {
                console.error(err);
                setExportMessage({ type: 'error', text: 'CSV Export Failed' });
                setTimeout(() => setExportMessage(null), 3000);
            }
        }, 800);
    };

    const handleExportPDF = () => {
        setExportMessage({ type: 'info', text: 'Generating PDF document...' });

        setTimeout(() => {
            setExportMessage({ type: 'success', text: 'PDF Generated and downloaded!' });
            setShowDownloadOptions(false);
            setTimeout(() => setExportMessage(null), 3000);
        }, 1500);
    };

    return (
        <div className={`dashboard-layout theme-${theme} ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            {/* Export Notification */}
            {exportMessage && (
                <div className={`export-toast ${exportMessage.type}`}>
                    <div className="toast-icon">
                        {exportMessage.type === 'info' ? <Activity size={18} /> :
                            exportMessage.type === 'success' ? <Check size={18} /> : <X size={18} />}
                    </div>
                    <span>{exportMessage.text}</span>
                </div>
            )}
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && <div className="sidebar-backdrop" onClick={toggleSidebar}></div>}

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        {/* <div className="logo-icon">
                            <Sprout size={24} color="#f59e0b" />
                        </div>
                        <div className="logo-text">
                            <h2>OAN</h2>
                        </div> */}

                        <div className="logo-icon"><Sprout size={24} color="#f59e0b" /></div>
                        <div className="logo-text"><h2>OpenAgriNet</h2><span className="logo-subtext">Ethiopia</span></div>

                    </div>
                    {/* Embedded Toggler inside the sidebar matching the design screenshot */}
                    <button className="sidebar-embedded-toggler" onClick={toggleSidebar}>
                        <Menu size={20} color="white" />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Home size={20} />
                        <span>Dashboard</span>
                    </NavLink>

                    <FarmerSidebar />


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
                    toggleSidebar={toggleSidebar}
                />

                {/* Content Area */}
                <div className="content-area">
                    <PageHeader
                        title="Farmer Dashboard"
                        subtitle={<>Welcome to <span className="highlight-text">Ethiopia OpenAgriNet</span> — National Agricultural Data Platform</>}
                        dateFilter={dateFilter}
                        onDateFilterChange={handleDateFilterSelect}
                        showCustomDatePicker={showCustomDatePicker}
                        setShowCustomDatePicker={setShowCustomDatePicker}
                        datePickerRef={datePickerRef}
                        fromDate={fromDate}
                        toDate={toDate}
                        onFromDateChange={handleFromDateChange}
                        onToDateChange={handleToDateChange}
                        onApplyCustomDate={handleApplyCustomDate}
                        todayDate={todayDate}
                        showDownloadOptions={showDownloadOptions}
                        setShowDownloadOptions={setShowDownloadOptions}
                        downloadMenuRef={downloadMenuRef}
                        onExportCSV={handleExportCSV}
                        onExportPDF={handleExportPDF}
                    />

                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <FarmerStats
                            dateFilter={dateFilter}
                            dataVersion={dataVersion}
                            fromDate={fromDate}
                            toDate={toDate}
                        />
                    </div>

                    <div className="dashboard-bottom">
                        <div className="recent-activities card" style={{ minHeight: '440px' }}>
                            <div className="card-header-main">
                                <h3 className="card-title">
                                    <History size={18} /> Recent Activities
                                </h3>
                                <div className={`activity-status-pill ${recentActivityGrowth.isPositive ? 'growth-positive' : 'growth-negative'}`}>
                                    {recentActivityGrowth.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    <span>{getStatusDateText()} ({recentActivityGrowth.value})</span>
                                </div>
                            </div>

                            {paginatedActivities.length === 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#9ca3af', minHeight: '200px' }}>
                                    <div className="empty-state-icon" style={{ marginBottom: '16px', backgroundColor: 'rgba(0,0,0,0.02)', padding: '24px', borderRadius: '50%' }}>
                                        <Activity size={32} color="#d1d5db" />
                                    </div>
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>No activities found for this period.</span>
                                </div>
                            ) : (
                                <div className="activities-list" style={{ flex: 1, paddingTop: (dateFilter !== 'All Time') ? '0' : 'inherit' }}>
                                    {paginatedActivities.map((activity, index) => {
                                        // Show headers only if the filter is "All Time" OR we transition to a non-matching group
                                        // But the user specifically wants to remove Today's heading and border when in Today selection.
                                        const showHeader = (dateFilter === 'All Time') &&
                                            (index === 0 || paginatedActivities[index - 1].dateCategory !== activity.dateCategory);

                                        let headerLabel;
                                        const dateObj = new Date(activity.timestamp);

                                        if (activity.dateCategory === 'custom') {
                                            headerLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
                                        } else if (activity.dateCategory === 'today') {
                                            headerLabel = 'TODAY';
                                        } else if (activity.dateCategory === 'yesterday') {
                                            headerLabel = 'YESTERDAY';
                                        } else if (activity.dateCategory === 'thisWeek') {
                                            headerLabel = 'THIS WEEK';
                                        } else if (activity.dateCategory === 'older') {
                                            headerLabel = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
                                        } else {
                                            headerLabel = 'OLDER ACTIVITIES';
                                        }

                                        return (
                                            <React.Fragment key={activity.id}>
                                                {showHeader && (
                                                    <div className="activity-group-header">
                                                        {headerLabel}
                                                    </div>
                                                )}
                                                <div className="activity-item">
                                                    <div className={`activity-icon ${activity.bg}`} style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: '16px' }}>
                                                        {activity.icon}
                                                    </div>
                                                    <div className="activity-content">
                                                        <div className="activity-heading">{activity.heading}</div>
                                                        <div className="activity-running-text">{activity.text}</div>
                                                    </div>
                                                    <div className="activity-time-container" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                                                        <div className="activity-time">{activity.time}</div>
                                                        {activity.dayNameLabel && (
                                                            <div className="activity-day-label" style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                                                                {activity.dayNameLabel}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="activity-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderTop: '1px solid #f3f4f6', paddingTop: '20px', marginTop: '16px' }}>
                                    <div className="pagination-info" style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                                        Showing {(activityPage - 1) * activitiesPerPage + 1} to {Math.min(activityPage * activitiesPerPage, activeRecentActivities.length)} of {activeRecentActivities.length} updates
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setActivityPage(prev => Math.max(1, prev - 1))}
                                            disabled={activityPage === 1}
                                        >
                                            Prev
                                        </button>
                                        <div className="pagination-pages">
                                            {getVisiblePages().map(pageNum => (
                                                <button
                                                    key={pageNum}
                                                    className={`pagination-page ${activityPage === pageNum ? 'active' : ''}`}
                                                    onClick={() => setActivityPage(pageNum)}
                                                    style={activityPage === pageNum ? { backgroundColor: '#10b981', color: 'white', outline: 'none', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' } : { backgroundColor: 'transparent', color: '#4b5563', border: '1px solid #e5e7eb', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
                                                >
                                                    {pageNum}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            className="pagination-btn"
                                            onClick={() => setActivityPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={activityPage === totalPages}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="completion-status card" style={{ minHeight: '440px' }}>
                            <div className="card-header-main">
                                <h3 className="card-title"><ClipboardCheck size={18} /> Registry Completion Status</h3>
                                <div className="registry-dropdown-container" ref={registryDropdownRef}>
                                    <div className="compact-date-select-container" onClick={() => setShowRegistryDropdown(!showRegistryDropdown)} style={{ cursor: 'pointer', padding: '0 12px', gap: '8px', display: 'flex', alignItems: 'center', width: '220px' }}>
                                        <Activity size={18} className="text-gray" style={{ flexShrink: 0 }} />
                                        <div className="compact-date-select" style={{ padding: 0, width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                            {registryFilter === 'All' ? 'All' :
                                                registryFilter === 'High' ? <><span className="dot dot-green"></span> High</> :
                                                    registryFilter === 'Medium' ? <><span className="dot dot-yellow"></span> Medium</> :
                                                        <><span className="dot dot-red"></span> Low</>}
                                        </div>
                                        <ChevronDown
                                            size={16}
                                            className={`compact-date-chevron ${showRegistryDropdown ? 'rotated' : ''}`}
                                            style={{
                                                transition: 'transform 0.2s',
                                                transform: showRegistryDropdown ? 'rotate(180deg)' : 'none',
                                                color: 'var(--text-secondary)',
                                                flexShrink: 0,
                                                marginLeft: 'auto'
                                            }}
                                        />
                                    </div>

                                    {showRegistryDropdown && (
                                        <div className="role-dropdown" style={{ width: '100%', minWidth: '180px' }}>
                                            <div className="role-option" onClick={() => { setRegistryFilter('All'); setShowRegistryDropdown(false); }}>
                                                All
                                            </div>
                                            <div className="role-option" onClick={() => { setRegistryFilter('High'); setShowRegistryDropdown(false); }}>
                                                <span className="dot dot-green"></span> High (&gt;80%)
                                            </div>
                                            <div className="role-option" onClick={() => { setRegistryFilter('Medium'); setShowRegistryDropdown(false); }}>
                                                <span className="dot dot-yellow"></span> Medium (51-80%)
                                            </div>
                                            <div className="role-option" onClick={() => { setRegistryFilter('Low'); setShowRegistryDropdown(false); }}>
                                                <span className="dot dot-red"></span> Low (&lt;50%)
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {(() => {
                                const filteredStats = [
                                    { id: 'farmer', label: 'Farmers', val: regStatus.farmer },
                                    { id: 'land', label: 'Land', val: regStatus.land },
                                    { id: 'livestock', label: 'Livestock', val: regStatus.livestock },
                                    { id: 'crop', label: 'Crops', val: regStatus.crop },
                                    { id: 'soil', label: 'Soil', val: regStatus.soil },
                                    { id: 'seed', label: 'Seeds', val: regStatus.seed },
                                ].filter(s => {
                                    if (registryFilter === 'High') return s.val > 80;
                                    if (registryFilter === 'Medium') return s.val >= 51 && s.val <= 80;
                                    if (registryFilter === 'Low') return s.val < 50;
                                    return true;
                                });

                                if (filteredStats.length === 0) {
                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#9ca3af', minHeight: '200px' }}>
                                            <div className="empty-state-icon" style={{ marginBottom: '16px', backgroundColor: 'rgba(0,0,0,0.02)', padding: '24px', borderRadius: '50%' }}>
                                                <BarChart2 size={32} color="#d1d5db" />
                                            </div>
                                            <span style={{ fontSize: '14px', fontWeight: '500' }}>No registry data available for this filter.</span>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="progress-list" style={{ flex: 1 }}>
                                        {filteredStats.map(item => {
                                            const fillClass = item.val > 80 ? 'fill-green' : item.val >= 51 ? 'fill-yellow' : 'fill-red';
                                            return (
                                                <div className="progress-item" key={item.id}>
                                                    <div className="progress-header">
                                                        <span className="progress-label">{item.label}</span>
                                                        <span className="progress-percentage">{item.val}%</span>
                                                    </div>
                                                    <div className="progress-bar-bg">
                                                        <div className={`progress-bar ${fillClass}`} style={{ width: `${item.val}%` }}></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </main>

            <div className="help-widget-container" ref={helpWindowRef}>
                {isHelpOpen && (
                    <div className="help-popup-window">
                        <div className="help-popup-header">
                            <h4 className="help-popup-title">Platform Help & Support</h4>
                            <button className="help-close-btn" onClick={() => setIsHelpOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="help-popup-content">
                            <div className="help-section">
                                <h5 className="help-section-title">
                                    <UserPlus size={18} className="help-icon" /> Adding a New Farmer
                                </h5>
                                <p className="help-section-text">Click "Add New Farmer" and follow the 4-step registration wizard. All fields marked with * are required.</p>
                            </div>

                            <div className="help-section">
                                <h5 className="help-section-title">
                                    <Search size={18} className="help-icon" /> Searching & Filtering
                                </h5>
                                <p className="help-section-text">Use the search bar to find farmers by ID or name. Apply filters by Region, Woreda, and Status to narrow results.</p>
                            </div>

                            <div className="help-section">
                                <h5 className="help-section-title">
                                    <Eye size={18} className="help-icon" /> Viewing Farmer Details
                                </h5>
                                <p className="help-section-text">Click the action menu (⋮) on any farmer row and select "View" to see complete profile information.</p>
                            </div>

                            <div className="help-section">
                                <h5 className="help-section-title">
                                    <Printer size={18} className="help-icon" /> Printing ID Cards
                                </h5>
                                <p className="help-section-text">Navigate to the farmer's profile and click "Print ID" to generate a printable ID card.</p>
                            </div>
                        </div>
                        <div className="help-popup-footer">
                            For technical support, contact: support@openagrinet.et
                        </div>
                    </div>
                )}
                <div className={`floating-help ${isHelpOpen ? 'open' : ''}`} onClick={() => setIsHelpOpen(!isHelpOpen)}>
                    {isHelpOpen ? <X size={24} /> : <Info size={24} />}
                </div>
            </div>
        </div>
    );
};

export default FarmerDashboard;