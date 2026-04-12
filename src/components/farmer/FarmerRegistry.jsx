import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import './FarmerDashboard.css';
import '../common/ContentArea.css';
import './FarmerRegistry.css';
import {
    Home, Users, User, MapPin, Bird, Sprout, Mountain, Shield, Download,
    Database, BarChart2, Settings, ChevronDown, Bell, Globe, HelpCircle, Info, Menu,
    TrendingUp, TrendingDown, Calendar, LogOut, Briefcase, Activity, Server, FileText, CloudRain, Sun, Moon, Languages, UserCircle, Landmark, Building2, LayoutDashboard, FileSpreadsheet, Beef, Wheat, X, History, ClipboardCheck, UserPlus, Search, Eye, Printer, Check, Edit, Trash2, Plus, CheckCircle, Clock, AlertCircle, Map, ShieldCheck, Timer, MoreVertical, Phone, Mail, ArrowUpDown, XCircle, Filter, Smartphone, Layout, Upload, ArrowLeft
} from 'lucide-react';

// Farmer-specific components
import FarmerSidebar from './FarmerSidebar';
import { StatCard } from './FarmerStats';
import ATILogo from '../ATILogo';
import TopHeader from '../common/TopHeader';
import PageHeader from '../common/PageHeader';
import FarmerRegistrationForm from './FarmerRegistrationForm';

const FarmerRegistry = ({
    userRole,
    onRoleChange,
    onLogout,
    overviewPath = '/dashboard/overview',
    extraSidebar = null,
    extraSidebarFooter = null,
}) => {
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
    const [editingFarmer, setEditingFarmer] = useState(null);
    const [viewingFarmer, setViewingFarmer] = useState(null);
    const [activeProfileTab, setActiveProfileTab] = useState('Personal Info');
    const [showIdPreview, setShowIdPreview] = useState(false);
    const [showRecordPreview, setShowRecordPreview] = useState(false);
    const [viewingDocument, setViewingDocument] = useState(null);
    const [docUploadType, setDocUploadType] = useState('Select Type...');
    const [docUploadFile, setDocUploadFile] = useState('');
    const [selectedFileObj, setSelectedFileObj] = useState(null);
    const [isDocTypeOpen, setIsDocTypeOpen] = useState(false);
    const fileInputRef = useRef(null);

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
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) setShowDownloadOptions(false);
            if (!event.target.closest('.actions-col')) setOpenActionMenuId(null);
            if (!event.target.closest('.custom-doc-select-v6')) setIsDocTypeOpen(false);
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
                age: `${25 + (i % 40)} Yrs`,
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

    const [farmers, setFarmers] = useState(() => {
        const savedFarmers = localStorage.getItem('oan_farmers');
        if (savedFarmers) {
            try {
                return JSON.parse(savedFarmers);
            } catch (e) {
                console.error("Failed to parse saved farmers", e);
                return generateFarmers();
            }
        }
        const initialFarmers = generateFarmers();
        localStorage.setItem('oan_farmers', JSON.stringify(initialFarmers));
        return initialFarmers;
    });

    // Save to localStorage whenever farmers change
    useEffect(() => {
        localStorage.setItem('oan_farmers', JSON.stringify(farmers));
    }, [farmers]);

    const handleNewRegistration = (newReg) => {
        // Map the form data to the registry list item structure
        // This simulates an API POST request and local state update

        if (editingFarmer) {
            // Handle Edit
            const updatedFarmers = farmers.map(f => {
                if (f.id === editingFarmer.id) {
                    return {
                        ...f,
                        ...newReg,
                        name: newReg.fullNameLatin || newReg.fullNameAmharic,
                        photo: newReg.photoUrl || f.photo,
                        phone: newReg.mobileNumber,
                        email: newReg.email || f.email,
                        acres: `${newReg.landHoldings || 0} Acres`,
                        crops: newReg.agricultureType || [],
                        age: newReg.dob ? `${new Date().getFullYear() - new Date(newReg.dob).getFullYear()} Yrs` : f.age
                    };
                }
                return f;
            });
            setFarmers(updatedFarmers);
        } else {
            // Handle New Registration
            const nextId = farmers.length > 0 ?
                Math.max(...farmers.map(f => parseInt(f.id.split('-').pop()) || 0)) + 1 : 1;

            const newEntry = {
                ...newReg,
                id: `OAN-FR-${nextId.toString().padStart(3, '0')}`,
                name: newReg.fullNameLatin || newReg.fullNameAmharic,
                photo: newReg.photoUrl || `https://randomuser.me/api/portraits/lego/${nextId % 10}.jpg`,
                gender: newReg.gender,
                age: newReg.dob ? `${new Date().getFullYear() - new Date(newReg.dob).getFullYear()} Yrs` : "32 Yrs",
                phone: newReg.mobileNumber,
                email: newReg.email || `${(newReg.fullNameLatin || "farmer").toLowerCase().replace(/\s/g, '.')}@example.com`,
                kebele: newReg.kebele,
                woreda: newReg.woreda,
                region: newReg.region,
                registeredDate: new Date().toISOString().split('T')[0],
                acres: `${newReg.landHoldings || 0} Acres`,
                crops: newReg.agricultureType || [],
                status: "Pending",
                kisanCard: "Active"
            };

            setFarmers([newEntry, ...farmers]);
        }

        setActiveTab('list');
        // Clear search to show the new entry at the top
        setSearchTerm('');
    };

    const handlePrintAction = () => {
        window.print();
    };

    const handleDownloadAction = (type, farmer) => {
        setExportMessage(`Preparing ${type} for ${farmer.name}...`);
        setTimeout(() => {
            setExportMessage(`${type} has been downloaded successfully.`);
            setTimeout(() => setExportMessage(null), 3000);
        }, 1500);
    };

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

    const handleDocumentUpload = () => {
        if (!docUploadFile || docUploadType === 'Select Type...') return;

        let docUrl = 'https://images.unsplash.com/photo-1586717791821-3f44a563cc4c?auto=format&fit=crop&q=80&w=1470';

        if (selectedFileObj) {
            // Live preview for current session
            docUrl = URL.createObjectURL(selectedFileObj);
        } else {
            // Persistent high-fidelity mockups for all document types
            if (docUploadType === 'National ID') {
                docUrl = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1074';
            } else if (docUploadType === 'Land Certificate') {
                docUrl = 'https://images.unsplash.com/photo-1621905252507-b35242f31fba?auto=format&fit=crop&q=80&w=1470';
            } else if (docUploadType === 'Family Proof') {
                docUrl = 'https://images.unsplash.com/photo-1600880212319-7524ebd7558e?auto=format&fit=crop&q=80&w=1470';
            } else if (docUploadType === 'Agriculture License') {
                docUrl = 'https://images.unsplash.com/photo-1595113316349-9fa4ee24f884?auto=format&fit=crop&q=80&w=1472';
            }
        }

        const newDoc = {
            id: Date.now(),
            name: docUploadFile,
            type: docUploadType,
            date: new Date().toISOString().split('T')[0],
            size: '1.2 MB',
            url: docUrl
        };

        const updatedFarmer = {
            ...viewingFarmer,
            documents: [newDoc, ...(viewingFarmer.documents || [])]
        };

        const updatedFarmers = farmers.map(f => f.id === viewingFarmer.id ? updatedFarmer : f);
        setFarmers(updatedFarmers);
        setViewingFarmer(updatedFarmer);
        setDocUploadFile('');
        setSelectedFileObj(null);
        setDocUploadType('Select Type...');
    };

    const handleSelectAll = (e) => {
        setSelectedFarmers(e.target.checked ? currentFarmers.map(f => f.id) : []);
    };

    const handleSelectFarmer = (id) => {
        setSelectedFarmers(selectedFarmers.includes(id) ? selectedFarmers.filter(fid => fid !== id) : [...selectedFarmers, id]);
    };

    const handleDownload = (doc) => {
        if (!doc || !doc.url) return;
        const link = document.createElement('a');
        link.href = doc.url;
        link.download = doc.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const requestSort = (key) => {
        setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    };

    const handleViewFarmer = (id) => {
        const farmerToView = farmers.find(f => f.id === id);
        if (farmerToView) {
            setViewingFarmer(farmerToView);
            setActiveTab('profile');
            setOpenActionMenuId(null);
        }
    };

    const handleEditRegistration = (id) => {
        const farmerToEdit = farmers.find(f => f.id === id);
        if (farmerToEdit) {
            setEditingFarmer(farmerToEdit);
            setActiveTab('new');
            setOpenActionMenuId(null);
        }
    };

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
                    <NavLink to={overviewPath} end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Home size={20} />
                        <span>Dashboard</span>
                    </NavLink>
                    {extraSidebar || <FarmerSidebar />}
                    {extraSidebarFooter}
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
                    <PageHeader
                        title="Farmer Registry"
                        subtitle={<>Manage and view <span className="highlight-text">Registered farmers</span> their land holdings, and scheme status.</>}
                        hideDateFilter={true}
                        hideDownload={true}
                        primaryAction={
                            <div className="registry-tabs-v6-wrapper">
                                <div className="registry-tabs-v6">
                                    <button
                                        className={`registry-tab-v6 ${activeTab === 'list' || activeTab === 'profile' ? 'active' : ''}`}
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



                                            <button className="add-farmer-btn-v6" onClick={() => setActiveTab('new')}>
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
                                                    <th className="checkbox-col"><div className="header-cell-checkbox"><input type="checkbox" className="modern-checkbox-s" onChange={handleSelectAll} checked={currentFarmers.length > 0 && selectedFarmers.length === currentFarmers.length} /></div></th>
                                                    <th onClick={() => requestSort('id')} className="id-col sortable-col"><div className="header-cell-standard">Farmer ID</div></th>
                                                    <th className="details-col"><div className="header-cell-standard">Farmer Details</div></th>
                                                    <th className="kebele-col"><div className="header-cell-standard">Kebele</div></th>
                                                    <th className="woreda-col"><div className="header-cell-standard">Woreda</div></th>
                                                    <th className="region-col">
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
                                                    <th className="agri-col">
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
                                                    <th className="status-col">
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
                                                    <th className="kisan-col">
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
                                                            <td className="checkbox-col" data-label="Select"><div className="td-cell-checkbox"><input type="checkbox" className="modern-checkbox-s" checked={selectedFarmers.includes(farmer.id)} onChange={() => handleSelectFarmer(farmer.id)} /></div></td>
                                                            <td className="id-col id-col-featured" data-label="Farmer ID">{farmer.id}</td>
                                                            <td className="details-col" data-label="Farmer Details">
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
                                                            <td className="kebele-col" data-label="Kebele">{farmer.kebele}</td>
                                                            <td className="woreda-col" data-label="Woreda">{farmer.woreda}</td>
                                                            <td className="region-col" data-label="Region">{farmer.region}</td>
                                                            <td className="agri-col" data-label="Agriculture Data"><div className="agri-data-stack"><div className="acre-text">{farmer.acres}</div><div className="crop-tags">{farmer.crops.map((c, i) => <span key={i} className="crop-tag-v2">{c}</span>)}</div></div></td>
                                                            <td className="status-col" data-label="Status"><div className={`status-pill-v4 ${farmer.status.toLowerCase()}`}>{farmer.status}</div></td>
                                                            <td className="kisan-col" data-label="Kisan Card"><div className={`kisan-badge-v4 ${farmer.kisanCard.toLowerCase()}`}>{farmer.kisanCard}</div></td>
                                                            <td className="actions-col" data-label="Actions">
                                                                <button className="dots-trigger-v5" onClick={() => setOpenActionMenuId(openActionMenuId === farmer.id ? null : farmer.id)}><MoreVertical size={18} /></button>
                                                                {openActionMenuId === farmer.id && (
                                                                    <div className="action-popup-v5">
                                                                        <button className="action-item-v5" onClick={() => handleViewFarmer(farmer.id)}><Eye size={16} /> View</button>
                                                                        <button className="action-item-v5" onClick={() => handleEditRegistration(farmer.id)}><Edit size={16} /> Edit</button>
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
                            initialData={editingFarmer}
                            onCancel={() => {
                                setEditingFarmer(null);
                                if (viewingFarmer) {
                                    setActiveTab('profile');
                                } else {
                                    setActiveTab('list');
                                }
                            }}
                            onComplete={(data) => {
                                handleNewRegistration(data);
                                setEditingFarmer(null);
                            }}
                        />
                    )}

                    {activeTab === 'profile' && viewingFarmer && (
                        <div className="farmer-profile-container-v6 animation-fadeIn">
                            <div
                                className="back-navigator-v6"
                                onClick={() => {
                                    setActiveTab('list');
                                    setViewingFarmer(null);
                                }}
                            >
                                <ArrowLeft size={18} />
                                <span>Back</span>
                            </div>

                            {/* Profile Header Card */}
                            <div className="profile-header-card-v6">
                                <div className="profile-header-top-v6">
                                    <div className="profile-main-info-v6">
                                        <div className="profile-avatar-wrapper-v6">
                                            <img src={viewingFarmer.photo} alt={viewingFarmer.name} className="profile-avatar-v6" />
                                        </div>
                                        <div className="profile-text-content-v6">
                                            <h2 className="profile-name-v6">{viewingFarmer.name}</h2>
                                            <div className="profile-subname-v6">Dereje Bekele</div>
                                            <div className="profile-badges-v6">
                                                <span className="profile-id-badge-v6">{viewingFarmer.id}</span>
                                                <span className={`status-pill-v4 ${viewingFarmer.status.toLowerCase()}`}>{viewingFarmer.status}</span>
                                                <span className="biometric-badge-v6">Biometric Enrolled</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="profile-header-actions-v6">
                                        <button className="profile-action-btn-v6" onClick={() => setShowRecordPreview(true)}><Eye size={16} /> Full Record Preview</button>
                                        <button className="profile-action-btn-v6" onClick={() => handleEditRegistration(viewingFarmer.id)}><Edit size={16} /> Edit</button>
                                        <button className="profile-action-btn-v6" onClick={() => setShowIdPreview(true)}><Printer size={16} /> Print ID</button>
                                    </div>
                                </div>

                                <div className="profile-header-stats-v6">
                                    <div className="header-stat-item-v6">
                                        <MapPin size={18} className="stat-icon-v6" />
                                        <div className="stat-details-v6">
                                            <span className="stat-label-v6">Location</span>
                                            <span className="stat-value-v6">{viewingFarmer.kebele}, {viewingFarmer.region}</span>
                                        </div>
                                    </div>
                                    <div className="header-stat-item-v6">
                                        <Calendar size={18} className="stat-icon-v6" />
                                        <div className="stat-details-v6">
                                            <span className="stat-label-v6">Registered</span>
                                            <span className="stat-value-v6">{viewingFarmer.registeredDate}</span>
                                        </div>
                                    </div>
                                    <div className="header-stat-item-v6">
                                        <Phone size={18} className="stat-icon-v6" />
                                        <div className="stat-details-v6">
                                            <span className="stat-label-v6">Phone</span>
                                            <span className="stat-value-v6">{viewingFarmer.phone}</span>
                                        </div>
                                    </div>
                                    <div className="header-stat-item-v6">
                                        <Users size={18} className="stat-icon-v6" />
                                        <div className="stat-details-v6">
                                            <span className="stat-label-v6">Household</span>
                                            <span className="stat-value-v6">6 members</span>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Main Content Layout */}
                            <div className="profile-layout-v6">
                                <div className="profile-main-pane-v6">
                                    {/* Tab Switcher Integrated with Content to match width */}
                                    <div className="profile-tab-switcher-v6">
                                        {['Personal Info', 'Household & Farming Profile', 'Documents', 'Activity Log'].map(tab => (
                                            <button
                                                key={tab}
                                                className={`profile-tab-btn-v6 ${activeProfileTab === tab ? 'active' : ''}`}
                                                onClick={() => setActiveProfileTab(tab)}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="pane-card-v6">
                                        {activeProfileTab === 'Personal Info' && (
                                            <>
                                                <div className="profile-section-v6">
                                                    <h3 className="pane-card-title-v6">Personal Information</h3>
                                                    <div className="profile-data-grid-v6">
                                                        <div className="data-item-v6"><span className="data-label-v6">Full Name (Amharic)</span><span className="data-value-v6">{viewingFarmer.fullNameAmharic || "—"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Full Name (Latin)</span><span className="data-value-v6">{viewingFarmer.name || "—"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Gender</span><span className="data-value-v6">{viewingFarmer.gender || "—"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Date of Birth</span><span className="data-value-v6">{viewingFarmer.dob || viewingFarmer.dateOfBirth || "—"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Age</span><span className="data-value-v6">{viewingFarmer.age || "—"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Primary Mobile</span><span className="data-value-v6">{viewingFarmer.phone || viewingFarmer.mobileNumber || "—"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Secondary Mobile</span><span className="data-value-v6">{viewingFarmer.alternateMobileNumber || "—"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Email Address</span><span className="data-value-v6">{viewingFarmer.email || "—"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Social Media</span><span className="data-value-v6">{viewingFarmer.socialMediaLink || "—"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">National ID</span><span className="data-value-v6">{viewingFarmer.nationalId || "—"}</span></div>
                                                    </div>
                                                </div>

                                                <div className="profile-section-v6 mt-32">
                                                    <h3 className="pane-card-title-v6">Location Information</h3>
                                                    <div className="profile-data-grid-v6">
                                                        <div className="data-item-v6"><span className="data-label-v6">Region</span><span className="data-value-v6">{viewingFarmer.region || "—"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Woreda</span><span className="data-value-v6">{viewingFarmer.woreda || "—"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Kebele</span><span className="data-value-v6">{viewingFarmer.kebele || "—"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Village</span><span className="data-value-v6">{viewingFarmer.village || "—"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">GPS Coordinates</span><span className="data-value-v6">{viewingFarmer.latitude && viewingFarmer.longitude ? `${viewingFarmer.latitude}, ${viewingFarmer.longitude}` : "—"}</span></div>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {activeProfileTab === 'Household & Farming Profile' && (
                                            <>
                                                <div className="profile-section-v6">
                                                    <h3 className="pane-card-title-v6">Household & Registration Status</h3>
                                                    <div className="profile-data-grid-v6">
                                                        <div className="data-item-v6"><span className="data-label-v6">Head of Household</span><span className="data-value-v6">{viewingFarmer.headOfHousehold ? "Yes (Head)" : "No"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Household Size</span><span className="data-value-v6">{viewingFarmer.familyMembers || viewingFarmer.householdSize || "6 members"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Farmer Card Status</span><span className="data-value-v6"><span className={`status-badge-v6 ${viewingFarmer.status?.toLowerCase() === 'active' ? 'verified' : 'pending'}`}>{viewingFarmer.farmerCardStatus || "Active"}</span></span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Registration Status</span><span className="data-value-v6"><span className={`status-badge-v6 ${viewingFarmer.status?.toLowerCase() === 'verified' ? 'verified' : 'pending'}`}>{viewingFarmer.status || "Pending"}</span></span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Dwelling Type</span><span className="data-value-v6">{viewingFarmer.dwellingType || "Semi-Permanent"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Mobile Ownership</span><span className="data-value-v6">{viewingFarmer.mobileOwnership || "Yes (Smart Phone)"}</span></div>
                                                    </div>
                                                </div>

                                                <div className="profile-section-v6 mt-32">
                                                    <h3 className="pane-card-title-v6">Farming Profile & Economics</h3>
                                                    <div className="profile-data-grid-v6">
                                                        <div className="data-item-v6"><span className="data-label-v6">Primary Farming Activity</span><span className="data-value-v6">{viewingFarmer.primaryActivity || viewingFarmer.primaryFarmingActivity || "Mixed Farming"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Total Agri (Acres)</span><span className="data-value-v6">{viewingFarmer.landHoldings || viewingFarmer.acres || "3.5"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Annual Income Value</span><span className="data-value-v6">{viewingFarmer.incomeValue ? `${viewingFarmer.incomeValue} ${viewingFarmer.incomeCurrency?.code || 'ETB'}` : "120,000 ETB"}</span></div>
                                                        <div className="data-item-v6"><span className="data-label-v6">Distance to Market</span><span className="data-value-v6">{viewingFarmer.distanceToMarket || "4.5 km"}</span></div>

                                                        <div className="data-item-v6 full-width-v6 mt-8">
                                                            <span className="data-label-v6">Cooperative Membership</span>
                                                            <div className="tag-cloud-v6 mt-8">
                                                                {(viewingFarmer.cooperatives || ['Urban Vegetable Growers', 'Grain Supply Union']).map(c => (
                                                                    <span key={c} className="tag-item-v6">{c}</span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="data-item-v6 full-width-v6 mt-8">
                                                            <span className="data-label-v6">Agriculture Type</span>
                                                            <div className="tag-cloud-v6 mt-8">
                                                                {(viewingFarmer.agricultureType || ['Millet', 'Maize', 'Cotton', 'Sugarcane', 'Mustard', 'Vegetables']).map(c => (
                                                                    <span key={c} className="tag-item-v6 secondary">{c}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {activeProfileTab === 'Documents' && (
                                            <>
                                                <div className="doc-header-v6">
                                                    <h3 className="pane-card-title-v6 no-margin">Uploaded Documents</h3>
                                                    <div className="doc-upload-controls-v6">
                                                        <div className="custom-doc-select-v6" style={{ position: 'relative' }}>
                                                            <div
                                                                className={`doc-type-trigger-v6 ${isDocTypeOpen ? 'open' : ''}`}
                                                                onClick={() => setIsDocTypeOpen(!isDocTypeOpen)}
                                                            >
                                                                <span>{docUploadType}</span>
                                                                <ChevronDown size={16} className={`chevron-v6 ${isDocTypeOpen ? 'open' : ''}`} />
                                                            </div>
                                                            {isDocTypeOpen && (
                                                                <div className="doc-type-list-v6 animation-fadeInUp-v6">
                                                                    {['National ID', 'Land Certificate', 'Family Proof', 'Agriculture License'].map(type => (
                                                                        <div
                                                                            key={type}
                                                                            className="doc-type-item-v6"
                                                                            onClick={() => {
                                                                                setDocUploadType(type);
                                                                                setIsDocTypeOpen(false);
                                                                            }}
                                                                        >
                                                                            {type}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="upload-composite-v6">
                                                            <input
                                                                type="file"
                                                                ref={fileInputRef}
                                                                style={{ display: 'none' }}
                                                                onChange={(e) => {
                                                                    if (e.target.files && e.target.files[0]) {
                                                                        setDocUploadFile(e.target.files[0].name);
                                                                        setSelectedFileObj(e.target.files[0]);
                                                                    }
                                                                }}
                                                            />
                                                            <div className="composite-input-v6" onClick={() => fileInputRef.current?.click()}>
                                                                <Upload size={14} style={{ marginRight: '10px', opacity: 0.6 }} />
                                                                <span style={{ color: docUploadFile ? '#1e293b' : '#64748b', fontSize: '14px', fontWeight: docUploadFile ? '600' : '400' }}>
                                                                    {docUploadFile || "Choose photo..."}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <button
                                                            className="doc-submit-btn-v6"
                                                            onClick={handleDocumentUpload}
                                                            disabled={!docUploadFile || docUploadType === 'Select Type...'}
                                                        >
                                                            Submit
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="document-list-v6">
                                                    {(viewingFarmer.documents || [
                                                        { id: 1, name: 'National_ID_Scan.png', date: '2024-02-01', size: '1.2 MB', type: 'National ID', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1074' },
                                                        { id: 2, name: 'Land_Holding_Cert.png', date: '2024-01-15', size: '3.4 MB', type: 'Land Certificate', url: 'https://images.unsplash.com/photo-1621905252507-b35242f31fba?auto=format&fit=crop&q=80&w=1470' }
                                                    ]).map(doc => (
                                                        <div className="doc-item-v6" key={doc.id}>
                                                            {doc.type === 'National ID' ? <FileText size={20} className="doc-icon-v6" /> : <Layout size={20} className="doc-icon-v6" />}
                                                            <div className="doc-info-v6">
                                                                <span className="doc-name-v6">{doc.name}</span>
                                                                <span className="doc-meta-v6">Uploaded on: {doc.date} • {doc.size}</span>
                                                            </div>
                                                            <div className="doc-actions-v6 horizontal">
                                                                <button
                                                                    className="doc-action-btn-v6 view-text"
                                                                    onClick={() => setViewingDocument(doc)}
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button
                                                                    className="doc-action-btn-v6 download-text"
                                                                    onClick={() => handleDownload(doc)}
                                                                >
                                                                    <Download size={16} />
                                                                </button>
                                                                <button
                                                                    className="doc-action-btn-v6 delete-text"
                                                                    onClick={() => {
                                                                        const updatedDocs = (viewingFarmer.documents || []).filter(d => d.id !== doc.id);
                                                                        const updatedFarmer = { ...viewingFarmer, documents: updatedDocs };
                                                                        const updatedFarmers = farmers.map(f => f.id === viewingFarmer.id ? updatedFarmer : f);
                                                                        setFarmers(updatedFarmers);
                                                                        setViewingFarmer(updatedFarmer);
                                                                    }}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {activeProfileTab === 'Activity Log' && (
                                            <>
                                                <h3 className="pane-card-title-v6">Activity Log</h3>
                                                <div className="timeline-v6">
                                                    <div className="timeline-item-v6">
                                                        <div className="timeline-dot-v6"></div>
                                                        <div className="timeline-content-v6">
                                                            <span className="timeline-date-v6">2024-04-09 10:45 AM</span>
                                                            <span className="timeline-title-v6">Biometric Enrollment Completed</span>
                                                            <span className="timeline-desc-v6">Official: Abera Tadesse (ID: OAN-FR-1347)</span>
                                                        </div>
                                                    </div>
                                                    <div className="timeline-item-v6">
                                                        <div className="timeline-dot-v6"></div>
                                                        <div className="timeline-content-v6">
                                                            <span className="timeline-date-v6">2024-04-08 09:20 AM</span>
                                                            <span className="timeline-title-v6">Profile Created</span>
                                                            <span className="timeline-desc-v6">Self-registration via Mobile App</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="profile-side-pane-v6">
                                    <div className="pane-card-v6">
                                        <h3 className="pane-card-title-v6">Summary</h3>
                                        <div className="summary-list-v6">
                                            <div className="summary-item-v6">
                                                <div className="summary-icon-v6 green"><MapPin size={20} /></div>
                                                <div className="summary-details-v6">
                                                    <span className="summary-label-v6">Total Land</span>
                                                    <span className="summary-value-v6">3.2 ha</span>
                                                </div>
                                            </div>
                                            <div className="summary-item-v6">
                                                <div className="summary-icon-v6 orange"><Activity size={20} /></div>
                                                <div className="summary-details-v6">
                                                    <span className="summary-label-v6">Livestock</span>
                                                    <span className="summary-value-v6">6 animals</span>
                                                </div>
                                            </div>
                                            <div className="summary-item-v6">
                                                <div className="summary-icon-v6 green"><Wheat size={20} /></div>
                                                <div className="summary-details-v6">
                                                    <span className="summary-label-v6">Active Crops</span>
                                                    <span className="summary-value-v6">3 crops</span>
                                                </div>
                                            </div>
                                            <div className="summary-item-v6">
                                                <div className="summary-icon-v6 blue"><Activity size={20} /></div>
                                                <div className="summary-details-v6">
                                                    <span className="summary-label-v6">Last Updated</span>
                                                    <span className="summary-value-v6">2024-02-10</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Document Viewer Modal */}
            {viewingDocument && (
                <div className="doc-modal-overlay-v6" onClick={() => setViewingDocument(null)}>
                    <div className="doc-modal-window-v6" onClick={(e) => e.stopPropagation()}>
                        <div className="doc-modal-header-v6">
                            <h3 className="doc-modal-title-v6">{viewingDocument.name}</h3>
                            <div className="doc-modal-controls-v6">
                                <button
                                    className="doc-modal-btn-v6"
                                    onClick={() => handleDownload(viewingDocument)}
                                >
                                    <Download size={18} /> Download
                                </button>
                                <button className="doc-modal-close-v6" onClick={() => setViewingDocument(null)}><X size={20} /></button>
                            </div>
                        </div>
                        <div className="doc-modal-body-v6">
                            <img
                                src={viewingDocument.url}
                                alt={viewingDocument.name}
                                className="doc-preview-img-v6"
                                onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1586717791821-3f44a563cc4c?auto=format&fit=crop&q=80&w=1470';
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

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
                {/* ID Card Preview Modal */}
                {showIdPreview && (
                    <div className="modal-overlay-v6" onClick={() => setShowIdPreview(false)}>
                        <div className="id-preview-modal-v6" onClick={e => e.stopPropagation()}>
                            <div className="id-modal-header-v6">
                                <div className="header-left-v6">
                                    <h2 className="id-modal-title-v6">Farmer ID Card Preview</h2>
                                    <p className="id-modal-subtitle-v6">OAN Card for {viewingFarmer.name}</p>
                                </div>
                                <div className="header-actions-v6">
                                    <button
                                        className="id-action-btn-v6 secondary"
                                        onClick={() => handleDownloadAction("ID Card PDF", viewingFarmer)}
                                    >
                                        <Download size={18} /> Download PDF
                                    </button>
                                    <button
                                        className="id-action-btn-v6 primary"
                                        onClick={handlePrintAction}
                                    >
                                        <Printer size={18} /> Print
                                    </button>
                                    <button className="id-close-btn-v6" onClick={() => setShowIdPreview(false)}><X size={20} /></button>
                                </div>
                            </div>

                            <div className="id-preview-content-v6">
                                <div className="id-preview-container-v6">
                                    <div className="id-preview-section-v6">
                                        <span className="preview-label-v6">Front</span>
                                        <div className="farmer-id-card-front-v6">
                                            <div className="id-card-header-v6">
                                                <div className="id-logo-box-v6"><Wheat size={20} color="#ffffff" /></div>
                                                <div className="id-org-info-v6">
                                                    <span className="id-country-v6">Ethiopia</span>
                                                    <span className="id-platform-v6">OpenAgriNet</span>
                                                </div>
                                            </div>
                                            <div className="id-card-body-v6">
                                                <div className="id-card-label-v6">Full Name</div>
                                                <div className="id-field-value-v6">{viewingFarmer.name}</div>
                                                <div className="id-field-value-am-v6">ደሬጄ በቀለ {viewingFarmer.name}</div>

                                                <div className="id-card-grid-v6">
                                                    <div>
                                                        <div className="id-card-label-v6">Farmer ID</div>
                                                        <div className="id-card-small-value-v6">{viewingFarmer.id}</div>
                                                    </div>
                                                    <div>
                                                        <div className="id-card-label-v6">Registered</div>
                                                        <div className="id-card-small-value-v6">{viewingFarmer.registeredDate}</div>
                                                    </div>
                                                </div>
                                                <div className="id-location-info-v6">
                                                    {viewingFarmer.region} • {viewingFarmer.woreda} • {viewingFarmer.kebele}
                                                </div>
                                            </div>
                                            {/* Decorative Pattern Icon */}
                                            <div className="id-bg-pattern-v6"><Wheat size={180} /></div>
                                        </div>
                                    </div>

                                    <div className="id-preview-section-v6">
                                        <span className="preview-label-v6">Back</span>
                                        <div className="farmer-id-card-back-v6">
                                            <div className="qr-container-v6">
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${viewingFarmer.id}`} alt="QR Code" className="id-qr-v6" />
                                                <div className="qr-id-text-v6">{viewingFarmer.id}</div>
                                            </div>
                                            <div className="qr-instruction-v6">Scan QR code to view digital profile</div>

                                            <div className="id-back-footer-v6">
                                                <div className="footer-orgs-v6">
                                                    <div className="footer-org-v6">
                                                        <strong>OpenAgriNet</strong>
                                                        <span>Digital Agriculture</span>
                                                    </div>
                                                    <div className="footer-org-v6 text-right">
                                                        <strong>Ministry of Agriculture</strong>
                                                        <span>Federal Republic of Ethiopia</span>
                                                    </div>
                                                </div>
                                                <div className="footer-stamp-v6"><Wheat size={16} /></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                <div className="id-print-instructions-v6 mt-32">
                                    <h4 className="instructions-title-v6">Print Instructions</h4>
                                    <ul className="instructions-list-v6">
                                        <li>Use CR80 card stock (85.6mm × 53.98mm / 3.370" × 2.125")</li>
                                        <li>Print at 300 DPI for optimal quality</li>
                                        <li>Use color printer for best results</li>
                                        <li>Consider laminating for durability</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Full Record Preview Modal (Step 4 Style) */}
                {showRecordPreview && (
                    <div className="modal-overlay-v6" onClick={() => setShowRecordPreview(false)}>
                        <div className="id-preview-modal-v6 record-preview-modal-v6" onClick={e => e.stopPropagation()}>
                            <div className="id-modal-header-v6">
                                <div className="header-left-v6">
                                    <h2 className="id-modal-title-v6">Farmer Registration Record</h2>
                                    <p className="id-modal-subtitle-v6">Full profile preview for {viewingFarmer.name}</p>
                                </div>
                                <div className="header-actions-v6">
                                    <button
                                        className="id-action-btn-v6 secondary"
                                        onClick={() => handleDownloadAction("Record PDF", viewingFarmer)}
                                    >
                                        <Download size={18} /> Download PDF
                                    </button>
                                    <button
                                        className="id-action-btn-v6 primary"
                                        onClick={handlePrintAction}
                                    >
                                        <Printer size={18} /> Print Record
                                    </button>
                                    <button className="id-close-btn-v6" onClick={() => setShowRecordPreview(false)}><X size={20} /></button>
                                </div>
                            </div>

                            <div className="id-preview-content-v6">
                                <div className="preview-record-grid-v6">
                                    {/* Personal Info Section */}
                                    <div className="preview-section-card-v6">
                                        <div className="section-head-v6"><User size={18} /> <span>Personal Information</span></div>
                                        <div className="preview-data-list-v6">
                                            <div className="p-data-item-v6"><span>Amharic Name</span><strong>ደሬጄ በቀለ {viewingFarmer.name}</strong></div>
                                            <div className="p-data-item-v6"><span>Gender</span><strong>{viewingFarmer.gender}</strong></div>
                                            <div className="p-data-item-v6"><span>Age</span><strong>{viewingFarmer.age}</strong></div>
                                            <div className="p-data-item-v6"><span>Mobile</span><strong>{viewingFarmer.phone}</strong></div>
                                            <div className="p-data-item-v6"><span>National ID</span><strong>{viewingFarmer.nationalId || "ETH-7728-29"}</strong></div>
                                        </div>
                                    </div>

                                    {/* Location Info Section */}
                                    <div className="preview-section-card-v6">
                                        <div className="section-head-v6"><MapPin size={18} /> <span>Location Details</span></div>
                                        <div className="preview-data-list-v6">
                                            <div className="p-data-item-v6"><span>Region</span><strong>{viewingFarmer.region}</strong></div>
                                            <div className="p-data-item-v6"><span>Woreda</span><strong>{viewingFarmer.woreda}</strong></div>
                                            <div className="p-data-item-v6"><span>Kebele</span><strong>{viewingFarmer.kebele}</strong></div>
                                            <div className="p-data-item-v6"><span>Farm Coordinates</span><strong>9.0123 / 38.7612</strong></div>
                                        </div>
                                    </div>

                                    {/* Household & Farming Section */}
                                    <div className="preview-section-card-v6 full-width-preview-v6">
                                        <div className="section-head-v6"><Users size={18} /> <span>Household & Farming Profile</span></div>
                                        <div className="preview-data-grid-cols-3-v6">
                                            <div className="p-data-item-v6"><span>Head of Household</span><strong>Yes</strong></div>
                                            <div className="p-data-item-v6"><span>Household Size</span><strong>6 members</strong></div>
                                            <div className="p-data-item-v6"><span>Dwelling Type</span><strong>Semi-Permanent</strong></div>
                                            <div className="p-data-item-v6"><span>Total Agri (Acres)</span><strong>3.5</strong></div>
                                            <div className="p-data-item-v6"><span>Farming Activity</span><strong>Mixed Farming</strong></div>
                                            <div className="p-data-item-v6"><span>Annual Income</span><strong>120,000 ETB</strong></div>
                                        </div>
                                        <div className="preview-tags-section-v6 mt-16">
                                            <div className="p-data-item-v6 mb-8"><span>Agriculture Types</span></div>
                                            <div className="tag-cloud-v6">
                                                {['Millet', 'Maize', 'Cotton', 'Sugarcane', 'Mustard', 'Vegetables'].map(t => (
                                                    <span key={t} className="tag-item-v6 secondary">{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Section */}
                                    <div className="preview-section-card-v6 full-width-preview-v6 highlight-section-v6">
                                        <div className="section-head-v6"><ShieldCheck size={18} /> <span>System & Compliance Status</span></div>
                                        <div className="preview-data-grid-cols-3-v6">
                                            <div className="p-data-item-v6"><span>Farmer Card</span><span className="status-badge-v6 verified">Active</span></div>
                                            <div className="p-data-item-v6"><span>Reg. Status</span><span className="status-badge-v6 pending">Pending</span></div>
                                            <div className="p-data-item-v6"><span>Biometric</span><strong>Enrolled</strong></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FarmerRegistry;
