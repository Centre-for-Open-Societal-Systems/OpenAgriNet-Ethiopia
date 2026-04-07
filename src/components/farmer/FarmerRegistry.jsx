import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import './FarmerDashboard.css';
import '../common/ContentArea.css';
import './FarmerRegistry.css';
import {
    Home, Users, User, MapPin, Bird, Sprout, Mountain, Shield, Download,
    Database, BarChart2, Settings, ChevronDown, Bell, Globe, HelpCircle, Info, Menu,
    TrendingUp, TrendingDown, Calendar, LogOut, Briefcase, Activity, Server, FileText, CloudRain, Sun, Moon, Languages, UserCircle, Landmark, Building2, LayoutDashboard, FileSpreadsheet, Beef, Wheat, X, History, ClipboardCheck, UserPlus, Search, Eye, Printer, Check, Edit, Trash2, Plus, CheckCircle, Clock, AlertCircle, Map, ShieldCheck, Timer, MoreVertical, Phone, Mail, ArrowUpDown, XCircle, Filter
} from 'lucide-react';

// Farmer-specific components
import FarmerSidebar from './FarmerSidebar';
import { StatCard } from './FarmerStats';
import ATILogo from '../ATILogo';
import TopHeader from '../common/TopHeader';
import PageHeader from '../common/PageHeader';
import FarmerRegistrationForm from './FarmerRegistrationForm';

const FarmerRegistry = ({ userRole, onRoleChange, onLogout }) => {
    const [theme, setTheme] = useState('light');
    const [language, setLanguage] = useState('en');
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [openActionMenuId, setOpenActionMenuId] = useState(null);
    const [selectedFarmers, setSelectedFarmers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'registeredDate', direction: 'desc' });
    const [searchTerm, setSearchTerm] = useState('');
    const [itemsPerPage] = useState(10);
    const [selectedStatuses, setSelectedStatuses] = useState(['Verified', 'Pending', 'Rejected']);
    const [selectedRegions, setSelectedRegions] = useState(['All Regions']);
    const [selectedKisanStatuses, setSelectedKisanStatuses] = useState(['Active', 'Inactive']);
    const [selectedCrops, setSelectedCrops] = useState(['All Crops']);
    const [regionFilterOpen, setRegionFilterOpen] = useState(false);
    const [agriFilterOpen, setAgriFilterOpen] = useState(false);
    const [statusFilterOpen, setStatusFilterOpen] = useState(false);
    const [kisanFilterOpen, setKisanFilterOpen] = useState(false);
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);
    const [exportMessage, setExportMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('list');

    const regions = ['Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa', 'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali', 'Southern Nations, Nationalities, and Peoples\' Region', 'Tigray'];
    const crops = ['Wheat', 'Sugarcane', 'Rice', 'Maize', 'Vegetables', 'Mustard', 'Bajra', 'Cotton', 'Coconut', 'Groundnut'];

    const regionFilterRef = useRef(null);
    const agriFilterRef = useRef(null);
    const statusFilterRef = useRef(null);
    const kisanFilterRef = useRef(null);
    const helpWindowRef = useRef(null);
    const downloadMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (helpWindowRef.current && !helpWindowRef.current.contains(event.target)) setIsHelpOpen(false);
            if (regionFilterRef.current && !regionFilterRef.current.contains(event.target)) setRegionFilterOpen(false);
            if (agriFilterRef.current && !agriFilterRef.current.contains(event.target)) setAgriFilterOpen(false);
            if (statusFilterRef.current && !statusFilterRef.current.contains(event.target)) setStatusFilterOpen(false);
            if (kisanFilterRef.current && !kisanFilterRef.current.contains(event.target)) setKisanFilterOpen(false);
            if (!event.target.closest('.actions-col')) setOpenActionMenuId(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const generateFarmers = () => {
        const maleNames = ['Abebe', 'Bekele', 'Tadesse', 'Tesfaye', 'Girma', 'Hailu', 'Kassahun', 'Lema', 'Mulugeta', 'Sintayehu', 'Yidnekachew', 'Belay', 'Fikadu', 'Getachew', 'Habtamu', 'Iskinder', 'Kebede', 'Nigussie'];
        const femaleNames = ['Meskerem', 'Birtukan', 'Hirut', 'Nigist', 'Zenebech', 'Aster', 'Chaltu', 'Dibaba', 'Elen', 'Jember', 'Lula', 'Marta'];
        const surnames = ['Bekele', 'Wolde', 'Tadesse', 'Abera', 'Hailu', 'Kassa', 'Mekonnen', 'Gizaw', 'Assefa', 'Demissie', 'Tsegaye', 'Desta', 'Kidus', 'Zerihun', 'Alemu', 'Gebre', 'Ayele', 'Zeleke', 'Mulu', 'Lemma'];
        const regionList = ['Addis Ababa', 'Oromia', 'Amhara', 'Tigray', 'Sidama', 'Somali'];
        const kebeleList = ['Kebele 01', 'Kebele 05', 'Kebele 07', 'Kebele 11 Chapter', 'Kebele 12', 'Kebele 20 Kebele', 'Kebele 25', 'Kebele 32'];
        const cropList = ['Wheat', 'Sugarcane', 'Rice', 'Maize', 'Vegetables', 'Mustard', 'Bajra', 'Cotton', 'Coconut', 'Groundnut'];
        const phonePrefixes = ['+251 91', '+251 92', '+251 93', '+251 94', '+251 95'];

        return Array.from({ length: 75 }, (_, i) => {
            const isMale = i % 2 === 0;
            const first = isMale ? maleNames[i % maleNames.length] : femaleNames[i % femaleNames.length];
            const last = surnames[i % surnames.length];
            const name = `${first} ${last}`;
            const gender = isMale ? 'Male' : 'Female';
            const status = i % 5 === 0 ? 'Pending' : (i % 7 === 0 ? 'Rejected' : 'Verified');
            const region = regionList[i % regionList.length];

            return {
                id: `OAN-FR-${(i + 1).toString().padStart(3, '0')}`,
                name: name,
                photo: `https://randomuser.me/api/portraits/${isMale ? 'men' : 'women'}/${i % 70}.jpg`,
                gender: gender,
                age: `${25 + (i % 40)} YRS`,
                phone: `${phonePrefixes[i % 5]} ${Math.floor(1000000 + Math.random() * 9000000)}`,
                email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@gmail.com`,
                kebele: kebeleList[i % kebeleList.length],
                woreda: `Woreda ${(i % 15) + 1}`,
                region: region,
                registeredDate: `2024-${(i % 3) + 1}-${(i % 28) + 1}`,
                acres: `${(Math.random() * 15).toFixed(1)} Acres`,
                crops: [cropList[i % cropList.length], cropList[(i + 1) % cropList.length]],
                status: status,
                kisanCard: i % 4 === 0 ? 'Inactive' : 'Active'
            };
        });
    };

    const [farmers] = useState(generateFarmers());

    const toggleStatusFilter = (status) => {
        if (selectedStatuses.includes(status)) {
            setSelectedStatuses(selectedStatuses.filter(s => s !== status));
        } else {
            setSelectedStatuses([...selectedStatuses, status]);
        }
    };

    const toggleRegionFilter = (region) => {
        if (region === 'All Regions') {
            setSelectedRegions(selectedRegions.includes('All Regions') ? [] : ['All Regions', ...regions]);
        } else {
            const newSelection = selectedRegions.includes(region)
                ? selectedRegions.filter(r => r !== region && r !== 'All Regions')
                : [...selectedRegions.filter(r => r !== 'All Regions'), region];
            setSelectedRegions(newSelection.length === regions.length ? ['All Regions', ...newSelection] : newSelection);
        }
    };

    const toggleKisanFilter = (status) => {
        setSelectedKisanStatuses(selectedKisanStatuses.includes(status) ? selectedKisanStatuses.filter(s => s !== status) : [...selectedKisanStatuses, status]);
    };

    const toggleCropFilter = (crop) => {
        if (crop === 'All Crops') {
            setSelectedCrops(selectedCrops.includes('All Crops') ? [] : ['All Crops', ...crops]);
        } else {
            const newSelection = selectedCrops.includes(crop)
                ? selectedCrops.filter(c => c !== crop && c !== 'All Crops')
                : [...selectedCrops.filter(c => c !== 'All Crops'), crop];
            setSelectedCrops(newSelection.length === crops.length ? ['All Crops', ...newSelection] : newSelection);
        }
    };

    const filteredFarmersList = farmers.filter(farmer => {
        const matchesSearch =
            farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            farmer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            farmer.kebele.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = selectedStatuses.includes(farmer.status);
        const matchesRegion = selectedRegions.includes('All Regions') || selectedRegions.includes(farmer.region);
        const matchesKisan = selectedKisanStatuses.includes(farmer.kisanCard);
        const matchesCrop = selectedCrops.includes('All Crops') || farmer.crops.some(c => selectedCrops.includes(c));
        return matchesSearch && matchesStatus && matchesRegion && matchesKisan && matchesCrop;
    });

    const sortedFarmers = [...filteredFarmersList].sort((a, b) => {
        const order = sortConfig.direction === 'asc' ? 1 : -1;
        if (sortConfig.key === 'name') return a.name.localeCompare(b.name) * order;
        if (sortConfig.key === 'id') return a.id.localeCompare(b.id) * order;
        if (sortConfig.key === 'registeredDate') return (new Date(a.registeredDate) - new Date(b.registeredDate)) * order;
        return 0;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentFarmers = sortedFarmers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedFarmers.length / itemsPerPage);

    const handleSelectAll = (e) => {
        setSelectedFarmers(e.target.checked ? currentFarmers.map(f => f.id) : []);
    };

    const handleSelectFarmer = (id) => {
        setSelectedFarmers(selectedFarmers.includes(id) ? selectedFarmers.filter(fid => fid !== id) : [...selectedFarmers, id]);
    };

    const requestSort = (key) => {
        setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    };

    const handleViewFarmer = (id) => console.log('View', id);

    const handleExportCSV = () => {
        setExportMessage({ type: 'info', text: 'Preparing CSV export...' });
        setTimeout(() => {
            try {
                const headers = ["Farmer ID", "Name", "Gender", "Age", "Phone", "Email", "Kebele", "Woreda", "Region", "Registered Date", "Acres", "Status"];
                const csvData = filteredFarmersList.map(f => [
                    `"${f.id}"`, `"${f.name}"`, `"${f.gender}"`, `"${f.age}"`, `"${f.phone}"`, `"${f.email}"`,
                    `"${f.kebele}"`, `"${f.woreda}"`, `"${f.region}"`, `"${f.registeredDate}"`, `"${f.acres}"`, `"${f.status}"`
                ].join(","));

                const csvContent = [headers.join(","), ...csvData].join("\n");
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `OAN_Farmer_Registry_${new Date().toISOString().split('T')[0]}.csv`);
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
            {exportMessage && (
                <div className={`export-toast ${exportMessage.type}`}>
                    <div className="toast-icon">
                        {exportMessage.type === 'info' ? <Activity size={18} /> :
                            exportMessage.type === 'success' ? <Check size={18} /> : <X size={18} />}
                    </div>
                    <span>{exportMessage.text}</span>
                </div>
            )}
            {isSidebarOpen && <div className="sidebar-backdrop" onClick={toggleSidebar}></div>}

            <aside className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon"><Sprout size={24} color="#f59e0b" /></div>
                        <div className="logo-text"><h2>OpenAgriNet</h2><span className="logo-subtext">Ethiopia</span></div>
                    </div>
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
                    <style>{`
                        .registry-tabs-v6-wrapper { padding: 4px 0; }
                        .registry-tabs-v6 { display: flex; background: #eaeff5; padding: 4px; border-radius: 40px; gap: 4px; box-shadow: inset 0 2px 5px rgba(0,0,0,0.08); height: 48px; align-items: center; }
                        .registry-tab-v6 { height: 40px; padding: 0 24px; border-radius: 40px; border: none; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); color: #475569; background: transparent; white-space: nowrap; display: flex; align-items: center; justify-content: center; }
                        .registry-tab-v6.active { background: #ffffff; color: #10b981; box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
                        .registry-tab-v6:hover:not(.active) { color: #1e293b; background: rgba(255,255,255,0.7); }
                        
                        .card-header-main-v6 { display: flex; justify-content: space-between; align-items: center; padding: 14px 0px 14px 16px; border-bottom: 1.5px solid #e2e8f0; gap: 16px; background: #ffffff; border-radius: 12px 12px 0 0; }
                        .card-title-v6 { font-size: 16px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 10px; margin: 0; white-space: nowrap; }
                        .registry-controls-v6 { display: flex; align-items: center; gap: 12px; flex: 1; justify-content: flex-end; }
                        
                        .card-download-wrapper-v6 { position: relative; }
                        .download-btn-card-v6 { display: flex; align-items: center; gap: 8px; height: 48px; padding: 0 16px; background: #ffffff; color: #10b981; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                        .download-btn-card-v6:hover { background: #f0fdf4; border-color: #10b981; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.1); }
                        .download-btn-card-v6 .rotated { transform: rotate(180deg); }
                        .download-btn-card-v6 svg { transition: transform 0.2s; }

                        .download-dropdown-card-v6 { position: absolute; top: calc(100% + 8px); right: 0; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 6px; min-width: 160px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); z-index: 1000; animation: fadeInTabs 0.2s ease-out; }
                        .download-item-card-v6 { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border: none; background: transparent; color: #475569; font-size: 14px; font-weight: 500; cursor: pointer; border-radius: 8px; transition: all 0.2s; }
                        .download-item-card-v6:hover { background: #f8fafc; color: #1e293b; }

                        .search-wrapper-v6 { position: relative; width: 100%; max-width: 450px; }
                        .search-icon-v6 { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
                        .search-input-v6 { width: 100%; height: 48px; padding: 0 16px 0 42px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; color: #1e293b; transition: all 0.2s; }
                        .search-input-v6:focus { outline: none; background-color: #fff; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
                        .add-farmer-btn-v6 { display: flex; align-items: center; gap: 8px; height: 48px; padding: 0 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2); }
                        .add-farmer-btn-v6:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }

                        .registry-list-table th, .registry-list-table td { padding: 14px 12px; text-align: left; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
                        .registry-list-table th:first-child, .registry-list-table td:first-child { padding-left: 16px; }
                        .registry-list-table th:last-child, .registry-list-table td:last-child { padding-right: 16px; }
                        .registry-footer-v5 { display: flex; justify-content: space-between; align-items: center; padding: 24px; background-color: white; border-top: 1px solid #f1f5f9; }
                        .footer-stats-v5 { font-size: 14px; color: #64748b; font-weight: 500; }
                        .highlight-v5 { color: #1e293b; font-weight: 700; }
                        .pagination-controls-v5 { display: flex; align-items: center; gap: 12px; }
                        .pagination-btn-v5 { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border: 1px solid #e2e8f0; background-color: white; color: #475569; font-size: 14px; font-weight: 600; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
                        .pagination-btn-v5:hover:not(:disabled) { background-color: #f8fafc; border-color: #cbd5e1; }
                        .pagination-btn-v5:disabled { opacity: 0.5; cursor: not-allowed; }
                        .pagination-pages-v5 { display: flex; align-items: center; gap: 6px; }
                        .page-num-v5 { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 1px solid transparent; border-radius: 8px; background: none; color: #64748b; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
                        .page-num-v5.active { background-color: #10b981; color: white; border-color: #10b981; }
                        .page-num-v5:hover:not(.active) { background-color: #f1f5f9; color: #334155; }
                        tr.selected-row td { background-color: #f0fdfa !important; }
                        .header-cell-checkbox, .td-cell-checkbox { display: flex; align-items: center; justify-content: center; }
                        .modern-checkbox-s { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border: 2px solid #cbd5e1; border-radius: 4px; background-color: #fff; cursor: pointer; position: relative; transition: all 0.2s; }
                        .modern-checkbox-s:checked { background-color: #10b981; border-color: #10b981; }
                        .modern-checkbox-s:checked::after { content: ''; position: absolute; left: 5px; top: 1px; width: 5px; height: 10px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }
                    `}</style>
                    <PageHeader
                        title="Farmer Registry"
                        subtitle={<>Manage and view <span className="highlight-text">Registered farmers</span> their land holdings, and scheme status.</>}
                        hideDateFilter={true}
                        hideDownload={true}
                        primaryAction={
                            <div className="registry-tabs-v6-wrapper">
                                <div className="registry-tabs-v6">
                                    <button
                                        className={`registry-tab-v6 ${activeTab === 'list' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('list')}
                                    >
                                        Farmer List
                                    </button>
                                    <button
                                        className={`registry-tab-v6 ${activeTab === 'new' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('new')}
                                    >
                                        New Registration
                                    </button>
                                </div>
                            </div>
                        }
                    />

                    {activeTab === 'list' && (
                        <>
                            <div className="stats-grid">
                                <StatCard icon={Users} colorClass="green" value="12,450" label="Total Farmers" subtext="+12% from last month" growth={{ formatted: '+12%', isPositive: true }} footerIcon={TrendingUp} />
                                <StatCard icon={ShieldCheck} colorClass="blue" value="11,200" label="Verified Accounts" subtext="90% of total" growth={{ formatted: '90%', isPositive: true }} footerIcon={CheckCircle} />
                                <StatCard icon={Clock} colorClass="orange" value="840" label="Pending Approvals" subtext="Action required" growth={{ formatted: '840', isNegative: true }} footerIcon={Clock} />
                                <StatCard icon={Wheat} colorClass="purple" value="45,210" label="Total Land (Acres)" subtext="Across 15 districts" growth={{ formatted: '45k', isPositive: true }} footerIcon={MapPin} />
                            </div>



                            <div className="registry-table-container">
                                <div className="recent-activities card width-card" style={{ minHeight: '440px' }}>
                                    <div className="card-header-main-v6">
                                        <h3 className="card-title-v6"><Users size={18} /> Farmer Registry List</h3>

                                        <div className="registry-controls-v6">
                                            <div className="search-wrapper-v6">
                                                <Search size={18} className="search-icon-v6" />
                                                <input
                                                    type="text"
                                                    className="search-input-v6"
                                                    placeholder="Search by Farmer ID, Name, Kebele..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>



                                            <button className="add-farmer-btn-v6">
                                                <Plus size={18} />
                                                <span>Add Farmer</span>
                                            </button>

                                            <div className="card-download-wrapper-v6" ref={downloadMenuRef}>
                                                <button
                                                    className="download-btn-card-v6"
                                                    onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                                                >
                                                    <Download size={18} />
                                                    <span>Download</span>
                                                    <ChevronDown size={14} className={showDownloadOptions ? 'rotated' : ''} />
                                                </button>

                                                {showDownloadOptions && (
                                                    <div className="download-dropdown-card-v6">
                                                        <button className="download-item-card-v6" onClick={handleExportCSV}>
                                                            <FileSpreadsheet size={16} color="#10b981" />
                                                            <span>Export CSV</span>
                                                        </button>
                                                        <button className="download-item-card-v6" onClick={handleExportPDF}>
                                                            <FileText size={16} color="#ef4444" />
                                                            <span>Export PDF</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="table-responsive" style={{ marginTop: '0px' }}>
                                        <table className="registry-table registry-list-table">
                                            <thead>
                                                <tr>
                                                    <th><div className="header-cell-checkbox"><input type="checkbox" className="modern-checkbox-s" onChange={handleSelectAll} checked={currentFarmers.length > 0 && selectedFarmers.length === currentFarmers.length} /></div></th>
                                                    <th onClick={() => requestSort('id')} className="sortable-col"><div className="header-cell-standard">Farmer ID</div></th>
                                                    <th><div className="header-cell-standard">Farmer Details</div></th>
                                                    <th><div className="header-cell-standard">Kebele</div></th>
                                                    <th><div className="header-cell-standard">Woreda</div></th>
                                                    <th>
                                                        <div className="header-cell-standard header-with-filtered-icon">
                                                            <span>Region</span>
                                                            <div className="status-filter-trigger-wrapper" ref={regionFilterRef}>
                                                                <button className="filter-trigger-icon-bt" onClick={(e) => { e.stopPropagation(); setRegionFilterOpen(!regionFilterOpen); }}><Filter size={13} /></button>
                                                                {regionFilterOpen && (
                                                                    <div className="status-filter-dropdown prestige-dropdown region-scroll-dropdown">
                                                                        <div className="filter-dropdown-title">Filter Region</div>
                                                                        <div className="filter-options-list">
                                                                            <label className="filter-option-item"><input type="checkbox" checked={selectedRegions.includes('All Regions')} onChange={() => toggleRegionFilter('All Regions')} /><span className="filter-status-text">All Regions</span></label>
                                                                            {regions.map(region => <label key={region} className="filter-option-item"><input type="checkbox" checked={selectedRegions.includes(region)} onChange={() => toggleRegionFilter(region)} /><span className="filter-status-text">{region}</span></label>)}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </th>
                                                    <th>
                                                        <div className="header-cell-standard header-with-filtered-icon">
                                                            <span>Agriculture Data</span>
                                                            <div className="status-filter-trigger-wrapper" ref={agriFilterRef}>
                                                                <button className="filter-trigger-icon-bt" onClick={(e) => { e.stopPropagation(); setAgriFilterOpen(!agriFilterOpen); }}><Filter size={13} /></button>
                                                                {agriFilterOpen && (
                                                                    <div className="status-filter-dropdown prestige-dropdown region-scroll-dropdown">
                                                                        <div className="filter-dropdown-title">Filter by Crop</div>
                                                                        <div className="filter-options-list">
                                                                            <label className="filter-option-item"><input type="checkbox" checked={selectedCrops.includes('All Crops')} onChange={() => toggleCropFilter('All Crops')} /><span className="filter-status-text">All Crops</span></label>
                                                                            {crops.map(crop => <label key={crop} className="filter-option-item"><input type="checkbox" checked={selectedCrops.includes(crop)} onChange={() => toggleCropFilter(crop)} /><span className="filter-status-text">{crop}</span></label>)}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </th>
                                                    <th>
                                                        <div className="header-cell-standard header-with-filtered-icon">
                                                            <span>Status</span>
                                                            <div className="status-filter-trigger-wrapper" ref={statusFilterRef}>
                                                                <button className="filter-trigger-icon-bt" onClick={(e) => { e.stopPropagation(); setStatusFilterOpen(!statusFilterOpen); }}><Filter size={13} /></button>
                                                                {statusFilterOpen && (
                                                                    <div className="status-filter-dropdown prestige-dropdown">
                                                                        <div className="filter-dropdown-title">Filter Status</div>
                                                                        <div className="filter-options-list">
                                                                            {['Verified', 'Pending', 'Rejected'].map(status => <label key={status} className="filter-option-item"><input type="checkbox" checked={selectedStatuses.includes(status)} onChange={() => toggleStatusFilter(status)} /><span className={`filter-status-text ${status.toLowerCase()}`}>{status}</span></label>)}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </th>
                                                    <th>
                                                        <div className="header-cell-standard header-with-filtered-icon">
                                                            <span>Kisan Card</span>
                                                            <div className="status-filter-trigger-wrapper" ref={kisanFilterRef}>
                                                                <button className="filter-trigger-icon-bt" onClick={(e) => { e.stopPropagation(); setKisanFilterOpen(!kisanFilterOpen); }}><Filter size={13} /></button>
                                                                {kisanFilterOpen && (
                                                                    <div className="status-filter-dropdown prestige-dropdown">
                                                                        <div className="filter-dropdown-title">Filter Kisan Card</div>
                                                                        <div className="filter-options-list">
                                                                            {['Active', 'Inactive'].map(status => <label key={status} className="filter-option-item"><input type="checkbox" checked={selectedKisanStatuses.includes(status)} onChange={() => toggleKisanFilter(status)} /><span className="filter-status-text">{status}</span></label>)}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </th>
                                                    <th className="actions-col">ACTIONS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentFarmers.length > 0 ? (
                                                    currentFarmers.map((farmer) => (
                                                        <tr key={farmer.id} className={selectedFarmers.includes(farmer.id) ? 'selected-row' : ''}>
                                                            <td><div className="td-cell-checkbox"><input type="checkbox" className="modern-checkbox-s" checked={selectedFarmers.includes(farmer.id)} onChange={() => handleSelectFarmer(farmer.id)} /></div></td>
                                                            <td className="id-col-featured">{farmer.id}</td>
                                                            <td>
                                                                <div className="farmer-details-vertical-stack">
                                                                    <img src={farmer.photo} alt={farmer.name} className="farmer-stack-avatar-top" />
                                                                    <div className="farmer-info-content-v2">
                                                                        <div className="farmer-main-name-top">{farmer.name}</div>
                                                                        <div className="farmer-meta-stack">
                                                                            <div className="farmer-meta-item"><User size={14} className="meta-icon-v3" /><span>{farmer.gender} - {farmer.age}</span></div>
                                                                            <div className="farmer-meta-item"><Calendar size={14} className="meta-icon-v3" /><span>{farmer.registeredDate}</span></div>
                                                                            <div className="farmer-meta-item"><Mail size={14} className="meta-icon-v3" /><span>{farmer.email}</span></div>
                                                                            <div className="farmer-meta-item"><Phone size={14} className="meta-icon-v3" /><span>{farmer.phone}</span></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>{farmer.kebele}</td>
                                                            <td>{farmer.woreda}</td>
                                                            <td>{farmer.region}</td>
                                                            <td><div className="agri-data-stack"><div className="acre-text">{farmer.acres}</div><div className="crop-tags">{farmer.crops.map((c, i) => <span key={i} className="crop-tag-v2">{c}</span>)}</div></div></td>
                                                            <td><div className={`status-pill-v4 ${farmer.status.toLowerCase()}`}>{farmer.status}</div></td>
                                                            <td><div className={`kisan-badge-v4 ${farmer.kisanCard.toLowerCase()}`}>{farmer.kisanCard}</div></td>
                                                            <td className="actions-col">
                                                                <button className="dots-trigger-v5" onClick={() => setOpenActionMenuId(openActionMenuId === farmer.id ? null : farmer.id)}><MoreVertical size={18} /></button>
                                                                {openActionMenuId === farmer.id && (
                                                                    <div className="action-popup-v5">
                                                                        <button className="action-item-v5" onClick={() => handleViewFarmer(farmer.id)}><Eye size={16} /> View</button>
                                                                        <button className="action-item-v5"><Edit size={16} /> Edit</button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="11">
                                                            <div className="empty-state-container">
                                                                <div className="empty-icon-v5">
                                                                    <Search size={32} />
                                                                </div>
                                                                <h4 className="empty-title-v5">No Farmers Found</h4>
                                                                <p className="empty-subtitle-v5">We couldn't find any farmers matching your current filters or search query.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {sortedFarmers.length > 0 && (
                                        <div className="registry-footer-v5">
                                            <div className="footer-stats-v5">Showing <span className="highlight-v5">{indexOfFirstItem + 1}</span> to <span className="highlight-v5">{Math.min(indexOfLastItem, sortedFarmers.length)}</span> of <span className="highlight-v5">{sortedFarmers.length}</span> farmers</div>
                                            <div className="pagination-controls-v5">
                                                <button className="pagination-btn-v5" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
                                                <div className="pagination-pages-v5">
                                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                        <button key={page} className={`page-num-v5 ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
                                                    ))}
                                                </div>
                                                <button className="pagination-btn-v5" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'new' && (
                        <FarmerRegistrationForm 
                            onCancel={() => setActiveTab('list')}
                            onComplete={() => setActiveTab('list')}
                        />
                    )}
                </div>
            </main>

            <div className="help-widget-container" ref={helpWindowRef}>
                {isHelpOpen && (
                    <div className="help-popup-window">
                        <div className="help-popup-header">
                            <h4 className="help-popup-title">Platform Help & Support</h4>
                            <button className="help-close-btn" onClick={() => setIsHelpOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="help-popup-content">
                            <div className="help-section">
                                <h5 className="help-section-title"><Printer size={18} className="help-icon" /> Printing ID Cards</h5>
                                <p className="help-section-text">Navigate to the farmer's profile and click "Print ID" to generate a printable ID card.</p>
                            </div>
                        </div>
                        <div className="help-popup-footer" style={{ borderTop: '1px solid #f3f4f6', backgroundColor: '#f9fafb', fontSize: '13px', color: '#6b7280' }}>
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

export default FarmerRegistry;
